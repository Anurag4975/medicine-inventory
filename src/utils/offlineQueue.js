// src/utils/offlineQueue.js

class OfflineQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.loadQueue();

    window.addEventListener("online", () => {
      console.log("🟢 Back online - processing queued operations");
      this.processQueue();
    });
  }

  async loadQueue() {
    try {
      const saved = localStorage.getItem("offline_queue");
      if (saved) {
        this.queue = JSON.parse(saved);
        console.log(`📋 Loaded ${this.queue.length} queued operations`);
      }
    } catch (e) {
      console.error("Failed to load offline queue:", e);
    }
  }

  async saveQueue() {
    try {
      localStorage.setItem("offline_queue", JSON.stringify(this.queue));
    } catch (e) {
      console.error("Failed to save offline queue:", e);
    }
  }

  async enqueue(operation) {
    this.queue.push({
      ...operation,
      id: Date.now().toString(),
      timestamp: Date.now(),
      retryCount: 0,
    });
    await this.saveQueue();
    console.log(`📝 Queued: ${operation.type}`);

    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    console.log(`🔄 Processing ${this.queue.length} queued operations...`);

    const failedOps = [];

    for (const op of this.queue) {
      try {
        await this.executeOperation(op);
        console.log(`✅ Completed: ${op.type}`);
      } catch (error) {
        console.error(`❌ Failed: ${op.type}`, error);
        op.retryCount++;
        if (op.retryCount < 5) {
          failedOps.push(op);
        }
      }
    }

    this.queue = failedOps;
    await this.saveQueue();
    this.processing = false;
  }

  async executeOperation(operation) {
    const { db } = await import("../firebase");
    const { doc, setDoc, updateDoc, writeBatch, collection } =
      await import("firebase/firestore");

    switch (operation.type) {
      case "update_patient":
        await updateDoc(
          doc(db, "Patients", operation.patientId),
          operation.data,
        );
        break;

      case "sale":
        const batch = writeBatch(db);
        const saleRef = doc(collection(db, "Sales"));
        batch.set(saleRef, operation.data.saleData);
        if (operation.data.stockUpdates) {
          operation.data.stockUpdates.forEach((update) => {
            batch.update(doc(db, "Stock", update.id), update.data);
          });
        }
        await batch.commit();
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  getStatus() {
    return {
      pending: this.queue.length,
      processing: this.processing,
    };
  }
}

export const offlineQueue = new OfflineQueue();
