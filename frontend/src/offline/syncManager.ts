import { offlineDB, SyncQueueItem, OfflineAttendanceRecord, OfflineObservation, AdminNotification, OfflineStaffData } from './indexedDB';
import { DatabaseService } from '../services/database';

export interface SyncMetrics {
  isOnline: boolean;
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  isDataReady: boolean;
}

type SyncListener = (metrics: SyncMetrics) => void;

class SyncManager {
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncingState: boolean = false;
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      this.syncInterval = setInterval(() => this.checkNetworkAndSync(), 15000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.emitStatus();
    return () => this.listeners.delete(listener);
  }

  private async emitStatus(): Promise<void> {
    const queue = await offlineDB.getPendingSyncQueue();
    const pendingCount = queue.filter(q => q.status === 'PENDING').length;
    const failedCount = queue.filter(q => q.status === 'FAILED').length;
    const staffData = await offlineDB.getStaffData('u-staff-001');

    const metrics: SyncMetrics = {
      isOnline: this.isOnlineState,
      pendingCount,
      failedCount,
      isSyncing: this.isSyncingState,
      lastSyncedAt: staffData?.lastSyncedAt || null,
      isDataReady: Boolean(staffData?.isReady),
    };

    this.listeners.forEach(l => l(metrics));
  }

  private async handleNetworkChange(online: boolean) {
    if (online) {
      this.isOnlineState = true;
      this.processSyncQueue();
    } else {
      this.isOnlineState = false;
    }
    this.emitStatus();
  }

