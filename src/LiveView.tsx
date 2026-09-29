import { useEffect, useState } from 'react';

import * as signalR from '@microsoft/signalr';

import {
  Users,
  Clock,
  UserX,
  Calendar,
  AlertTriangle,
  X
} from 'lucide-react';

import { API_BASE_URL } from './config';

interface StatusEvent {
  employeeId: string;

  employeeName: string;

  department: string;

  status: 'in' | 'out' | 'late';

  clockInTime?: string;

  clockOutTime?: string;

  plannedOtStartTime?: string;

  plannedOtEndTime?: string;

  actualOtStartTime?: string;

  actualOtEndTime?: string;

  actualOvertimeHours?: number;

  plannedOvertimeHours?: number;
}

interface AttendanceSite {
  companyId: string;

  siteId: string;

  siteName: string;
}

interface LiveStatusPush {
  employeeId: string;

  employeeName: string;

  department: string;

  siteId: string;

  status: 'in' | 'out' | 'late';

  clockinTime?: string | null;

  clockoutTime?: string | null;

  plannedOtStartTime?: string | null;

  actualOtStartTime?: string | null;

  plannedOtEndTime?: string | null;

  actualOtEndTime?: string | null;

  overTime?: string | null;
}

interface ProcessingAlert {
  employeeCode: string;

  employeeName?: string;

  reason: string;

  message: string;

  timestamp: string;
}

