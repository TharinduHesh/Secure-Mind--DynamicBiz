// web/src/pages/admin/Incidents.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  where,
  getDocs
} from "firebase/firestore";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Topbar from "../../components/Topbar";

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted', color: 'primary' },
  { value: 'under_review', label: 'Under Review', color: 'warning' },
  { value: 'investigating', label: 'Investigating', color: 'info' },
  { value: 'resolved', label: 'Resolved', color: 'success' },
  { value: 'closed', label: 'Closed', color: 'secondary' },
  { value: 'rejected', label: 'Rejected', color: 'danger' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'danger' },
  { value: 'urgent', label: 'Urgent', color: 'dark' }
];

export default function IncidentManagement() {
  const db = useMemo(() => getFirestore(), []);
  
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    role: '',
    search: ''
  });
  
  const [updateForm, setUpdateForm] = useState({
    status: '',
    priority: '',
    reviewNotes: '',
    resolution: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auth state and role verification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        // Get user role from Firestore
        const userDoc = await getDocs(
          query(collection(db, "users"), where("__name__", "==", firebaseUser.uid))
        );
        
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          const role = userData.role?.toLowerCase();
          setUserRole(role);
          
          // Check if user has admin access
          const isAdmin = role === 'admin';
          setHasAccess(isAdmin);
          
          if (!isAdmin) {
            setError(`Access denied. Admin privileges required. Current role: ${role}`);
          }
        } else {
          setUserRole(null);
          setHasAccess(false);
          setError("User profile not found. Please contact support.");
        }
      } catch (err) {
        console.error("Error verifying user role:", err);
        setError("Failed to verify user permissions. Please try again.");
        setHasAccess(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Load incidents for authorized admins
  useEffect(() => {
    if (!hasAccess || !user) return;

    const unsubscribe = onSnapshot(
      query(collection(db, "incidents"), orderBy("submittedAt", "desc")),
      (snapshot) => {
        const incidentList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setIncidents(incidentList);
        setFilteredIncidents(incidentList);
      },
      (err) => {
        console.error("Error loading incidents:", err);
        setError("Failed to load incidents data.");
      }
    );

    return () => unsubscribe();
  }, [db, hasAccess, user]);

  // Apply filters
  useEffect(() => {
    let filtered = incidents;

    if (filters.status) {
      filtered = filtered.filter(incident => incident.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(incident => incident.priority === filters.priority);
    }

    if (filters.role) {
      filtered = filtered.filter(incident => incident.reporterRole === filters.role);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(incident => 
        incident.title?.toLowerCase().includes(searchTerm) ||
        incident.description?.toLowerCase().includes(searchTerm) ||
        incident.incidentNumber?.toLowerCase().includes(searchTerm) ||
        incident.reporterName?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredIncidents(filtered);
  }, [incidents, filters]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setUpdateForm({
      status: incident.status || 'submitted',
      priority: incident.priority || 'medium',
      reviewNotes: incident.reviewNotes || '',
      resolution: incident.resolution || ''
    });
    setShowModal(true);
    clearMessages();
  };

  const handleUpdateIncident = async () => {
    if (!selectedIncident) return;

    setUpdating(true);
    clearMessages();

    try {
      const updateData = {
        status: updateForm.status,
        priority: updateForm.priority,
        reviewNotes: updateForm.reviewNotes,
        resolution: updateForm.resolution,
        reviewedBy: user.displayName || user.email?.split('@')[0] || 'Admin',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to updates history
      const updateEntry = {
        timestamp: new Date(),
        updatedBy: user.displayName || user.email?.split('@')[0] || 'Admin',
        changes: {
          status: { from: selectedIncident.status, to: updateForm.status },
          priority: { from: selectedIncident.priority, to: updateForm.priority }
        },
        notes: updateForm.reviewNotes
      };

      updateData.updates = arrayUnion(updateEntry);

      // If resolving or closing, set resolved timestamp
      if ((updateForm.status === 'resolved' || updateForm.status === 'closed') && 
          selectedIncident.status !== 'resolved' && selectedIncident.status !== 'closed') {
        updateData.resolvedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "incidents", selectedIncident.id), updateData);

      setSuccess('Incident updated successfully!');
      setShowModal(false);
      setSelectedIncident(null);
      
    } catch (error) {
      console.error('Error updating incident:', error);
      setError('Failed to update incident. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "—";
    }
  };

  const getStatusBadge = (status) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption || { value: status, label: status, color: 'secondary' };
  };

  const getPriorityBadge = (priority) => {
    const priorityOption = PRIORITY_OPTIONS.find(opt => opt.value === priority);
    return priorityOption || { value: priority, label: priority, color: 'secondary' };
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      low: 'success',
      medium: 'warning', 
      high: 'danger',
      critical: 'dark'
    };
    return { color: colors[severity] || 'secondary', label: severity?.charAt(0).toUpperCase() + severity?.slice(1) || 'Unknown' };
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted">Verifying admin access...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container-fluid py-4">
        <div className="container text-center py-5">
          <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
            <div className="card-body p-5">
              <div className="text-danger mb-4" style={{ fontSize: '4rem' }}>🚫</div>
              <h2 className="h3 fw-bold text-dark mb-3">Access Denied</h2>
              <p className="text-muted mb-4">
                You don't have permission to access the Incident Management system.
                {userRole && (
                  <>
                    <br />
                    <small>Current role: <span className="badge bg-secondary">{userRole}</span></small>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Topbar />
      <div className="container-fluid py-4 dashboard-bg">
        <div className="container" style={{ maxWidth: 1400 }}>
          {/* Header */}
          <div className="row mb-4">
            <div className="col-12">
              <h1 className="h2 fw-bold mb-1">
                <i className="bi bi-shield-exclamation me-2 text-warning"></i>
                Incident Management
              </h1>
              <p className="text-muted mb-0">
                Review, investigate, and manage security incident reports
              </p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success border-0 shadow-sm d-flex align-items-center mb-4" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              {success}
            </div>
          )}

          {/* Filters */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Priority</label>
                  <select
                    className="form-select"
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="">All Priorities</option>
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Reporter Role</label>
                  <select
                    className="form-select"
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="security">Security</option>
                    <option value="accounting">Accounting</option>
                    <option value="marketing">Marketing</option>
                    <option value="developer">Developer</option>
                    <option value="design">Design</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search incidents..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  Incident Reports ({filteredIncidents.length})
                </h5>
              </div>
            </div>
            <div className="card-body p-0">
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                  <p className="text-muted">No incidents found matching your criteria</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold">Incident #</th>
                        <th className="border-0 fw-semibold">Title</th>
                        <th className="border-0 fw-semibold">Reporter</th>
                        <th className="border-0 fw-semibold">Type</th>
                        <th className="border-0 fw-semibold">Severity</th>
                        <th className="border-0 fw-semibold">Priority</th>
                        <th className="border-0 fw-semibold">Status</th>
                        <th className="border-0 fw-semibold">Submitted</th>
                        <th className="border-0 fw-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIncidents.map((incident) => {
                        const statusBadge = getStatusBadge(incident.status);
                        const priorityBadge = getPriorityBadge(incident.priority);
                        const severityBadge = getSeverityBadge(incident.severity);
                        
                        return (
                          <tr key={incident.id}>
                            <td className="border-0">
                              <code className="text-primary">{incident.incidentNumber}</code>
                            </td>
                            <td className="border-0">
                              <div className="fw-semibold">{incident.title}</div>
                              <small className="text-muted">
                                {incident.description?.substring(0, 60)}...
                              </small>
                            </td>
                            <td className="border-0">
                              <div className="fw-semibold">{incident.reporterName}</div>
                              <small className="text-muted">
                                <span className="badge bg-secondary-subtle text-secondary">
                                  {incident.reporterRole?.charAt(0).toUpperCase() + incident.reporterRole?.slice(1)}
                                </span>
                              </small>
                            </td>
                            <td className="border-0">
                              <small>{incident.incidentType}</small>
                            </td>
                            <td className="border-0">
                              <span className={`badge bg-${severityBadge.color}`}>
                                {severityBadge.label}
                              </span>
                            </td>
                            <td className="border-0">
                              <span className={`badge bg-${priorityBadge.color}`}>
                                {priorityBadge.label}
                              </span>
                            </td>
                            <td className="border-0">
                              <span className={`badge bg-${statusBadge.color}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="border-0">
                              <small className="text-muted">
                                {formatDate(incident.submittedAt)}
                              </small>
                            </td>
                            <td className="border-0">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewIncident(incident)}
                              >
                                <i className="bi bi-eye me-1"></i>
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {showModal && selectedIncident && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-file-text me-2"></i>
                  Incident Details - {selectedIncident.incidentNumber}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  {/* Incident Information */}
                  <div className="col-md-8">
                    <div className="card border-0 bg-light">
                      <div className="card-header bg-transparent border-0">
                        <h6 className="fw-bold mb-0">Incident Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-12">
                            <strong>Title:</strong>
                            <p className="mb-2">{selectedIncident.title}</p>
                          </div>
                          <div className="col-md-6">
                            <strong>Type:</strong>
                            <p className="mb-2">{selectedIncident.incidentType}</p>
                          </div>
                          <div className="col-md-6">
                            <strong>Severity:</strong>
                            <span className={`badge bg-${getSeverityBadge(selectedIncident.severity).color} ms-2`}>
                              {getSeverityBadge(selectedIncident.severity).label}
                            </span>
                          </div>
                          <div className="col-12">
                            <strong>Description:</strong>
                            <p className="mb-2">{selectedIncident.description}</p>
                          </div>
                          {selectedIncident.location && (
                            <div className="col-md-6">
                              <strong>Location:</strong>
                              <p className="mb-2">{selectedIncident.location}</p>
                            </div>
                          )}
                          {selectedIncident.witnessesInvolved && (
                            <div className="col-md-6">
                              <strong>Witnesses/People Involved:</strong>
                              <p className="mb-2">{selectedIncident.witnessesInvolved}</p>
                            </div>
                          )}
                          {selectedIncident.immediateActions && (
                            <div className="col-12">
                              <strong>Immediate Actions Taken:</strong>
                              <p className="mb-2">{selectedIncident.immediateActions}</p>
                            </div>
                          )}
                          {selectedIncident.additionalNotes && (
                            <div className="col-12">
                              <strong>Additional Notes:</strong>
                              <p className="mb-2">{selectedIncident.additionalNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reporter Information */}
                    <div className="card border-0 bg-light mt-3">
                      <div className="card-header bg-transparent border-0">
                        <h6 className="fw-bold mb-0">Reporter Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <strong>Name:</strong>
                            <p className="mb-2">{selectedIncident.reporterName}</p>
                          </div>
                          <div className="col-md-4">
                            <strong>Role:</strong>
                            <span className="badge bg-secondary ms-2">
                              {selectedIncident.reporterRole?.charAt(0).toUpperCase() + selectedIncident.reporterRole?.slice(1)}
                            </span>
                          </div>
                          <div className="col-md-4">
                            <strong>Email:</strong>
                            <p className="mb-2">{selectedIncident.reporterEmail}</p>
                          </div>
                          <div className="col-md-6">
                            <strong>Submitted:</strong>
                            <p className="mb-2">{formatDate(selectedIncident.submittedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Review Panel */}
                  <div className="col-md-4">
                    <div className="card border-0 bg-primary bg-opacity-10">
                      <div className="card-header bg-transparent border-0">
                        <h6 className="fw-bold mb-0 text-primary">Admin Review</h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Status</label>
                          <select
                            className="form-select"
                            value={updateForm.status}
                            onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                          >
                            {STATUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Priority</label>
                          <select
                            className="form-select"
                            value={updateForm.priority}
                            onChange={(e) => setUpdateForm(prev => ({ ...prev, priority: e.target.value }))}
                          >
                            {PRIORITY_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Review Notes</label>
                          <textarea
                            className="form-control"
                            rows={4}
                            value={updateForm.reviewNotes}
                            onChange={(e) => setUpdateForm(prev => ({ ...prev, reviewNotes: e.target.value }))}
                            placeholder="Add review notes, investigation findings, or comments..."
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Resolution</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={updateForm.resolution}
                            onChange={(e) => setUpdateForm(prev => ({ ...prev, resolution: e.target.value }))}
                            placeholder="Describe the resolution or actions taken..."
                          />
                        </div>

                        {selectedIncident.reviewedBy && (
                          <div className="mb-3">
                            <small className="text-muted">
                              Last reviewed by: <strong>{selectedIncident.reviewedBy}</strong><br />
                              {formatDate(selectedIncident.reviewedAt)}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleUpdateIncident}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i>
                      Update Incident
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styling */}
      <style>{`
        /* Light mode styles */
        .dashboard-bg {
          background-color: #f8f9fa;
        }
        
        .card {
          border-radius: 12px;
          transition: all 0.2s ease;
          background-color: #ffffff;
          border: 1px solid #dee2e6;
          color: #212529;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
        
        .card-header {
          background-color: #ffffff !important;
          border-bottom: 1px solid #dee2e6 !important;
          color: #212529 !important;
        }
        
        .table {
          color: #212529;
        }
        
        .table th {
          font-weight: 600;
          color: #374151;
          background-color: #f8f9fa;
        }
        
        .table-light {
          background-color: #f8f9fa;
          color: #212529;
        }
        
        .table-hover tbody tr:hover {
          background-color: rgba(0, 0, 0, 0.075);
        }
        
        .badge {
          font-weight: 500;
          border-radius: 6px;
        }
        
        .btn {
          border-radius: 8px;
          font-weight: 500;
        }
        
        .form-control, .form-select {
          border-radius: 8px;
          border: 2px solid #e5e7eb;
          background-color: #ffffff;
          color: #212529;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background-color: #ffffff;
          color: #212529;
        }
        
        .modal-content {
          border-radius: 16px;
          background-color: #ffffff;
          color: #212529;
          border: 1px solid #dee2e6;
        }
        
        .modal-header {
          background-color: #ffffff;
          border-bottom: 1px solid #dee2e6;
          color: #212529;
        }
        
        .modal-body {
          background-color: #ffffff;
          color: #212529;
        }
        
        .modal-footer {
          background-color: #ffffff;
          border-top: 1px solid #dee2e6;
          color: #212529;
        }
        
        .bg-light {
          background-color: #f8f9fa !important;
          color: #212529 !important;
        }
        
        .bg-primary.bg-opacity-10 {
          background-color: rgba(13, 110, 253, 0.1) !important;
          color: #212529 !important;
        }
        
        .text-primary {
          color: #0d6efd !important;
        }
        
        .text-muted {
          color: #6c757d !important;
        }
        
        /* Dark theme support */
        [data-bs-theme="dark"] .dashboard-bg {
          background-color: #1a1d29;
        }
        
        [data-bs-theme="dark"] .card {
          background-color: #2d3748 !important;
          border-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .card-header {
          background-color: #4a5568 !important;
          border-bottom: 1px solid #718096 !important;
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .table {
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .table th {
          color: #e2e8f0 !important;
          background-color: #4a5568 !important;
        }
        
        [data-bs-theme="dark"] .table-light {
          background-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .table-hover tbody tr:hover {
          background-color: rgba(74, 85, 104, 0.5) !important;
        }
        
        [data-bs-theme="dark"] .form-control,
        [data-bs-theme="dark"] .form-select {
          background-color: #4a5568 !important;
          border-color: #718096 !important;
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .form-control:focus,
        [data-bs-theme="dark"] .form-select:focus {
          background-color: #2d3748 !important;
          border-color: #60a5fa !important;
          color: #e2e8f0 !important;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1) !important;
        }
        
        [data-bs-theme="dark"] .modal-content {
          background-color: #2d3748 !important;
          color: #e2e8f0 !important;
          border-color: #4a5568 !important;
        }
        
        [data-bs-theme="dark"] .modal-header {
          background-color: #2d3748 !important;
          border-bottom: 1px solid #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .modal-body {
          background-color: #2d3748 !important;
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .modal-footer {
          background-color: #2d3748 !important;
          border-top: 1px solid #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .bg-light {
          background-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .bg-primary.bg-opacity-10 {
          background-color: rgba(96, 165, 250, 0.2) !important;
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .text-primary {
          color: #60a5fa !important;
        }
        
        [data-bs-theme="dark"] .text-muted {
          color: #a0aec0 !important;
        }
        
        [data-bs-theme="dark"] .btn-close {
          filter: invert(1) grayscale(100%) brightness(200%);
        }
        
        /* Ensure proper contrast for all text elements */
        [data-bs-theme="dark"] h1, 
        [data-bs-theme="dark"] h2, 
        [data-bs-theme="dark"] h3, 
        [data-bs-theme="dark"] h4, 
        [data-bs-theme="dark"] h5, 
        [data-bs-theme="dark"] h6,
        [data-bs-theme="dark"] p,
        [data-bs-theme="dark"] span,
        [data-bs-theme="dark"] div,
        [data-bs-theme="dark"] label,
        [data-bs-theme="dark"] strong {
          color: #e2e8f0 !important;
        }
        
        /* Fix modal backdrop */
        [data-bs-theme="dark"] .modal {
          --bs-modal-bg: #2d3748;
          --bs-modal-border-color: #4a5568;
        }
        
        /* Fix dropdown menus */
        [data-bs-theme="dark"] .dropdown-menu {
          background-color: #2d3748 !important;
          border-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .dropdown-item {
          color: #e2e8f0 !important;
        }
        
        [data-bs-theme="dark"] .dropdown-item:hover {
          background-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
      `}</style>
    </>
  );
}
