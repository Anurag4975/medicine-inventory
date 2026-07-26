// src/utils/appCache.js

import { cacheManager } from "./cacheManager";
import { offlineQueue } from "./offlineQueue";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";

// ============================================================================
// CACHE KEYS (Single source of truth)
// ============================================================================
export const CACHE_KEYS = {
  STOCK: "app_stock_data",
  TODAYS_PATIENTS: "app_todays_patients",
  PATIENT_QUEUE: "app_patient_queue",
  DOCTORS: "app_doctors",
  LAB_TESTS: "app_lab_tests",
  PATIENT_PREFIX: "app_patient_",
  USER_ROLE: "app_user_role",
};

// ============================================================================
// Event System
// ============================================================================
const listeners = new Map();

export const cacheEvents = {
  on(key, callback) {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);
    return () => {
      const set = listeners.get(key);
      if (set) set.delete(callback);
    };
  },

  emit(key, data) {
    const set = listeners.get(key);
    if (set) {
      set.forEach((callback) => callback(data));
    }
  },
};

// ============================================================================
// Centralized App Cache
// ============================================================================
class AppCache {
  constructor() {
    this.stockUnsubscribe = null;
    this.patientsUnsubscribe = null;
    this.queueUnsubscribe = null;
    this.isInitialized = false;
    this.stockData = [];
    this.patientsData = [];
  }

  initialize() {
    if (this.isInitialized) {
      console.log("🔄 AppCache already initialized");
      // Emit cached data immediately for late subscribers
      if (this.stockData.length > 0) {
        cacheEvents.emit(CACHE_KEYS.STOCK, this.stockData);
      }
      if (this.patientsData.length > 0) {
        cacheEvents.emit(CACHE_KEYS.TODAYS_PATIENTS, this.patientsData);
      }
      return;
    }

    console.log("🚀 Starting shared real-time listeners");
    this.isInitialized = true;
    this.startStockListener();
    this.startTodaysPatientsListener();
    this.startPatientQueueListener();
  }

  // =========================================================================
  // STOCK - Single listener for entire app
  // =========================================================================
  startStockListener() {
    // Serve cached data first
    cacheManager.get(CACHE_KEYS.STOCK).then((cached) => {
      if (cached && cached.length > 0) {
        this.stockData = cached;
        cacheEvents.emit(CACHE_KEYS.STOCK, cached);
      }
    });

    const q = query(collection(db, "Stock"), where("quantity", ">", 0));

    this.stockUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const stockData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          price:
            doc.data().pricePerTab ||
            doc.data().price ||
            doc.data().sellingPrice ||
            0,
          medicineName: doc.data().medicineName || "Unknown",
        }));

        this.stockData = stockData;
        cacheManager.set(CACHE_KEYS.STOCK, stockData, 10 * 60 * 1000);
        cacheEvents.emit(CACHE_KEYS.STOCK, stockData);
        console.log(`📦 Stock synced: ${stockData.length} items`);
      },
      (error) => {
        console.error("Stock listener error:", error);
        if (this.stockData.length > 0) {
          cacheEvents.emit(CACHE_KEYS.STOCK, this.stockData);
        }
      },
    );
  }

  // =========================================================================
  // TODAY'S PATIENTS
  // =========================================================================
  startTodaysPatientsListener() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Serve cached data first
    cacheManager.get(CACHE_KEYS.TODAYS_PATIENTS).then((cached) => {
      if (cached && cached.length > 0) {
        this.patientsData = cached;
        cacheEvents.emit(CACHE_KEYS.TODAYS_PATIENTS, cached);
      }
    });

    const q = query(
      collection(db, "Patients"),
      where("appointmentDate", "==", todayStr),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    this.patientsUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const patientData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        this.patientsData = patientData;
        cacheManager.set(
          CACHE_KEYS.TODAYS_PATIENTS,
          patientData,
          5 * 60 * 1000,
        );
        cacheEvents.emit(CACHE_KEYS.TODAYS_PATIENTS, patientData);
        console.log(`👨‍⚕️ Patients synced: ${patientData.length}`);
      },
      (error) => {
        console.error("Patients listener error:", error);
        if (this.patientsData.length > 0) {
          cacheEvents.emit(CACHE_KEYS.TODAYS_PATIENTS, this.patientsData);
        }
      },
    );
  }

  // =========================================================================
  // PATIENT QUEUE - Active consultations
  // =========================================================================
  startPatientQueueListener() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const q = query(
      collection(db, "Patients"),
      where("appointmentDate", "==", todayStr),
      where("status", "in", [
        "waiting",
        "waiting-for-results",
        "in-progress",
        "test-completed",
      ]),
      orderBy("createdAt", "asc"),
    );

    this.queueUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const queueData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        cacheEvents.emit(CACHE_KEYS.PATIENT_QUEUE, queueData);
      },
      (error) => {
        console.error("Queue listener error:", error);
      },
    );
  }

  // =========================================================================
  // Get cached data (for direct access)
  // =========================================================================
  getCachedStock() {
    return this.stockData;
  }

  getCachedPatients() {
    return this.patientsData;
  }

  // =========================================================================
  // Fetch doctors (cached)
  // =========================================================================
  async getDoctors() {
    const cached = await cacheManager.get(CACHE_KEYS.DOCTORS);
    if (cached) return cached;

    try {
      const { getDocs } = await import("firebase/firestore");
      const snapshot = await getDocs(collection(db, "Doctors"));
      const doctorMap = {};
      snapshot.forEach((doc) => {
        doctorMap[doc.id] = doc.data();
      });

      await cacheManager.set(CACHE_KEYS.DOCTORS, doctorMap, 60 * 60 * 1000);
      return doctorMap;
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      return cached || {};
    }
  }

  // =========================================================================
  // Get single patient
  // =========================================================================
  async getPatient(patientId) {
    const key = CACHE_KEYS.PATIENT_PREFIX + patientId;
    const cached = await cacheManager.get(key);
    if (cached) return cached;

    try {
      const { getDoc } = await import("firebase/firestore");
      const docSnap = await getDoc(doc(db, "Patients", patientId));
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        await cacheManager.set(key, data, 2 * 60 * 1000);
        return data;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch patient:", error);
      return cached || null;
    }
  }

  // =========================================================================
  // Invalidate cache
  // =========================================================================
  async invalidateStock() {
    this.stockData = [];
    await cacheManager.clear(CACHE_KEYS.STOCK);
  }

  async invalidatePatients() {
    this.patientsData = [];
    await cacheManager.clear(CACHE_KEYS.TODAYS_PATIENTS);
  }

  async invalidatePatient(patientId) {
    await cacheManager.clear(CACHE_KEYS.PATIENT_PREFIX + patientId);
  }

  // =========================================================================
  // Get status
  // =========================================================================
  getStatus() {
    return {
      ...cacheManager.getStatus(),
      queueStatus: offlineQueue.getStatus(),
    };
  }

  // =========================================================================
  // Cleanup
  // =========================================================================
  destroy() {
    if (this.stockUnsubscribe) {
      this.stockUnsubscribe();
      this.stockUnsubscribe = null;
    }
    if (this.patientsUnsubscribe) {
      this.patientsUnsubscribe();
      this.patientsUnsubscribe = null;
    }
    if (this.queueUnsubscribe) {
      this.queueUnsubscribe();
      this.queueUnsubscribe = null;
    }
    this.isInitialized = false;
  }
}

export const appCache = new AppCache();