function initials(name: string) {
  if (!name) return "??";

  return name
    .trim()
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function mapLivePushToStatusEvent(
  push: LiveStatusPush
): StatusEvent {
  const parsedOt = push.overTime
    ? Number.parseFloat(push.overTime)
    : NaN;

  return {
    employeeId: push.employeeId,

    employeeName: push.employeeName,

    department: push.department,

    status: push.status,

    clockInTime:
      push.clockinTime ?? undefined,

    clockOutTime:
      push.clockoutTime ?? undefined,

    plannedOtStartTime:
      push.plannedOtStartTime ?? undefined,

    plannedOtEndTime:
      push.plannedOtEndTime ?? undefined,

    actualOtStartTime:
      push.actualOtStartTime ?? undefined,

    actualOtEndTime:
      push.actualOtEndTime ?? undefined,

    actualOvertimeHours:
      Number.isNaN(parsedOt)
        ? undefined
        : parsedOt,

    plannedOvertimeHours:
      undefined,
  };
}

let hubConnection: signalR.HubConnection | null = null;

export default function LiveView() {
  const [events, setEvents] =
    useState<StatusEvent[]>([]);

  const [alerts, setAlerts] =
    useState<ProcessingAlert[]>([]);

  const [attendanceSites, setAttendanceSites] =
    useState<AttendanceSite[]>([]);

  const [selectedSiteId, setSelectedSiteId] =
    useState<string | null>(null);

  const [sitesLoading, setSitesLoading] =
    useState(true);

  const [, setConnectionTick] =
    useState(0);

  const forceUpdate = () =>
    setConnectionTick(prev => prev + 1);

  const [totalPresent, setTotalPresent] =
    useState<number | null>(null);

  const [lateArrivals, setLateArrivals] =
    useState<number>(0);

  const [absentToday, setAbsentToday] =
    useState<number>(0);

  const [onLeave, setOnLeave] =
    useState<number>(0);

  const isLinkedActive =
    hubConnection !== null &&
    hubConnection.state ===
    signalR.HubConnectionState.Connected;

  const loadCurrentStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/current-status`);

      if (res.ok) {
        const response = await res.json();

        console.log('[Attendance] Current status response:', response);

        // The API wraps the actual result inside `data`
        const data = response.data;

        if (data) {
          if (data.events) {
            setEvents((data.events || []).slice().reverse());
          }

          if (data.metrics) {
            setTotalPresent(data.metrics.totalPresent);
            setLateArrivals(data.metrics.lateArrivals);
            setAbsentToday(data.metrics.absentToday);
            setOnLeave(data.metrics.onLeave);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching live view data:", error);
    }
  };

  const loadAttendanceSites = async () => {
    try {
      setSitesLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/attendance/sites`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load attendance sites: ${response.status}`
        );
      }

      const sites: AttendanceSite[] =
        await response.json();

      console.log(
        '[Attendance] Available sites:',
        sites
      );

      setAttendanceSites(sites);

      if (sites.length > 0) {
        setSelectedSiteId(
          currentSiteId => {
            if (
              currentSiteId &&
              sites.some(
                site =>
                  site.siteId ===
                  currentSiteId
              )
            ) {
              return currentSiteId;
            }

            return sites[0].siteId;
          }
        );
      } else {
        setSelectedSiteId(null);
      }
    } catch (error) {
      console.error(
        '[Attendance] Failed to load attendance sites:',
        error
      );

      setAttendanceSites([]);

      setSelectedSiteId(null);
    } finally {
      setSitesLoading(false);
    }
  };

  const dismissAlert = (index: number) => {
    setAlerts(prev =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  /*
   * Load the current attendance state
   * and available company/site configuration.
   */
  useEffect(() => {
    loadCurrentStatus();

    loadAttendanceSites();
  }, []);

  /*
   * SignalR connection.
   *
   * IMPORTANT:
   * The connection only joins a site after
   * selectedSiteId has been loaded from the backend.
   */
  useEffect(() => {
    if (!selectedSiteId) {
      console.log(
        '[SignalR] Waiting for attendance site...'
      );

      return;
    }

    let isMounted = true;

    if (!hubConnection) {
      hubConnection =
        new signalR.HubConnectionBuilder()
          .withUrl(
            `${API_BASE_URL}/attendance`
          )
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds:
              () => 3000
          })
          .build();
    }

    const connection =
      hubConnection;

    const requestGroupJoin = () => {
      console.log(
        '[SignalR] Attempting JoinSite...'
      );

      console.log(
        '[SignalR] Connection state:',
        connection.state
      );

      console.log(
        '[SignalR] Site:',
        selectedSiteId
      );

      if (
        connection.state ===
        signalR.HubConnectionState.Connected
      ) {
        connection
          .invoke(
            'JoinSite',
            selectedSiteId
          )
          .then(() => {
            console.log(
              '[SignalR] JoinSite invocation completed'
            );
          })
          .catch(err => {
            console.error(
              '[SignalR] JoinSite invocation FAILED:',
              err
            );
          });
      } else {
        console.warn(
          '[SignalR] Cannot JoinSite. Current state:',
          connection.state
        );
      }
    };

    const handleJoined = (
      data: { siteId: string }
    ) => {
      console.log(
        '[SignalR] JOINED EVENT:',
        data
      );

      if (isMounted) {
        forceUpdate();
      }
    };

    const handleJoinError = (
      err: { message: string }
    ) => {
      console.error(
        '[SignalR] JoinSite error:',
        err.message
      );

      if (isMounted) {
        forceUpdate();
      }
    };

    const handleStatusChange = (
      push: LiveStatusPush
    ) => {
      console.log(
        '================================'
      );
      console.log(
        '[SignalR] STATUS CHANGE RECEIVED'
      );
      console.log(push);
      console.log(
        '================================'
      );

      if (!isMounted) {
        return;
      }

      const incomingEvent =
        mapLivePushToStatusEvent(push);

      setEvents(prev => {
        const existingIndex = prev.findIndex(
          event =>
            event.employeeId ===
            incomingEvent.employeeId
        );

        // Employee has no existing row.
        // Add a new attendance row.
        if (existingIndex === -1) {
          return [
            incomingEvent,
            ...prev
          ];
        }

        // Employee already exists.
        // UPDATE that row instead of creating
        // another row.
        const updated = [...prev];

        const existingEvent =
          updated[existingIndex];

        updated[existingIndex] = {
          ...existingEvent,
          ...incomingEvent,

          
          clockInTime:
            incomingEvent.clockInTime ??
            existingEvent.clockInTime,

          
          clockOutTime:
            incomingEvent.clockOutTime ??
            existingEvent.clockOutTime,
        };

        return updated;
      });
    };

    const handleProcessingAlert = (
      alert: ProcessingAlert
    ) => {
      if (isMounted) {
        setAlerts(prev => [
          alert,
          ...prev
        ]);
      }
    };

    connection.on(
      'joined',
      handleJoined
    );

    connection.on(
      'join_error',
      handleJoinError
    );

    connection.on(
      'StatusChange',
      handleStatusChange
    );

    connection.on(
      'ProcessingAlert',
      handleProcessingAlert
    );

    connection.onreconnecting(
      error => {
        console.error(
          '[SignalR] Reconnecting...',
          error
        );

        if (isMounted) {
          forceUpdate();
        }
      }
    );

    connection.onreconnected(
      connectionId => {
        console.log(
          '[SignalR] Reconnected. Connection ID:',
          connectionId
        );

        requestGroupJoin();

        loadCurrentStatus();

        if (isMounted) {
          forceUpdate();
        }
      }
    );

    connection.onclose(
      error => {
        console.error(
          '[SignalR] Connection closed:',
          error
        );

        if (isMounted) {
          forceUpdate();
        }
      }
    );

    console.log(
      '[SignalR] Hub URL:',
      `${API_BASE_URL}/attendance`
    );

    if (
      connection.state ===
      signalR.HubConnectionState.Disconnected
    ) {
      console.log(
        '[SignalR] Starting connection...'
      );

      connection
        .start()
        .then(() => {
          console.log(
            '[SignalR] Connection started'
          );

          console.log(
            '[SignalR] State:',
            connection.state
          );

          console.log(
            '[SignalR] About to request group join...'
          );

          requestGroupJoin();

          if (isMounted) {
            forceUpdate();
          }
        })
        .catch(err => {
          console.error(
            '[SignalR] Failed to start connection:',
            err
          );

          if (isMounted) {
            forceUpdate();
          }
        });
    } else if (
      connection.state ===
      signalR.HubConnectionState.Connected
    ) {
      console.log(
        '[SignalR] Already connected. Joining site...'
      );

      requestGroupJoin();

      forceUpdate();
    } else {
      console.log(
        '[SignalR] Connection is currently',
        connection.state,
        'waiting for it to finish connecting.'
      );
    }

    return () => {
      isMounted = false;

      connection.off(
        'joined',
        handleJoined
      );

      connection.off(
        'join_error',
        handleJoinError
      );

      connection.off(
        'StatusChange',
        handleStatusChange
      );

      connection.off(
        'ProcessingAlert',
        handleProcessingAlert
      );
    };
  }, [selectedSiteId]);

  return (
    <div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <label
            style={{
              fontSize: 14,
              fontWeight: 500
            }}
          >
            Site:
          </label>

          <select
            value={selectedSiteId ?? ''}
            onChange={e => {
              setSelectedSiteId(
                e.target.value || null
              );
            }}
            disabled={
              sitesLoading ||
              attendanceSites.length === 0
            }
          >
            <option value="">
              {sitesLoading
                ? 'Loading sites...'
                : 'Select site'}
            </option>

            {attendanceSites.map(site => (
              <option
                key={`${site.companyId}-${site.siteId}`}
                value={site.siteId}
              >
                {site.companyId} - {site.siteName}
              </option>
            ))}
          </select>
        </div>

        <span className="status-dot">
          {isLinkedActive
            ? 'Biometric Link Active'
            : 'Disconnected'}
        </span>

      </div>

      {alerts.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          {alerts.map((alert, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <AlertTriangle
                size={18}
                color="#b45309"
                style={{
                  flexShrink: 0,
                  marginTop: 2
                }}
              />

              <div
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: '#78350f'
                }}
              >
                {alert.message}
              </div>

              <button
                onClick={() =>
                  dismissAlert(i)
                }
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2
                }}
                aria-label="Dismiss"
              >
                <X
                  size={16}
                  color="#b45309"
                />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="stat-grid">

        <div className="stat-card">
          <div className="stat-label">
            <Users
              size={14}
              style={{
                marginRight: 6
              }}
            />
            Total Present
          </div>

          <div className="stat-value">
            {totalPresent ?? '—'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Clock
              size={14}
              style={{
                marginRight: 6
              }}
            />
            Late Arrivals
          </div>

          <div className="stat-value">
            {lateArrivals}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <UserX
              size={14}
              style={{
                marginRight: 6
              }}
            />
            Absent Today
          </div>

          <div className="stat-value">
            {absentToday}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Calendar
              size={14}
              style={{
                marginRight: 6
              }}
            />
            On Leave
          </div>

          <div className="stat-value">
            {onLeave}
          </div>
        </div>

      </div>

      <div className="card">

        <div className="card-header">
          Recent Punch Events
        </div>

        <div className="punch-events-container">

          <table className="punch-events-table">

            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Status</th>
                <th>ClockIn Time</th>
                <th>ClockOut Time</th>
                <th>Planned OT Start Time</th>
                <th>Planned OT End Time</th>
                <th>Planned OT Hours</th>
                <th>Actual OT Start Time</th>
                <th>Actual OT End Time</th>
                <th>Actual OT Hours</th>
              </tr>
            </thead>

            <tbody>

              {events.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      color: '#64748b'
                    }}
                  >
                    Waiting for punches…
                  </td>
                </tr>
              )}

              {events.map((e, i) => {

                const isCheckedIn =
                  e.status === 'in' ||
                  e.status === 'late';

                return (
                  <tr key={i}>

                    <td
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}
                    >
                      <span className="avatar-sm">
                        {initials(
                          e.employeeName
                        )}
                      </span>

                      {e.employeeName}
                    </td>

                    <td>
                      {e.department}
                    </td>

                    <td>
                      <span
                        className={`badge ${isCheckedIn
                          ? 'badge-in'
                          : 'badge-out'
                          }`}
                      >
                        {isCheckedIn
                          ? 'Checked In'
                          : 'Checked Out'}
                      </span>
                    </td>

                    <td>
                      {e.clockInTime
                        ? new Date(
                          e.clockInTime
                        ).toLocaleTimeString()
                        : '—'}
                    </td>

                    <td>
                      {e.clockOutTime
                        ? new Date(
                          e.clockOutTime
                        ).toLocaleTimeString()
                        : '—'}
                    </td>

                    <td>
                      {e.plannedOtStartTime
                        ? new Date(
                          e.plannedOtStartTime
                        ).toLocaleTimeString()
                        : '—'}
                    </td>

                    <td>
                      {e.plannedOtEndTime
                        ? new Date(
                          e.plannedOtEndTime
                        ).toLocaleTimeString()
                        : '—'}
                    </td>

                    <td>
                      {e.plannedOvertimeHours !==
                        null &&
                        e.plannedOvertimeHours !==
                        undefined
                        ? `${Number(
                          e.plannedOvertimeHours
                        ).toFixed(2)} hrs`
                        : '—'}
                    </td>

                    <td>
                      {e.actualOtStartTime
                        ? new Date(
                          e.actualOtStartTime
                        ).toLocaleTimeString()
                        : '—'}
                    </td>

                    <td>
                      {e.actualOtEndTime
                        ? new Date(
                          e.actualOtEndTime
                        ).toLocaleTimeString()
                        : '—'}
                    </td>

                    <td>
                      {e.actualOvertimeHours !==
                        null &&
                        e.actualOvertimeHours !==
                        undefined
                        ? `${Number(
                          e.actualOvertimeHours
                        ).toFixed(2)} hrs`
                        : '—'}
                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}