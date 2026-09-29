import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { Device } from '../../types/device';
import {
  getDevice,
  testDeviceConnection,
  testSavedDeviceConnection,
} from '../../api/devicesApi';

export default function DeviceDetailView() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDevice = async () => {
    if (!deviceId) {
      setDevice(null);
      setError('No device was selected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getDevice(deviceId);

      setDevice(data);
    } catch (err) {
      console.error('Failed to load biometric device:', err);

      setDevice(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load biometric device.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!deviceId) {
      return;
    }

    try {
      setTestingConnection(true);
      setConnectionMessage(null);

      await testSavedDeviceConnection(deviceId);

      setConnectionMessage('Device connection successful.');
    } catch (err) {
      console.error('Failed to test biometric device connection:', err);

      setConnectionMessage(
        err instanceof Error
          ? err.message
          : 'Could not connect to the biometric device.'
      );
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    loadDevice();
  }, [deviceId]);

  if (loading) {
    return (
      <div>
        <p style={{ color: 'var(--text-muted)' }}>
          Loading device...
        </p>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div>
        <p style={{ color: 'var(--text-muted)' }}>
          {error ?? 'Device not found.'}
        </p>

        <button
          className="btn"
          type="button"
          onClick={() => navigate('/devices')}
          style={{ marginTop: 12 }}
        >
          Back to Devices
        </button>
      </div>
    );
  }

  const statusText = device.enabled
    ? 'Enabled'
    : 'Disabled';

  const statusClass = device.enabled
    ? 'badge badge-in'
    : 'badge badge-out';

  const branchName =
    device.branchName || device.branchCode || '-';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <button
            className="link-btn"
            type="button"
            onClick={() => navigate('/devices')}
            style={{ marginBottom: 12 }}
          >
            ← Back to Devices
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <h2 style={{ margin: 0 }}>
              {device.deviceName}
            </h2>

            <span className={statusClass}>
              {statusText}
            </span>
          </div>

          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {device.companyId} &gt; {branchName} • S/N:{' '}
            {device.serialNumber || '-'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            className="btn"
            type="button"
            onClick={() =>
              navigate(`/devices/${device.deviceId}/edit`)
            }
          >
            Edit Device
          </button>

          <button
            className="btn"
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
          >
            {testingConnection
              ? 'Testing...'
              : 'Test Connection'}
          </button>

          <button
            className="btn-primary"
            type="button"
          >
            Sync Logs Now
          </button>
        </div>
      </div>

      {connectionMessage && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          {connectionMessage}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div
            className="card"
            style={{ padding: 20 }}
          >
            <h4 style={{ marginTop: 0 }}>
              Network & Communications
            </h4>

            <DetailRow
              label="IP Address"
              value={device.ipAddress}
            />

            <DetailRow
              label="TCP Port"
              value={`${device.port}${device.port === 4370 ? ' (Default)' : ''
                }`}
            />

            <DetailRow
              label="Comms Key"
              value={String(device.commKey)}
            />

            <DetailRow
              label="Device Number"
              value={String(device.deviceNumber)}
            />

            <DetailRow
              label="Device Manufacturer"
              value={device.manufacturer || '-'}
            />

            <DetailRow
              label="Model / Hardware"
              value={device.model || '-'}
            />

            <DetailRow
              label="Device Type"
              value={device.deviceType || '-'}
            />

            <DetailRow
              label="Serial Number"
              value={device.serialNumber || '-'}
              last
            />
          </div>

          <div
            className="card"
            style={{ padding: 20 }}
          >
            <h4 style={{ marginTop: 0 }}>
              Device Configuration
            </h4>

            <div
              style={{
                display: 'flex',
                gap: 40,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div className="stat-label">
                  Device Status
                </div>

                <div style={{ fontWeight: 700 }}>
                  {device.enabled
                    ? 'Enabled'
                    : 'Disabled'}
                </div>
              </div>

              <div>
                <div className="stat-label">
                  Synchronization
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    color: device.automaticSync
                      ? 'var(--green)'
                      : 'var(--text-muted)',
                  }}
                >
                  {device.automaticSync
                    ? 'Automatic'
                    : 'Manual'}
                </div>
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{ padding: 20 }}
          >
            <h4 style={{ marginTop: 0 }}>
              Company & Site
            </h4>

            <DetailRow
              label="Company"
              value={device.companyId}
            />

            <DetailRow
              label="Division"
              value={device.divisionId}
            />

            <DetailRow
              label="Department"
              value={device.departmentId}
            />

            <DetailRow
              label="Branch Code"
              value={device.branchCode}
            />

            <DetailRow
              label="Branch Name"
              value={branchName}
              last
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div className="stat-card">
              <div className="stat-label">
                Automatic Sync
              </div>

              <div className="stat-value">
                {device.automaticSync ? 'ON' : 'OFF'}
              </div>

              <div
                className={
                  device.automaticSync
                    ? 'stat-sub stat-sub-green'
                    : 'stat-sub'
                }
              >
                {device.automaticSync
                  ? 'Synchronization enabled'
                  : 'Manual synchronization'}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                Device Number
              </div>

              <div className="stat-value">
                {device.deviceNumber}
              </div>

              <div className="stat-sub">
                ZKTeco device identifier
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{ padding: 20 }}
          >
            <h4 style={{ marginTop: 0 }}>
              Device Information
            </h4>

            <DetailRow
              label="Device ID"
              value={device.deviceId}
            />

            <DetailRow
              label="Created"
              value={formatDate(device.createdAt)}
            />

            <DetailRow
              label="Last Updated"
              value={
                device.updatedAt
                  ? formatDate(device.updatedAt)
                  : 'Never'
              }
            />

            <DetailRow
              label="Connection"
              value={`${device.ipAddress}:${device.port}`}
            />

            <DetailRow
              label="Synchronization"
              value={
                device.automaticSync
                  ? 'Automatic'
                  : 'Manual'
              }
              last
            />
          </div>

          <div
            className="card"
            style={{ padding: 20 }}
          >
            <h4 style={{ marginTop: 0 }}>
              Recent Communication Logs
            </h4>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              No communication logs are available yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: last
          ? 'none'
          : '1px solid var(--border)',
        gap: 20,
      }}
    >
      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontWeight: 600,
          fontSize: 14,
          textAlign: 'right',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}