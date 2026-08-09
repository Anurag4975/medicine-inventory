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
// CACHE KEYS
// ============================================================================
export const CACHE_KEYS = {
  STOCK: "app_stock_data",
  TODAYS_PATIENTS: "app_todays_patients",
  PATIENT_QUEUE: "app_patient_queue",
  DOCTORS: "app_doctors",
  LAB_TESTS: "app_lab_tests",
  LAB_ORDERS: "app_lab_orders",
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
// Centralized App Cache (Single source of truth for all components)
// ============================================================================
class AppCache {
  constructor() {
    this.stockUnsubscribe = null;
    this.patientsUnsubscribe = null;
    this.queueUnsubscribe = null;
    this.labOrdersUnsubscribe = null;
    this.isInitialized = false;
    this.stockData = [];
    this.patientsData = [];
    this.labOrdersData = [];
    this.readCount = 0;
    this.lastReadLog = Date.now();
  }

  // =========================================================================
  // Initialize all listeners ONCE
  // =========================================================================
  initialize() {
    if (this.isInitialized) {
      // Emit cached data for late subscribers
      if (this.stockData.length > 0)
        cacheEvents.emit(CACHE_KEYS.STOCK, this.stockData);
      if (this.patientsData.length > 0)
        cacheEvents.emit(CACHE_KEYS.TODAYS_PATIENTS, this.patientsData);
      if (this.labOrdersData.length > 0)
        cacheEvents.emit(CACHE_KEYS.LAB_ORDERS, this.labOrdersData);
      return;
    }

    console.log(
      "🚀 AppCache: Starting 4 shared listeners (Stock, Patients, Queue, LabOrders)",
    );
    this.isInitialized = true;
    this.startStockListener();
    this.startTodaysPatientsListener();
    this.startPatientQueueListener();
    this.startLabOrdersListener();
  }

  // =========================================================================
  // Read tracking (helps identify infinite loops)
  // =========================================================================
  trackRead(count = 1) {
    this.readCount += count;
    const now = Date.now();
    if (now - this.lastReadLog > 30000) {
      console.log(
        `📊 Total reads this session: ${this.readCount.toLocaleString()}`,
      );
      this.lastReadLog = now;
    }
  }

  getReadCount() {
    return this.readCount;
  }

  // =========================================================================
  // STOCK - Single listener for all components
  // =========================================================================
  startStockListener() {
    // Serve cache instantly
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
        this.trackRead(snapshot.docs.length);
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
        console.log(`📦 Stock: ${stockData.length} items`);
      },
      (error) => {
        console.error("Stock listener error:", error);
        if (this.stockData.length > 0)
          cacheEvents.emit(CACHE_KEYS.STOCK, this.stockData);
      },
    );
  }

  // =========================================================================
  // TODAY'S PATIENTS
  // =========================================================================
  startTodaysPatientsListener() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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
        this.trackRead(snapshot.docs.length);
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
        console.log(`👨‍⚕️ Patients: ${patientData.length}`);
      },
      (error) => {
        console.error("Patients listener error:", error);
        if (this.patientsData.length > 0)
          cacheEvents.emit(CACHE_KEYS.TODAYS_PATIENTS, this.patientsData);
      },
    );
  }

  // =========================================================================
  // PATIENT QUEUE - Active consultations only
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
        this.trackRead(snapshot.docs.length);
        const queueData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        cacheEvents.emit(CACHE_KEYS.PATIENT_QUEUE, queueData);
      },
      (error) => console.error("Queue listener error:", error),
    );
  }

  // =========================================================================
  // LAB ORDERS - Only pending billing (limit 10)
  // =========================================================================
  // In src/utils/appCache.js, update startLabOrdersListener:
  startLabOrdersListener() {
    cacheManager.get(CACHE_KEYS.LAB_ORDERS).then((cached) => {
      if (cached && cached.length > 0) {
        this.labOrdersData = cached;
        cacheEvents.emit(CACHE_KEYS.LAB_ORDERS, cached);
      }
    });

    // Include ALL active orders - pending-billing, pending-collection, processing, AND completed
    const q = query(
      collection(db, "labOrders"),
      where("orderStatus", "in", [
        "pending-billing",
        "pending-collection",
        "processing",
        "completed", // ← ADD completed
      ]),
      limit(30),
    );

    this.labOrdersUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by createdAt descending
        ordersData.sort((a, b) => {
          const aTime =
            a.createdAt?.toDate?.()?.getTime() ||
            a.createdAt?.seconds * 1000 ||
            0;
          const bTime =
            b.createdAt?.toDate?.()?.getTime() ||
            b.createdAt?.seconds * 1000 ||
            0;
          return bTime - aTime;
        });

        this.labOrdersData = ordersData;
        cacheManager.set(CACHE_KEYS.LAB_ORDERS, ordersData, 5 * 60 * 1000);
        cacheEvents.emit(CACHE_KEYS.LAB_ORDERS, ordersData);
        console.log(`🧪 Lab Orders synced: ${ordersData.length}`);
      },
      (error) => {
        console.error("Lab orders listener error:", error);
        if (this.labOrdersData.length > 0) {
          cacheEvents.emit(CACHE_KEYS.LAB_ORDERS, this.labOrdersData);
        }
      },
    );
  }
  // =========================================================================
  // Get cached data (instant, no reads)
  // =========================================================================
  getCachedStock() {
    return this.stockData;
  }
  getCachedPatients() {
    return this.patientsData;
  }
  getCachedLabOrders() {
    return this.labOrdersData;
  }

  // =========================================================================
  // Fetch doctors (cached, only reads once per hour)
  // =========================================================================
  async getDoctors() {
    const cached = await cacheManager.get(CACHE_KEYS.DOCTORS);
    if (cached) return cached;

    try {
      const { getDocs } = await import("firebase/firestore");
      const snapshot = await getDocs(collection(db, "Doctors"));
      this.trackRead(snapshot.docs.length);
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
  // Get single patient (cached 2 min)
  // =========================================================================
  async getPatient(patientId) {
    const key = CACHE_KEYS.PATIENT_PREFIX + patientId;
    const cached = await cacheManager.get(key);
    if (cached) return cached;

    try {
      const { getDoc } = await import("firebase/firestore");
      const docSnap = await getDoc(doc(db, "Patients", patientId));
      this.trackRead(1);
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
  // Invalidate cache (forces refresh on next read)
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

  async invalidateLabOrders() {
    this.labOrdersData = [];
    await cacheManager.clear(CACHE_KEYS.LAB_ORDERS);
  }

  // =========================================================================
  // Get status (for OfflineIndicator)
  // =========================================================================
  getStatus() {
    return {
      ...cacheManager.getStatus(),
      queueStatus: offlineQueue.getStatus(),
      readCount: this.readCount,
    };
  }

  // =========================================================================
  // Cleanup all listeners
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
    if (this.labOrdersUnsubscribe) {
      this.labOrdersUnsubscribe();
      this.labOrdersUnsubscribe = null;
    }
    this.isInitialized = false;
    console.log("🔌 AppCache: All listeners destroyed");
  }
}

export const appCache = new AppCache();
