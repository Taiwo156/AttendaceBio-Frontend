import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createDevice,
  getCompanies,
  getCompanyBranches,
  getDevice,
  testDeviceConnection,
  updateDevice,
  type Company,
  type CompanyBranch,
  type CreateDeviceRequest,
} from '../../api/devicesApi';

export default function AddDeviceView() {
  const { deviceId } = useParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(deviceId);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<CompanyBranch[]>([]);

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBranchCode, setSelectedBranchCode] = useState('');

  const [companyLoading, setCompanyLoading] = useState(true);
  const [branchLoading, setBranchLoading] = useState(false);
  const [deviceLoading, setDeviceLoading] = useState(isEditMode);

  const [automaticSync, setAutomaticSync] = useState(true);
  const [deviceEnabled, setDeviceEnabled] = useState(true);

  const [deviceName, setDeviceName] = useState('');
  const [manufacturer, setManufacturer] = useState('ZKTeco');
  const [model, setModel] = useState('MB460');
  const [serialNumber, setSerialNumber] = useState('');
  const [deviceNumber, setDeviceNumber] = useState(1);
  const [deviceType, setDeviceType] = useState('Fingerprint');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState(4370);
  const [commKey, setCommKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(
    null
  );
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setCompanyLoading(true);
        setError('');

        const data = await getCompanies();

        setCompanies(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load companies.'
        );
      } finally {
        setCompanyLoading(false);
      }
    };

    loadCompanies();
  }, []);

  useEffect(() => {
    if (!deviceId) {
      setDeviceLoading(false);
      return;
    }

    const loadDevice = async () => {
      try {
        setDeviceLoading(true);
        setError('');

        const device = await getDevice(deviceId);

        setSelectedCompanyId(device.companyId);
        setSelectedBranchCode(device.branchCode);

        setDeviceName(device.deviceName);
        setManufacturer(device.manufacturer);
        setModel(device.model);
        setSerialNumber(device.serialNumber);
        setDeviceNumber(device.deviceNumber);
        setDeviceType(device.deviceType);
        setIpAddress(device.ipAddress);
        setPort(device.port);
        setCommKey(device.commKey);
        setDeviceEnabled(device.enabled);
        setAutomaticSync(device.automaticSync);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load the device.'
        );
      } finally {
        setDeviceLoading(false);
      }
    };

    loadDevice();
  }, [deviceId]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setBranches([]);

      if (!isEditMode) {
        setSelectedBranchCode('');
      }

      return;
    }

    const loadBranches = async () => {
      try {
        setBranchLoading(true);
        setError('');
        setBranches([]);

        if (!isEditMode) {
          setSelectedBranchCode('');
        }

        const data = await getCompanyBranches(
          selectedCompanyId
        );

        setBranches(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load company branches.'
        );
      } finally {
        setBranchLoading(false);
      }
    };

    loadBranches();
  }, [selectedCompanyId, isEditMode]);

  const selectedBranch = branches.find(
    (branch) =>
      branch.branchCode === selectedBranchCode
  );

  const buildRequest = (): CreateDeviceRequest => {
    if (!selectedCompanyId) {
      throw new Error('Please select a company.');
    }

    if (!selectedBranch) {
      throw new Error('Please select a site / branch.');
    }

    if (!deviceName.trim()) {
      throw new Error('Please enter a device name.');
    }

    if (!ipAddress.trim()) {
      throw new Error('Please enter the device IP address.');
    }

    return {
      companyId: selectedCompanyId,
      divisionId: selectedBranch.divisionId,
      departmentId: selectedBranch.departmentId,
      branchCode: selectedBranch.branchCode,

      deviceName: deviceName.trim(),
      manufacturer,
      model,
      serialNumber: serialNumber.trim(),

      deviceNumber,
      deviceType,

      ipAddress: ipAddress.trim(),
      port,
      commKey,

      enabled: deviceEnabled,
      automaticSync,
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const request = buildRequest();

      if (isEditMode && deviceId) {
        const device = await updateDevice(
          deviceId,
          request
        );

        navigate(`/devices/${device.deviceId}`);
        return;
      }

      const device = await createDevice(request);

      navigate(`/devices/${device.deviceId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? 'Failed to save changes.'
            : 'Failed to save the device.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setSaving(true);
      setError('');
      setConnectionMessage(null);

      const request = buildRequest();

      await testDeviceConnection(request);

      setConnectionSuccess(true);
      setConnectionMessage('Device connection successful.');
    } catch (err) {
      setConnectionSuccess(false);
      setConnectionMessage(
        err instanceof Error
          ? err.message
          : 'Failed to connect to the biometric device.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/devices')}
        className="link-btn"
        style={{ marginBottom: 16 }}
      >
        ← Back to Devices
      </button>

      <div
        className="card"
        style={{
          padding: 28,
          width: '100%',
          boxSizing: 'border-box',

        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {isEditMode
            ? 'Edit Biometric Terminal'
            : 'Configure New Attendance Hardware'}
        </h2>

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 12,
              borderRadius: 6,
              background: '#fff1f0',
              border: '1px solid #ffccc7',
              color: '#cf1322',
            }}
          >
            {error}
          </div>
        )}

        <h4 className="form-section-label">
          Ownership Hierarchy
        </h4>

        <div className="form-row">
          <div className="form-field">
            <label>Select Company</label>

            <select
              value={selectedCompanyId}
              onChange={(e) =>
                setSelectedCompanyId(e.target.value)
              }
              disabled={
                companyLoading ||
                saving ||
                deviceLoading ||
                isEditMode
              }            >
              <option value="">
                {companyLoading
                  ? 'Loading companies...'
                  : 'Select company'}
              </option>

              {companies.map((company) => (
                <option
                  key={company.companyId}
                  value={company.companyId}
                >
                  {company.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Select Site / Branch</label>

            <select
              value={selectedBranchCode}
              onChange={(e) =>
                setSelectedBranchCode(e.target.value)
              }
              disabled={
                !selectedCompanyId ||
                branchLoading ||
                saving ||
                deviceLoading ||
                isEditMode
              }
            >
              <option value="">
                {!selectedCompanyId
                  ? 'Select a company first'
                  : branchLoading
                    ? 'Loading branches...'
                    : 'Select site / branch'}
              </option>

              {branches.map((branch) => (
                <option
                  key={branch.branchCode}
                  value={branch.branchCode}
                >
                  {branch.branchName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h4 className="form-section-label">
          Hardware Parameters
        </h4>

        <div className="form-row">
          <div className="form-field">
            <label>Device Name</label>

            <input
              value={deviceName}
              onChange={(e) =>
                setDeviceName(e.target.value)
              }
              placeholder="ZK-LAGOS-FrontGate"
              disabled={saving}
            />
          </div>

          <div className="form-field">
            <label>Manufacturer</label>

            <select
              value={manufacturer}
              onChange={(e) =>
                setManufacturer(e.target.value)
              }
              disabled={saving || isEditMode}
            >
              <option value="ZKTeco">ZKTeco</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Model Selection</label>

            <select
              value={model}
              onChange={(e) =>
                setModel(e.target.value)
              }
              disabled={saving || isEditMode}
            >
              <option value="MB460">MB460</option>
            </select>
          </div>

          <div className="form-field">
            <label>Device Serial Number / ID</label>

            <input
              value={serialNumber}
              onChange={(e) =>
                setSerialNumber(e.target.value)
              }
              placeholder="ZK994827104"
              disabled={saving || isEditMode}
            />
          </div>
        </div>

        <div className="form-field">
          <label>Verification Type</label>

          <select
            value={deviceType}
            onChange={(e) =>
              setDeviceType(e.target.value)
            }
            disabled={saving || isEditMode}
          >
            <option value="Fingerprint">
              Fingerprint
            </option>

            <option value="Face">
              Face Recognition
            </option>

            <option value="RFID">
              RFID
            </option>

            <option value="Fingerprint / Face / RFID">
              Fingerprint / Face / RFID
            </option>
          </select>
        </div>

        <h4 className="form-section-label">
          Connectivity & Network
        </h4>

        <div className="form-row">
          <div className="form-field">
            <label>IP Address (IPv4)</label>

            <input
              value={ipAddress}
              onChange={(e) =>
                setIpAddress(e.target.value)
              }
              placeholder="192.168.1.120"
              disabled={saving}
            />
          </div>

          <div className="form-field">
            <label>TCP Communication Port</label>

            <input
              type="number"
              value={port}
              onChange={(e) =>
                setPort(Number(e.target.value))
              }
              disabled={saving}
            />
          </div>
        </div>

        <div className="form-field">
          <label>
            Communication Security Key (Optional)
          </label>

          <input
            type="number"
            value={commKey}
            onChange={(e) =>
              setCommKey(Number(e.target.value))
            }
            placeholder="0"
            disabled={saving}
          />
        </div>

        <h4 className="form-section-label">
          Operational Controls
        </h4>

        <div
          style={{
            display: 'flex',
            gap: 32,
            marginBottom: 24,
          }}
        >
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={automaticSync}
              onChange={(e) =>
                setAutomaticSync(e.target.checked)
              }
              disabled={saving}
            />

            Automatic Sync
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={deviceEnabled}
              onChange={(e) =>
                setDeviceEnabled(e.target.checked)
              }
              disabled={saving}
            />

            Device Enabled
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            borderTop: '1px solid var(--border)',
            paddingTop: 20,
          }}
        >
          <button
            className="btn"
            onClick={() => navigate('/devices')}
            disabled={saving || deviceLoading}
          >
            Cancel
          </button>

          <button
            className="btn"
            onClick={handleSave}
            disabled={
              saving ||
              deviceLoading ||
              companyLoading ||
              branchLoading
            }
          >
            {saving
              ? 'Saving...'
              : isEditMode
                ? 'Save Changes'
                : 'Save Device'}
          </button>

          {!isEditMode && (
            <button
              className="btn-primary"
              onClick={handleTestConnection}
              disabled={
                saving ||
                companyLoading ||
                branchLoading
              }
            >
              {saving ? 'Testing...' : 'Test Connection'}
            </button>
          )}

          <button
            className="btn-primary"
            onClick={handleTestConnection}
            disabled={saving}
          >
            {saving ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>
      {connectionMessage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 460,
              padding: 28,
              boxSizing: 'border-box',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.18)',
              borderRadius: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: connectionSuccess
                    ? 'rgba(34, 197, 94, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                  color: connectionSuccess
                    ? 'var(--green)'
                    : '#cf1322',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {connectionSuccess ? '✓' : '!'}
              </div>

              <h3 style={{ margin: 0 }}>
                {connectionSuccess
                  ? 'Connection Successful'
                  : 'Connection Failed'}
              </h3>
            </div>

            <p
              style={{
                margin: '0 0 24px',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
              }}
            >
              {connectionMessage}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                className="btn-primary"
                type="button"
                onClick={() => {
                  setConnectionMessage(null);
                  setConnectionSuccess(false);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}