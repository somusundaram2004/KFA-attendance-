// IndexedDB Offline Storage for KFA Staff Attendance

const DB_NAME = 'kfa_attendance_offline_db';
const DB_VERSION = 1;

export interface OfflineStaffData {
  staffId: string;
  profile: any;
  assignedBatches: any[];
  assignedStudents: any[];
  lastSyncedAt: string;
  isReady: boolean;
}

export interface OfflineAttendanceRecord {
  id: string; // operation_id or composite key: att-date-student-batch
  student_id: string;
  student_name?: string;
  batch_id: string;
  batch_name?: string;
  attendance_date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  staff_id: string;
  created_at: string;
  updated_at: string;
  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
  operation_id: string;
}

export interface OfflineObservation {
  id: string;
  student_id: string;
  student_name?: string;
  batch_id: string;
  batch_name?: string;
  attendance_date: string;
  staff_id: string;
  staff_name?: string;
  category: string;
  description: string;
  created_at: string;
  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
  operation_id: string;
}

export interface SyncQueueItem {
  operation_id: string;
  operation_type: 'CREATE_ATTENDANCE' | 'UPDATE_ATTENDANCE' | 'CREATE_OBSERVATION';
  payload: any;
  created_at: string;
  retry_count: number;
  status: 'PENDING' | 'FAILED' | 'PROCESSING';
  last_error?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  student_name: string;
  batch_name: string;
  staff_name: string;
  category: string;
  description: string;
  created_at: string;
  is_read: boolean;
  sync_status: 'SYNCED' | 'PENDING';
}

class OfflineDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Staff Data cache
          if (!db.objectStoreNames.contains('staff_data')) {
            db.createObjectStore('staff_data', { keyPath: 'staffId' });
          }

          // Attendance Records store
          if (!db.objectStoreNames.contains('attendance_records')) {
            const attStore = db.createObjectStore('attendance_records', { keyPath: 'id' });
            attStore.createIndex('batch_date', ['batch_id', 'attendance_date'], { unique: false });
            attStore.createIndex('student_batch_date', ['student_id', 'batch_id', 'attendance_date'], { unique: false });
            attStore.createIndex('sync_status', 'sync_status', { unique: false });
          }

          // Student Observations store
          if (!db.objectStoreNames.contains('observations')) {
            const obsStore = db.createObjectStore('observations', { keyPath: 'id' });
            obsStore.createIndex('batch_date', ['batch_id', 'attendance_date'], { unique: false });
            obsStore.createIndex('sync_status', 'sync_status', { unique: false });
          }

          // Sync Queue
          if (!db.objectStoreNames.contains('sync_queue')) {
            const queueStore = db.createObjectStore('sync_queue', { keyPath: 'operation_id' });
            queueStore.createIndex('status', 'status', { unique: false });
            queueStore.createIndex('created_at', 'created_at', { unique: false });
          }

          // Admin Notifications store
          if (!db.objectStoreNames.contains('admin_notifications')) {
            const notifStore = db.createObjectStore('admin_notifications', { keyPath: 'id' });
            notifStore.createIndex('created_at', 'created_at', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  // --- STAFF DATA CACHE ---
  async saveStaffData(data: OfflineStaffData): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('staff_data', 'readwrite');
      const store = tx.objectStore('staff_data');
      const req = store.put(data);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getStaffData(staffId: string): Promise<OfflineStaffData | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('staff_data', 'readonly');
        const store = tx.objectStore('staff_data');
        const req = store.get(staffId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  // --- ATTENDANCE RECORDS ---
  async saveAttendanceRecord(record: OfflineAttendanceRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('attendance_records', 'readwrite');
      const store = tx.objectStore('attendance_records');
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAttendanceForBatchAndDate(batchId: string, date: string): Promise<OfflineAttendanceRecord[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('attendance_records', 'readonly');
        const store = tx.objectStore('attendance_records');
        const index = store.index('batch_date');
        const req = index.getAll([batchId, date]);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async getAllAttendanceRecords(): Promise<OfflineAttendanceRecord[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('attendance_records', 'readonly');
        const store = tx.objectStore('attendance_records');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  // --- OBSERVATIONS ---
  async saveObservation(obs: OfflineObservation): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('observations', 'readwrite');
      const store = tx.objectStore('observations');
      const req = store.put(obs);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getObservationsForBatchAndDate(batchId: string, date: string): Promise<OfflineObservation[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('observations', 'readonly');
        const store = tx.objectStore('observations');
        const index = store.index('batch_date');
        const req = index.getAll([batchId, date]);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async getAllObservations(): Promise<OfflineObservation[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('observations', 'readonly');
        const store = tx.objectStore('observations');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  // --- SYNC QUEUE ---
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const req = store.getAll();
        req.onsuccess = () => {
          const items: SyncQueueItem[] = req.result || [];
          resolve(items.filter(i => i.status !== 'PROCESSING'));
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async removeSyncQueueItem(operationId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.delete(operationId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- ADMIN NOTIFICATIONS ---
  async saveAdminNotification(notification: AdminNotification): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('admin_notifications', 'readwrite');
      const store = tx.objectStore('admin_notifications');
      const req = store.put(notification);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAdminNotifications(): Promise<AdminNotification[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('admin_notifications', 'readonly');
        const store = tx.objectStore('admin_notifications');
        const req = store.getAll();
        req.onsuccess = () => {
          const notifs: AdminNotification[] = req.result || [];
          notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          resolve(notifs);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }
}

export const offlineDB = new OfflineDB();
