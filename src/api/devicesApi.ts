import type { Device } from '../types/device';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface StatusMessage<T> {
  status: string;
  code: string | null;
  message: string;
  data: T | null;
}

export interface CreateDeviceRequest {
  companyId: string;
  divisionId: string;
  departmentId: string;
  branchCode: string;

  deviceName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;

  deviceNumber: number;
  deviceType: string;

  ipAddress: string;
  port: number;
  commKey: number;

  enabled: boolean;
  automaticSync: boolean;
}

export interface Company {
  companyId: string;
  companyName: string;
}

export interface CompanyBranch {
  companyId: string;
  divisionId: string;
  departmentId: string;
  branchCode: string;
  branchName: string;
}

export async function getCompanies(): Promise<Company[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/companies`
  );

  const result =
    await handleResponse<StatusMessage<Company[]>>(
      response
    );

  return result.data ?? [];
}

export async function getCompanyBranches(
  companyId: string
): Promise<CompanyBranch[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/companies/${encodeURIComponent(companyId)}/branches`
  );

  const result =
    await handleResponse<StatusMessage<CompanyBranch[]>>(
      response
    );

  return result.data ?? [];
}

export type UpdateDeviceRequest = CreateDeviceRequest;

async function handleResponse<T>(
  response: Response
): Promise<T> {
  const text = await response.text();

  console.log('API STATUS: - devicesApi.ts:82', response.status);
  console.log('API URL: - devicesApi.ts:83', response.url);
  console.log('API RAW RESPONSE: - devicesApi.ts:84', text);

  let result: any;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned non-JSON response. HTTP ${response.status}: ${text.substring(0, 300)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return result as T;
}

export async function getDevices(): Promise<Device[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/devices`
  );

  const result =
    await handleResponse<StatusMessage<Device[]>>(response);

  return result.data ?? [];
}

export async function getDevice(
  deviceId: string
): Promise<Device> {
  const response = await fetch(
    `${API_BASE_URL}/api/devices/${deviceId}`
  );

  const result =
    await handleResponse<StatusMessage<Device>>(response);

  if (!result.data) {
    throw new Error('Device was not found.');
  }

  return result.data;
}

export async function createDevice(
  request: CreateDeviceRequest
): Promise<Device> {
  const response = await fetch(
    `${API_BASE_URL}/api/devices`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

  const result =
    await handleResponse<StatusMessage<Device>>(response);

  if (!result.data) {
    throw new Error('Device was created but no device data was returned.');
  }

  return result.data;
}

export async function updateDevice(
  deviceId: string,
  request: UpdateDeviceRequest
): Promise<Device> {
  const response = await fetch(
    `${API_BASE_URL}/api/devices/${deviceId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

  const result =
    await handleResponse<StatusMessage<Device>>(response);

  if (!result.data) {
    throw new Error('Device was updated but no device data was returned.');
  }

  return result.data;
}

export async function deleteDevice(
  deviceId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/devices/${deviceId}`,
    {
      method: 'DELETE',
    }
  );

  await handleResponse<StatusMessage<null>>(response);
}

export async function testDeviceConnection(
  request: CreateDeviceRequest
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/devices/test-connection`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

  const text = await response.text();

  console.log(
    'TEST CONNECTION STATUS:',
    response.status
  );

  console.log(
    'TEST CONNECTION RESPONSE:',
    text
  );

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${text}`
    );
  }
}

export async function testSavedDeviceConnection(
  deviceId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/devices/${encodeURIComponent(deviceId)}/test-connection`,
    {
      method: 'POST',
    }
  );

  const text = await response.text();

  console.log(
    'SAVED DEVICE TEST CONNECTION STATUS:',
    response.status
  );

  console.log(
    'SAVED DEVICE TEST CONNECTION RESPONSE:',
    text
  );

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const result = JSON.parse(text);

      if (result?.message) {
        message = result.message;
      }
    } catch {
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }
}