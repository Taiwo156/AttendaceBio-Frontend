import type {
  DeviceSyncResult,
  DeviceSyncStatus,
} from '../types/Devicesync';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 

interface Envelope<T> {
  status: string;
  code: string;
  message: string;
  data: T;
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  let body: Envelope<T> | null = null;

  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(
      body?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return body?.data as T;
}

export async function getSyncStatuses(): Promise<DeviceSyncStatus[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/devices/sync-status`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Failed to load device sync statuses. Status: ${response.status}`
    );
  }

  return await response.json();
}

export function syncDevice(
  deviceId: string
): Promise<DeviceSyncResult> {
  return request<DeviceSyncResult>(
    `/api/devices/${encodeURIComponent(deviceId)}/sync`,
    { method: 'POST' }
  );
}

export async function setDeviceEnabled(
  deviceId: string,
  enabled: boolean
): Promise<void> {
  await request<unknown>(
    `/api/devices/${encodeURIComponent(deviceId)}/enabled`,
    {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }
  );
}

export async function deleteDevice(deviceId: string): Promise<void> {
  await request<unknown>(
    `/api/devices/${encodeURIComponent(deviceId)}`,
    { method: 'DELETE' }
  );
}