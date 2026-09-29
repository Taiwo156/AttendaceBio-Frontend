import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Device } from '../../types/device';
import type {
  ConnectionStatus,
  DeviceSyncResult,
  DeviceSyncStatus,
} from '../../types/Devicesync';
import { getDevices } from '../../api/devicesApi';
import {
  deleteDevice,
  getSyncStatuses,
  setDeviceEnabled,
  syncDevice,
} from '../../api/DeviceSyncApi';

type DisplayStatus = ConnectionStatus | 'Syncing';
type ToastKind = 'success' | 'error' | 'info';

interface ToastState {
  kind: ToastKind;
  title: string;
  message: string;
}

const STATUS_REFRESH_MS = 30000;
const TOAST_DURATION_MS = 6000;

const STATUS_LABELS: Record<DisplayStatus, string> = {
  Online: 'Online',
  Warning: 'Warning',
  Failed: 'Offline',
  Disabled: 'Disabled',
  Syncing: 'Syncing',
  Unknown: 'Not synced',
};

const NEUTRAL_BADGE: CSSProperties = {
  background: '#f1f5f9',
  color: '#64748b',
};

const SYNCING_BADGE: CSSProperties = {
  background: '#e0f2fe',
  color: '#0369a1',
};

const TOAST_STYLES: Record<
  ToastKind,
  { background: string; border: string; title: string; text: string; icon: string }
> = {
  success: {
    background: '#ecfdf5',
    border: '#a7f3d0',
    title: '#065f46',
    text: '#047857',
    icon: '#10b981',
  },
  error: {
    background: '#fef2f2',
    border: '#fecaca',
    title: '#991b1b',
    text: '#b91c1c',
    icon: '#ef4444',
  },
  info: {
    background: '#eff6ff',
    border: '#bfdbfe',
    title: '#1e40af',
    text: '#1d4ed8',
    icon: '#3b82f6',
  },
};

const ACTION_COLORS = {
  edit: '#f59e0b',
  sync: '#16a34a',
  retry: '#dc2626',
  disabled: '#94a3b8',
};

const SUB_TEXT_STYLE: CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
};

function badgeFor(status: DisplayStatus): {
  className: string;
  style?: CSSProperties;
} {
  switch (status) {
    case 'Online':
      return { className: 'badge badge-in' };
    case 'Warning':
      return { className: 'badge badge-warning' };
    case 'Failed':
      return { className: 'badge badge-out' };
    case 'Syncing':
      return { className: 'badge', style: SYNCING_BADGE };
    default:
      return { className: 'badge', style: NEUTRAL_BADGE };
  }
}

function timeAgo(iso: string | null | undefined, now: number): string {
  if (!iso) {
    return '';
  }

  const diff = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return 'just now';
  }

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function escapeCsv(value: string | number): string {
  const text = String(value ?? '');

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) => row.map(escapeCsv).join(','))
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const checkboxStyle: CSSProperties = {
  width: 16,
  height: 16,
  padding: 0,
  margin: 0,
  cursor: 'pointer',
};

