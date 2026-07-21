import { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FileCode,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AuditLog {
  _id: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  resourceType: string;
  ipAddress: string;
  region: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'Unresolved' | 'Resolved';
  timestamp: string;
}

interface FilterOptions {
  actors: string[];
  roles: string[];
  actions: string[];
  resourceTypes: string[];
  regions: string[];
}

interface Stats {
  total: number;
  unresolved: number;
  resolved: number;
  severities: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  filters: FilterOptions;
}

function App() {
  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Selected Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('');

  // Stats & Dynamic Filters
  const [stats, setStats] = useState<Stats | null>(null);
  
  // UI States
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Stats (and filter listings)
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/logs/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch Logs
  const fetchLogs = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (selectedSeverity) queryParams.append('severity', selectedSeverity);
      if (selectedStatus) queryParams.append('status', selectedStatus);
      if (selectedRole) queryParams.append('role', selectedRole);
      if (selectedAction) queryParams.append('action', selectedAction);
      if (selectedRegion) queryParams.append('region', selectedRegion);
      if (selectedResourceType) queryParams.append('resourceType', selectedResourceType);

      const response = await fetch(`/api/logs?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalLogs(data.total);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  // Trigger loading logs on filters/pagination change
  useEffect(() => {
    fetchLogs();
  }, [page, limit, debouncedSearch, sortBy, sortOrder, selectedSeverity, selectedStatus, selectedRole, selectedAction, selectedRegion, selectedResourceType]);

  // Load stats once on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Handle Sort Change
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Bulk Upload Files Handler
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const parsedLogs: any[] = [];
      const fileReaders = Array.from(files).map(async (file) => {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const text = await file.text();
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            parsedLogs.push(...data);
          } else if (typeof data === 'object' && data !== null) {
            parsedLogs.push(data);
          }
        }
      });

      await Promise.all(fileReaders);

      if (parsedLogs.length === 0) {
        setUploadMessage({ type: 'error', text: 'No valid log records found in the selected files.' });
        setIsUploading(false);
        return;
      }

      if (parsedLogs.length > 10000) {
        setUploadMessage({ 
          type: 'error', 
          text: `Cannot upload more than 10,000 logs at a time. Selected files contain ${parsedLogs.length} records.` 
        });
        setIsUploading(false);
        return;
      }

      const response = await fetch('/api/logs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedLogs),
      });

      const data = await response.json();

      if (response.ok) {
        const recordText = data.count === 1 ? '1 log record' : `${data.count} log records`;
        const fileText = files.length === 1 ? '1 file' : `${files.length} files`;
        setUploadMessage({ 
          type: 'success', 
          text: `Upload completed! Saved ${recordText} from ${fileText}.` 
        });
        // Refresh dashboard
        fetchStats();
        fetchLogs();
      } else {
        setUploadMessage({ 
          type: 'error', 
          text: data.error || 'Failed to upload audit logs.' 
        });
      }
    } catch (err: any) {
      setUploadMessage({ 
        type: 'error', 
        text: 'Error parsing files. Make sure they are valid JSON files.' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Drag-and-drop actions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  // Toggle log status (Resolve/Unresolve)
  const toggleLogStatus = async (log: AuditLog) => {
    const newStatus = log.status === 'Resolved' ? 'Unresolved' : 'Resolved';
    try {
      const response = await fetch(`/api/logs/${log._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedLog = await response.json();
        // Update local logs list
        setLogs(prev => prev.map(l => l._id === updatedLog._id ? updatedLog : l));
        // Update sidebar
        if (selectedLog && selectedLog._id === updatedLog._id) {
          setSelectedLog(updatedLog);
        }
        // Update stats
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating log status:', err);
    }
  };

  // Clear all filters
  const resetFilters = () => {
    setSelectedSeverity('');
    setSelectedStatus('');
    setSelectedRole('');
    setSelectedAction('');
    setSelectedRegion('');
    setSelectedResourceType('');
    setSearch('');
    setPage(1);
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'badge badge-critical';
      case 'HIGH': return 'badge badge-high';
      case 'MEDIUM': return 'badge badge-medium';
      default: return 'badge badge-low';
    }
  };

  return (
    <div className="dashboard-container">
      {isUploading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <h3 style={{ fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Ingesting Security Audit Logs</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Processing files and saving to database...</p>
        </div>
      )}
      {/* Header */}
      <header className="header">
        <div className="brand">
          <Shield size={32} color="#6366f1" />
          <div>
            <h1>Guardian</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Audit Intelligence Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn" onClick={resetFilters}>
            Reset Filters
          </button>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud size={16} />
            Upload JSON Logs
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".json"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
        </div>
      </header>

      {/* Stats Section */}
      <section className="stats-grid">
        <div className="card animate-fade-in">
          <div className="stat-label">Total Logs Ingested</div>
          <div className="stat-value">
            {stats?.total.toLocaleString() || 0}
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>records</span>
          </div>
        </div>
        <div className="card animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="stat-label">Unresolved Alerts</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>
            <Clock size={24} style={{ marginRight: '0.25rem' }} />
            {stats?.unresolved.toLocaleString() || 0}
          </div>
        </div>
        <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-label">Critical / High Incidents</div>
          <div className="stat-value" style={{ color: 'var(--critical)' }}>
            <ShieldAlert size={24} style={{ marginRight: '0.25rem' }} />
            {((stats?.severities.CRITICAL || 0) + (stats?.severities.HIGH || 0)).toLocaleString()}
          </div>
        </div>
        <div className="card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="stat-label">Resolved Status</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            <CheckCircle size={24} style={{ marginRight: '0.25rem' }} />
            {stats?.resolved.toLocaleString() || 0}
          </div>
        </div>
      </section>

      {/* Upload Zone (Drag & drop available anytime) */}
      <section 
        className={`upload-zone animate-fade-in ${dragActive ? 'upload-zone-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ padding: logs.length > 0 ? '1.5rem' : '3rem', marginBottom: '1rem', cursor: 'pointer' }}
      >
        <UploadCloud size={logs.length > 0 ? 32 : 48} color={dragActive ? 'var(--success)' : 'var(--primary)'} style={{ marginBottom: '0.5rem' }} />
        <h3 style={{ fontSize: logs.length > 0 ? '1rem' : '1.25rem' }}>
          {logs.length > 0 ? 'Upload additional JSON logs (Drag & drop or click)' : 'Drag and drop your audit logs here'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Supports single records or arrays of up to 10,000 logs in `.json` files.
        </p>
      </section>

      {uploadMessage && (
        <div className={`card animate-fade-in`} style={{ 
          borderColor: uploadMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
          background: uploadMessage.type === 'success' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {uploadMessage.type === 'success' ? <CheckCircle2 color="var(--success)" /> : <AlertCircle color="var(--danger)" />}
            <span style={{ fontSize: '0.875rem' }}>{uploadMessage.text}</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setUploadMessage(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Dashboard Workspace */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Filters Panel */}
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search Actor, Resource, IP Address..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: '3 1 auto' }}>
            {/* Severity Filter */}
            <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)}>
              <option value="">All Severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {/* Status Filter */}
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Unresolved">Unresolved</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Dynamic Role Filter */}
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="">All Roles</option>
              {stats?.filters.roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {/* Dynamic Region Filter */}
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
              <option value="">All Regions</option>
              {stats?.filters.regions.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>

            {/* Dynamic Action Filter */}
            <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
              <option value="">All Actions</option>
              {stats?.filters.actions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table Area */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('timestamp')}>
                  Timestamp {sortBy === 'timestamp' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('severity')}>
                  Severity {sortBy === 'severity' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('actor')}>
                  Actor {sortBy === 'actor' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('role')}>
                  Role {sortBy === 'role' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('action')}>
                  Action {sortBy === 'action' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('resourceType')}>
                  Type {sortBy === 'resourceType' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('ipAddress')}>
                  IP Address {sortBy === 'ipAddress' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('status')}>
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No audit logs matching selection found. Try uploading a log dataset or resetting filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLog(log)}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <span className={getSeverityBadgeClass(log.severity)}>
                        {log.severity}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.actor}</td>
                    <td>{log.role}</td>
                    <td style={{ fontFamily: 'monospace', color: '#818cf8' }}>{log.action}</td>
                    <td>{log.resourceType}</td>
                    <td>{log.ipAddress}</td>
                    <td>
                      <span className={log.status === 'Resolved' ? 'badge-resolved badge' : 'badge-unresolved badge'}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Limits Footer */}
        {logs.length > 0 && (
          <div className="pagination">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>Show</span>
              <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }} style={{ padding: '0.25rem 0.5rem' }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>logs per page (Total: {totalLogs.toLocaleString()})</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className="btn" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                style={{ opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
              <button 
                className="btn" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                style={{ opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Details sidebar */}
      {selectedLog && (
        <div className="sidebar-overlay" onClick={() => setSelectedLog(null)}>
          <div className="sidebar-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCode size={20} color="var(--primary)" />
                <h3 style={{ fontWeight: 600 }}>Log Investigation</h3>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSelectedLog(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Security Incident severity</span>
                <span className={getSeverityBadgeClass(selectedLog.severity)}>{selectedLog.severity}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Investigation Status</span>
                <span className={selectedLog.status === 'Resolved' ? 'badge-resolved badge' : 'badge-unresolved badge'}>
                  {selectedLog.status}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Actor Account</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedLog.actor} ({selectedLog.role})</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Action Executed</span>
                <span style={{ fontFamily: 'monospace', color: '#a5b4fc', background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  {selectedLog.action}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Target Resource</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.resource} ({selectedLog.resourceType})</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Origin Metadata</span>
                <span>IP: {selectedLog.ipAddress} | Region: {selectedLog.region}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Recorded Time</span>
                <span>{new Date(selectedLog.timestamp).toUTCString()}</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button 
                className={`btn ${selectedLog.status === 'Resolved' ? '' : 'btn-primary'}`} 
                onClick={() => toggleLogStatus(selectedLog)}
                style={{ flex: 1 }}
              >
                {selectedLog.status === 'Resolved' ? 'Reopen Incident' : 'Resolve Incident'}
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setSelectedLog(null)}>
                Close Panel
              </button>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Full Log Record (JSON)</span>
              <pre className="json-block">{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
