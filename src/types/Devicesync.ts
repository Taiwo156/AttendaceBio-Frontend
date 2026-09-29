export type ConnectionStatus =
  | 'Online'
  | 'Warning'
  | 'Failed'
  | 'Disabled'
  | 'Unknown';

export interface DeviceSyncStatus {
  deviceId: string;
  connectionStatus: ConnectionStatus;
  isSyncing: boolean;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastPunchTime: string | null;
  lastStatus: 'Success' | 'Failed' | null;
  lastError: string | null;
  lastFetched: number;
  lastProcessed: number;
}

export type SyncOutcome =
  | 'Success'
  | 'Failed'
  | 'Busy'
  | 'Disabled'
  | 'NotFound';

export interface DeviceSyncResult {
  deviceId: string;
  deviceName: string;
  status: SyncOutcome;
  message: string;
  fetched: number;
  newPunches: number;
  processed: number;
  failed: number;
  startedAt: string;
  finishedAt: string;
}