export default function DevicesView() {
  const navigate = useNavigate();

  const [devices, setDevices] = useState<Device[]>([]);
  const [statuses, setStatuses] = useState<Record<string, DeviceSyncStatus>>({});
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('All Branches');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [now, setNow] = useState(Date.now());

  const showToast = useCallback(
    (kind: ToastKind, title: string, message: string) => {
      setToast({ kind, title, message });
    },
    []
  );

  const loadStatuses = useCallback(async () => {
    try {
      const list = await getSyncStatuses();
      const map: Record<string, DeviceSyncStatus> = {};

      list.forEach((status) => {
        map[status.deviceId] = status;
      });

      setStatuses(map);
    } catch (err) {
      console.error('Failed to load device sync status:', err);
    }

    setNow(Date.now());
  }, []);

  const loadDevices = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const [data] = await Promise.all([getDevices(), loadStatuses()]);

      setDevices(data);

      setSelected((previous) => {
        const ids = new Set(data.map((device) => device.deviceId));

        return new Set(Array.from(previous).filter((id) => ids.has(id)));
      });
    } catch (err) {
      console.error('Failed to load biometric devices:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load biometric devices.'
      );

      setDevices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadStatuses();
    }, STATUS_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [loadStatuses]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const baseStatus = (device: Device): ConnectionStatus => {
    if (!device.enabled) {
      return 'Disabled';
    }

    const status = statuses[device.deviceId]?.connectionStatus;

    if (!status || status === 'Disabled') {
      return 'Unknown';
    }

    return status;
  };

  const displayStatus = (device: Device): DisplayStatus => {
    if (
      device.enabled &&
      (syncingIds.has(device.deviceId) ||
        statuses[device.deviceId]?.isSyncing)
    ) {
      return 'Syncing';
    }

    return baseStatus(device);
  };

  const sites = useMemo(() => {
    const uniqueSites = new Set(
      devices
        .map((device) => device.branchName || device.branchCode)
        .filter((site) => site && site.trim() !== '')
    );

    return ['All Branches', ...uniqueSites];
  }, [devices]);

  const filtered = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return devices.filter((device) => {
      const matchesSearch =
        !searchValue ||
        device.deviceName.toLowerCase().includes(searchValue) ||
        device.model.toLowerCase().includes(searchValue) ||
        device.manufacturer.toLowerCase().includes(searchValue) ||
        device.ipAddress.toLowerCase().includes(searchValue) ||
        device.companyId.toLowerCase().includes(searchValue) ||
        device.branchCode.toLowerCase().includes(searchValue);

      const siteName = device.branchName || device.branchCode;

      const matchesSite =
        siteFilter === 'All Branches' ||
        siteName === siteFilter;

      return matchesSearch && matchesSite;
    });
  }, [devices, search, siteFilter]);

  const selectedDevices = useMemo(
    () => devices.filter((device) => selected.has(device.deviceId || (device as any).id)),
    [devices, selected]
  );

  const totalDevices = devices.length;

  const enabledCount = devices.filter((device) => device.enabled).length;

  const disabledCount = totalDevices - enabledCount;

  const onlineCount = devices.filter(
    (device) => baseStatus(device) === 'Online'
  ).length;

  const offlineCount = devices.filter(
    (device) => baseStatus(device) === 'Failed'
  ).length;

  const warningCount = devices.filter(
    (device) => baseStatus(device) === 'Warning'
  ).length;

  const uptimePercent =
    enabledCount > 0
      ? Math.round((onlineCount / enabledCount) * 1000) / 10
      : 0;

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((device) => selected.has(device.deviceId));

  const toggleSelected = (deviceId: string) => {
    setSelected((previous) => {
      const next = new Set(previous);

      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.add(deviceId);
      }

      return next;
    });
  };

  const toggleAll = () => {
    setSelected((previous) => {
      const next = new Set(previous);

      if (allFilteredSelected) {
        filtered.forEach((device) => next.delete(device.deviceId || (device as any).id));
      } else {
        filtered.forEach((device) => next.add(device.deviceId || (device as any).id));
      }

      return next;
    });
  };

  const runSync = async (device: Device): Promise<DeviceSyncResult> => {
    const activeId = device.deviceId || (device as any).id;

    if (!activeId) {
      showToast('error', 'Sync failed', `${device.deviceName || 'Device'} has no ID.`);
      throw new Error('Device ID is missing.');
    }
    setSyncingIds((previous) => new Set(previous).add(activeId));

    try {
      return await syncDevice(activeId);
    } finally {
      setSyncingIds((previous) => {
        const next = new Set(previous);

        next.delete(activeId);

        return next;
      });
    }
  };

  const handleSync = async (device: Device) => {
    const activeId = device.deviceId || (device as any).id;
    if (!device.enabled || syncingIds.has(activeId) || bulkBusy) {
      return;
    }

    try {
      const result = await runSync(device);

      await loadStatuses();

      if (result.status === 'Success') {
        showToast(
          'success',
          'Sync completed',
          `${device.deviceName} synced successfully at ${formatClock(
            result.finishedAt
          )}. ${result.message}`
        );
      } else if (result.status === 'Busy') {
        showToast(
          'info',
          'Sync already running',
          `${device.deviceName} is already syncing. Try again in a moment.`
        );
      } else {
        showToast(
          'error',
          'Sync failed',
          `${device.deviceName} could not sync. ${result.message}`
        );
      }
    } catch (err) {
      await loadStatuses();

      showToast(
        'error',
        'Sync failed',
        `${device.deviceName} could not sync. ${errorMessage(
          err,
          'Unexpected error.'
        )}`
      );
    }
  };

  const handleBulkSync = async () => {
    const targets = selectedDevices.filter((device) => device.enabled);

    if (targets.length === 0) {
      showToast(
        'info',
        'Nothing to sync',
        'Enable the selected devices before syncing them.'
      );

      return;
    }

    setBulkBusy(true);

    let succeeded = 0;
    let processed = 0;
    const failed: string[] = [];

    for (const device of targets) {
      try {
        const result = await runSync(device);

        if (result.status === 'Success') {
          succeeded += 1;
          processed += result.processed;
        } else {
          failed.push(device.deviceName);
        }
      } catch {
        failed.push(device.deviceName);
      }
    }

    await loadStatuses();

    setBulkBusy(false);

    if (failed.length === 0) {
      showToast(
        'success',
        'Sync completed',
        `${pluralize(succeeded, 'device', 'devices')} synced successfully. ${pluralize(
          processed,
          'new punch',
          'new punches'
        )} processed.`
      );
    } else {
      showToast(
        'error',
        'Sync failed',
        `${failed.join(', ')} could not sync. ${succeeded} of ${
          targets.length
        } synced.`
      );
    }
  };

  const handleBulkEnabled = async (enabled: boolean) => {
    const targets = selectedDevices.filter(
      (device) => device.enabled !== enabled
    );

    if (targets.length === 0) {
      showToast(
        'info',
        'No changes needed',
        `The selected devices are already ${enabled ? 'enabled' : 'disabled'}.`
      );

      return;
    }

    setBulkBusy(true);

    const failed: string[] = [];

    for (const device of targets) {
      try {
        await setDeviceEnabled(device.deviceId, enabled);
      } catch {
        failed.push(device.deviceName);
      }
    }

    await loadDevices(true);

    setBulkBusy(false);

    if (failed.length === 0) {
      showToast(
        'success',
        enabled ? 'Devices enabled' : 'Devices disabled',
        `${pluralize(targets.length, 'device', 'devices')} ${
          enabled ? 'enabled' : 'disabled'
        }.`
      );
    } else {
      showToast(
        'error',
        'Update failed',
        `${failed.join(', ')} could not be updated.`
      );
    }
  };

  const handleDelete = async (device: Device) => {
    if (
      !window.confirm(
        `Delete "${device.deviceName}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteDevice(device.deviceId);

      showToast(
        'success',
        'Device deleted',
        `${device.deviceName} was removed.`
      );

      await loadDevices(true);
    } catch (err) {
      showToast(
        'error',
        'Delete failed',
        `${device.deviceName} could not be deleted. ${errorMessage(
          err,
          'Unexpected error.'
        )}`
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDevices.length === 0) {
      return;
    }

    if (
      !window.confirm(
        `Delete ${pluralize(
          selectedDevices.length,
          'device',
          'devices'
        )}? This cannot be undone.`
      )
    ) {
      return;
    }

    setBulkBusy(true);

    const failed: string[] = [];

    for (const device of selectedDevices) {
      try {
        await deleteDevice(device.deviceId);
      } catch {
        failed.push(device.deviceName);
      }
    }

    await loadDevices(true);

    setBulkBusy(false);

    if (failed.length === 0) {
      showToast(
        'success',
        'Devices deleted',
        `${pluralize(selectedDevices.length, 'device', 'devices')} removed.`
      );
    } else {
      showToast(
        'error',
        'Delete failed',
        `${failed.join(', ')} could not be deleted.`
      );
    }
  };

  const exportDevices = (list: Device[], filename: string) => {
    if (list.length === 0) {
      showToast('info', 'Nothing to export', 'There are no devices to export.');

      return;
    }

    const rows: (string | number)[][] = [
      [
        'Device Name',
        'Manufacturer',
        'Model',
        'IP Address',
        'Port',
        'Company',
        'Branch',
        'Enabled',
        'Automatic Sync',
        'Status',
        'Last Synced',
      ],
      ...list.map((device) => [
        device.deviceName,
        device.manufacturer,
        device.model,
        device.ipAddress,
        device.port,
        device.companyId,
        device.branchName || device.branchCode,
        device.enabled ? 'Yes' : 'No',
        device.automaticSync ? 'Yes' : 'No',
        STATUS_LABELS[displayStatus(device)],
        statuses[device.deviceId]?.lastSuccessAt ?? '',
      ]),
    ];

    downloadCsv(filename, rows);
  };

  const renderLastSeen = (device: Device) => {
    const status = statuses[device.deviceId];

    if (status?.isSyncing || syncingIds.has(device.deviceId)) {
      return <span style={SUB_TEXT_STYLE}>Syncing…</span>;
    }

    if (device.enabled && status?.lastStatus === 'Failed') {
      return (
        <span
          title={status.lastError ?? ''}
          style={{ color: ACTION_COLORS.retry, fontSize: 13 }}
        >
          Sync failed {timeAgo(status.lastAttemptAt, now)}
        </span>
      );
    }

    if (status?.lastSuccessAt) {
      return (
        <span
          title={new Date(status.lastSuccessAt).toLocaleString()}
          style={{ color: 'var(--text-muted)', fontSize: 13 }}
        >
          Synced {timeAgo(status.lastSuccessAt, now)}
        </span>
      );
    }

    return (
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        Not synced yet
      </span>
    );
  };

  const toastStyle = toast ? TOAST_STYLES[toast.kind] : null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>
          Hardware & Connectivity Hub
        </h2>

        <span className="status-dot">
          Device Management Active
        </span>
      </div>

      <div
        className="stat-grid"
        style={{
          gridTemplateColumns:
            'repeat(auto-fit, minmax(190px, 1fr))',
        }}
      >
        <div className="stat-card">
          <div className="stat-label">Total Devices</div>
          <div className="stat-value">{totalDevices}</div>
          <div className="stat-sub">Registered</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Online Status</div>
          <div className="stat-value">{onlineCount}</div>
          <div className="stat-sub stat-sub-green">
            {uptimePercent}% uptime
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Critical Offline</div>
          <div className="stat-value">{offlineCount}</div>
          <div className="stat-sub stat-sub-red">
            Requires immediate care
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Warnings</div>
          <div className="stat-value">{warningCount}</div>
          <div className="stat-sub" style={{ color: '#d97706' }}>
            Sync latency issue
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Disabled Devices</div>
          <div className="stat-value">{disabledCount}</div>
          <div className="stat-sub">
            Deactivated manually
          </div>
        </div>
      </div>

      <div className="card">
        <div
          className="card-header"
          style={{ gap: 12 }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              flex: 1,
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: 1,
                maxWidth: 320,
              }}
            >
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />

              <input
                placeholder="Search biometric hardware…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: 32,
                  width: '100%',
                }}
              />
            </div>

            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
            >
              {sites.map((site) => (
                <option
                  key={site}
                  value={site}
                >
                  Site: {site}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              className="btn"
              onClick={() => loadDevices(true)}
              disabled={loading || refreshing || bulkBusy}
            >
              <RefreshCw
                size={14}
                className={refreshing ? 'spin' : ''}
              />

              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <button
              className="btn"
              onClick={() =>
                exportDevices(filtered, 'biometric-devices.csv')
              }
              disabled={loading || filtered.length === 0}
            >
              <Download size={14} />
              Export
            </button>

            <button
              className="btn-primary"
              onClick={() => navigate('/devices/new')}
            >
              <Plus size={16} />
              Add Device
            </button>
          </div>
        </div>

        {selected.size > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              padding: '12px 20px',
              background: '#fff4ec',
              borderTop: '1px solid #fed7aa',
              borderBottom: '1px solid #fed7aa',
            }}
          >
            <div style={{ fontWeight: 600, color: '#9a3412' }}>
              {pluralize(selected.size, 'device', 'devices')} selected
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn"
                onClick={() => setSelected(new Set())}
                disabled={bulkBusy}
              >
                Clear selection
              </button>

              <button
                className="btn"
                onClick={() =>
                  exportDevices(
                    selectedDevices,
                    'selected-biometric-devices.csv'
                  )
                }
                disabled={bulkBusy}
              >
                Export selected
              </button>

              <button
                className="btn"
                onClick={() => handleBulkEnabled(false)}
                disabled={bulkBusy}
              >
                Disable
              </button>

              <button
                className="btn"
                onClick={() => handleBulkEnabled(true)}
                disabled={bulkBusy}
              >
                Enable
              </button>

              <button
                className="btn"
                onClick={handleBulkSync}
                disabled={bulkBusy}
              >
                {bulkBusy ? 'Working...' : 'Sync now'}
              </button>

              <button
                className="btn"
                onClick={handleBulkDelete}
                disabled={bulkBusy}
                style={{
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#ffffff',
                }}
              >
                Delete selected
              </button>
            </div>
          </div>
        )}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all devices"
                    style={checkboxStyle}
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    disabled={loading || filtered.length === 0}
                  />
                </th>
                <th>Device Name</th>
                <th>Model</th>
                <th>IP Address</th>
                <th>Company</th>
                <th>Site/Branch</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      padding: 30,
                    }}
                  >
                    Loading biometric devices...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      padding: 30,
                    }}
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        padding: 30,
                      }}
                    >
                      {devices.length === 0
                        ? 'No biometric devices have been registered yet.'
                        : 'No devices match your search.'}
                    </td>
                  </tr>
                )}

              {!loading &&
                !error &&
                filtered.map((device) => {
                  const status = displayStatus(device);
                  const badge = badgeFor(status);
                  const isSyncing = status === 'Syncing';
                  const hasFailed =
                    device.enabled &&
                    statuses[device.deviceId]?.lastStatus === 'Failed';

                  const syncDisabled =
                    !device.enabled || isSyncing || bulkBusy;

                  const syncColor = !device.enabled
                    ? ACTION_COLORS.disabled
                    : hasFailed
                      ? ACTION_COLORS.retry
                      : ACTION_COLORS.sync;

                  return (
                    <tr key={device.deviceId}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${device.deviceName}`}
                          style={checkboxStyle}
                          checked={selected.has(device.deviceId)}
                          onChange={() => toggleSelected(device.deviceId)}
                        />
                      </td>

                      <td style={{ fontWeight: 600 }}>
                        {device.deviceName}
                      </td>

                      <td
                        style={{
                          color: 'var(--text-muted)',
                        }}
                      >
                        {[device.manufacturer, device.model]
                          .filter(Boolean)
                          .join(' ') || '-'}
                      </td>

                      <td>
                        {device.ipAddress}:{device.port}
                      </td>

                      <td>
                        {device.companyId}
                      </td>

                      <td>
                        {device.branchName || device.branchCode}
                      </td>

                      <td>
                        <span
                          className={badge.className}
                          style={badge.style}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                      </td>

                      <td>
                        {renderLastSeen(device)}

                        <div style={SUB_TEXT_STYLE}>
                          {device.automaticSync
                            ? 'Automatic sync'
                            : 'Manual sync'}
                        </div>
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <button
                            className="link-btn"
                            onClick={() =>
                              navigate(
                                `/devices/${device.deviceId}`
                              )
                            }
                          >
                            View
                          </button>

                          <button
                            className="link-btn"
                            type="button"
                            onClick={() =>
                              navigate(
                                `/devices/${device.deviceId}/edit`
                              )
                            }
                            style={{ color: ACTION_COLORS.edit }}
                          >
                            Edit
                          </button>

                          <button
                            className="link-btn"
                            type="button"
                            onClick={() => handleSync(device)}
                            disabled={syncDisabled}
                            title={
                              device.enabled
                                ? undefined
                                : 'Enable the device to sync it'
                            }
                            style={{
                              color: syncColor,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: syncDisabled
                                ? 'not-allowed'
                                : 'pointer',
                            }}
                          >
                            {isSyncing && (
                              <RefreshCw size={12} className="spin" />
                            )}

                            {isSyncing
                              ? 'Syncing'
                              : hasFailed
                                ? 'Retry'
                                : 'Sync'}
                          </button>

                          <button
                            type="button"
                            aria-label={`Delete ${device.deviceName}`}
                            title="Delete device"
                            onClick={() => handleDelete(device)}
                            disabled={bulkBusy}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 6,
                              borderRadius: 8,
                              border: '1px solid #fed7aa',
                              background: '#fff7ed',
                              color: ACTION_COLORS.retry,
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {toast && toastStyle && (
        <div
          role="status"
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            width: 380,
            maxWidth: 'calc(100vw - 48px)',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            padding: '14px 16px',
            borderRadius: 12,
            background: toastStyle.background,
            border: `1px solid ${toastStyle.border}`,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
            zIndex: 1000,
          }}
        >
          <span style={{ color: toastStyle.icon, marginTop: 2 }}>
            {toast.kind === 'success' && <CheckCircle2 size={22} />}
            {toast.kind === 'error' && <AlertCircle size={22} />}
            {toast.kind === 'info' && <Info size={22} />}
          </span>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                color: toastStyle.title,
              }}
            >
              {toast.title}
            </div>

            <div
              style={{
                fontSize: 13,
                color: toastStyle.text,
                marginTop: 2,
              }}
            >
              {toast.message}
            </div>
          </div>

          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: toastStyle.text,
              padding: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}