  public async checkNetworkAndSync(): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.isOnlineState = true;
      await this.processSyncQueue();
    } else {
      this.isOnlineState = false;
    }
    this.emitStatus();
  }

  public async prepareOfflineData(staffId: string = 'u-staff-001'): Promise<OfflineStaffData> {
    try {
      if (!this.isOnlineState) {
        const cached = await offlineDB.getStaffData(staffId);
        if (cached) return cached;
        throw new Error('Offline attendance data is not ready. Please connect to the internet once to synchronize your assigned students.');
      }

      const profile = await DatabaseService.getProfile(staffId);
      const assignedBatches = await DatabaseService.getBatches(staffId);
      const assignedBatchIds = new Set(assignedBatches.map(b => b.id));
      const allStudents = await DatabaseService.getStudents();
      const assignedStudents = allStudents.filter(s => s.current_batch_id && assignedBatchIds.has(s.current_batch_id));

      const sessions = await DatabaseService.getClassSessions();
      for (const session of sessions) {
        if (assignedBatchIds.has(session.batch_id)) {
          const records = await DatabaseService.getAttendanceForSession(session.id);
          for (const rec of records) {
            await offlineDB.saveAttendanceRecord({
              id: rec.id || `att-${session.session_date}-${rec.student_id}-${session.batch_id}`,
              student_id: rec.student_id,
              student_name: rec.student_name,
              batch_id: session.batch_id,
              batch_name: session.batch_name,
              attendance_date: session.session_date,
              status: rec.status,
              staff_id: staffId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_status: 'SYNCED',
              operation_id: `synced-${rec.id}`,
            });
          }
        }
      }

      const nowStr = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const staffData: OfflineStaffData = {
        staffId,
        profile,
        assignedBatches,
        assignedStudents,
        lastSyncedAt: nowStr,
        isReady: true,
      };

      await offlineDB.saveStaffData(staffData);
      this.emitStatus();
      return staffData;
    } catch (e: any) {
      console.error('Failed to prepare offline data:', e);
      throw e;
    }
  }

  public async saveAttendance(
    batchId: string,
    batchName: string,
    date: string,
    records: Array<{ student_id: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' }>,
    staffId: string = 'u-staff-001'
  ): Promise<{ offline: boolean; operationId: string }> {
    const timestamp = new Date().toISOString();
    const operationId = `att-op-${date}-${batchId}-${Date.now()}`;

    for (const item of records) {
      const recordId = `att-${date}-${item.student_id}-${batchId}`;
      const record: OfflineAttendanceRecord = {
        id: recordId,
        student_id: item.student_id,
        batch_id: batchId,
        batch_name: batchName,
        attendance_date: date,
        status: item.status,
        staff_id: staffId,
        created_at: timestamp,
        updated_at: timestamp,
        sync_status: 'PENDING',
        operation_id: operationId,
      };
      await offlineDB.saveAttendanceRecord(record);
    }

    const queueItem: SyncQueueItem = {
      operation_id: operationId,
      operation_type: 'CREATE_ATTENDANCE',
      payload: { batchId, batchName, date, records, staffId },
      created_at: timestamp,
      retry_count: 0,
      status: 'PENDING',
    };
    await offlineDB.addToSyncQueue(queueItem);

    this.emitStatus();

    if (this.isOnlineState) {
      this.processSyncQueue();
    }

    return { offline: !this.isOnlineState, operationId };
  }

  public async saveObservation(
    studentId: string,
    studentName: string,
    batchId: string,
    batchName: string,
    date: string,
    category: string,
    description: string,
    staffId: string = 'u-staff-001',
    staffName: string = 'Mrs. Priya Sharma'
  ): Promise<{ offline: boolean; operationId: string }> {
    if (!description.trim()) {
      throw new Error('Description is required for an observation.');
    }

    const timestamp = new Date().toISOString();
    const operationId = `obs-op-${studentId}-${Date.now()}`;
    const obsId = `obs-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const obs: OfflineObservation = {
      id: obsId,
      student_id: studentId,
      student_name: studentName,
      batch_id: batchId,
      batch_name: batchName,
      attendance_date: date,
      staff_id: staffId,
      staff_name: staffName,
      category,
      description: description.trim(),
      created_at: timestamp,
      sync_status: 'PENDING',
      operation_id: operationId,
    };

    await offlineDB.saveObservation(obs);

    const queueItem: SyncQueueItem = {
      operation_id: operationId,
      operation_type: 'CREATE_OBSERVATION',
      payload: obs,
      created_at: timestamp,
      retry_count: 0,
      status: 'PENDING',
    };
    await offlineDB.addToSyncQueue(queueItem);

    this.emitStatus();

    if (this.isOnlineState) {
      this.processSyncQueue();
    }

    return { offline: !this.isOnlineState, operationId };
  }

  public async processSyncQueue(): Promise<void> {
    if (this.isSyncingState || !this.isOnlineState) return;

    this.isSyncingState = true;
    this.emitStatus();

    try {
      const queue = await offlineDB.getPendingSyncQueue();

      for (const item of queue) {
        try {
          item.status = 'PROCESSING';
          await offlineDB.updateSyncQueueItem(item);

          if (item.operation_type === 'CREATE_ATTENDANCE') {
            const { batchId, date, records, staffId } = item.payload;
            const sessions = await DatabaseService.getClassSessions({ date });
            let session = sessions.find(s => s.batch_id === batchId);
            if (!session && sessions.length > 0) {
              session = sessions[0];
            }

            if (session) {
              await DatabaseService.saveAttendance(session.id, records, staffId);
            }

            for (const r of records) {
              const recordId = `att-${date}-${r.student_id}-${batchId}`;
              const localRec = (await offlineDB.getAllAttendanceRecords()).find(rec => rec.id === recordId);
              if (localRec) {
                localRec.sync_status = 'SYNCED';
                await offlineDB.saveAttendanceRecord(localRec);
              }
            }
          } else if (item.operation_type === 'CREATE_OBSERVATION') {
            const obs: OfflineObservation = item.payload;
            await DatabaseService.createObservation(obs);

            const notif: AdminNotification = {
              id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              title: '🔔 New Student Observation',
              message: `Student: ${obs.student_name || 'Student'} | Batch: ${obs.batch_name || 'Batch'} | Staff: ${obs.staff_name || 'Staff'}\n${obs.description}`,
              student_name: obs.student_name || 'Student',
              batch_name: obs.batch_name || 'Batch',
              staff_name: obs.staff_name || 'Staff',
              category: obs.category,
              description: obs.description,
              created_at: obs.created_at,
              is_read: false,
              sync_status: 'SYNCED',
            };
            await offlineDB.saveAdminNotification(notif);
            await DatabaseService.createAdminNotification(notif);

            obs.sync_status = 'SYNCED';
            await offlineDB.saveObservation(obs);
          }

          await offlineDB.removeSyncQueueItem(item.operation_id);
        } catch (err: any) {
          console.error(`Failed to process sync item ${item.operation_id}:`, err);
          item.status = 'FAILED';
          item.retry_count += 1;
          item.last_error = err.message || 'Network sync error';
          await offlineDB.updateSyncQueueItem(item);
        }
      }
    } finally {
      this.isSyncingState = false;
      this.emitStatus();
    }
  }
}

export const syncManager = new SyncManager();
