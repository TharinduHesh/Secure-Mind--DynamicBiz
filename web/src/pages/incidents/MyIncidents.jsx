// web/src/pages/incidents/MyIncidents.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import UserTopbar from "../../components/UserTopbar";

const STATUS_COLORS = {
  submitted: 'primary',
  under_review: 'warning',
  investigating: 'info',
  resolved: 'success',
  closed: 'secondary',
  rejected: 'danger'
};

const PRIORITY_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  urgent: 'dark'
};

const SEVERITY_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'dark'
};

export default function MyIncidents() {
  const navigate = useNavigate();
  const db = useMemo(() => getFirestore(), []);
  
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reporterNotes, setReporterNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Auth state monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        navigate('/login');
        setLoading(false);
        return;
      }

      // Fetch user profile data
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setUserProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, db]);

  // Load user's incidents
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "incidents"),
        where("reporterId", "==", user.uid),
        orderBy("submittedAt", "desc")
      ),
      (snapshot) => {
        const incidentList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setIncidents(incidentList);
      },
      (error) => {
        console.error("Error loading incidents:", error);
      }
    );

    return () => unsubscribe();
  }, [db, user]);

  const getUserRole = () => {
    return userProfile?.role?.toLowerCase() || 'user';
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
    const color = STATUS_COLORS[status] || 'secondary';
    const label = status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
    return { color, label };
  };

  const getPriorityBadge = (priority) => {
    const color = PRIORITY_COLORS[priority] || 'secondary';
    const label = priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Unknown';
    return { color, label };
  };

  const getSeverityBadge = (severity) => {
    const color = SEVERITY_COLORS[severity] || 'secondary';
    const label = severity?.charAt(0).toUpperCase() + severity?.slice(1) || 'Unknown';
    return { color, label };
  };

  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setShowModal(true);
    setReporterNotes(incident.reporterNotes || "");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSaveNotes = async () => {
    if (!selectedIncident) return;
    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");
      const { updateDoc, doc, serverTimestamp } = await import("firebase/firestore");
      await updateDoc(doc(db, "incidents", selectedIncident.id), {
        reporterNotes: reporterNotes || "",
        updatedAt: serverTimestamp()
      });
      setSuccessMsg("Notes saved.");
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to save notes."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmClose = async () => {
    if (!selectedIncident) return;
    if (selectedIncident.status !== 'resolved') {
      setErrorMsg("You can only close an incident that is resolved.");
      return;
    }
    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");
      const { updateDoc, doc, serverTimestamp } = await import("firebase/firestore");
      await updateDoc(doc(db, "incidents", selectedIncident.id), {
        status: "closed",
        updatedAt: serverTimestamp()
      });
      setSuccessMsg("Incident closed.");
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to close incident.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4 d-flex justify-content-center align-items-center" style={{minHeight: '50vh'}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  const userRole = getUserRole();

  return (
    <>
      <UserTopbar />
      <div className="container my-4" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">
              <i className="bi bi-file-text me-2 text-primary"></i>
              My Incident Reports
            </h1>
            <p className="text-muted mb-0">
              View and track your submitted incident reports
            </p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-danger"
              onClick={() => navigate('/report-incident')}
            >
              <i className="bi bi-plus-lg me-2"></i>
              New Incident Report
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate(`/${userRole}`)}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Incidents List */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 py-3">
            <h5 className="mb-0 fw-bold">
              Your Incident Reports ({incidents.length})
            </h5>
          </div>
          <div className="card-body p-0">
            {incidents.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                <h5 className="text-muted mb-3">No incident reports found</h5>
                <p className="text-muted mb-4">You haven't submitted any incident reports yet.</p>
                <button 
                  className="btn btn-danger"
                  onClick={() => navigate('/report-incident')}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Submit Your First Report
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold">Incident #</th>
                      <th className="border-0 fw-semibold">Title</th>
                      <th className="border-0 fw-semibold">Type</th>
                      <th className="border-0 fw-semibold">Severity</th>
                      <th className="border-0 fw-semibold">Priority</th>
                      <th className="border-0 fw-semibold">Status</th>
                      <th className="border-0 fw-semibold">Submitted</th>
                      <th className="border-0 fw-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((incident) => {
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
                              View
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

      {/* Incident Detail Modal */}
      {showModal && selectedIncident && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
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
                  {/* Status and Priority */}
                  <div className="col-12">
                    <div className="d-flex gap-3 mb-3">
                      <div>
                        <strong>Status:</strong>
                        <span className={`badge bg-${getStatusBadge(selectedIncident.status).color} ms-2`}>
                          {getStatusBadge(selectedIncident.status).label}
                        </span>
                      </div>
                      <div>
                        <strong>Priority:</strong>
                        <span className={`badge bg-${getPriorityBadge(selectedIncident.priority).color} ms-2`}>
                          {getPriorityBadge(selectedIncident.priority).label}
                        </span>
                      </div>
                      <div>
                        <strong>Severity:</strong>
                        <span className={`badge bg-${getSeverityBadge(selectedIncident.severity).color} ms-2`}>
                          {getSeverityBadge(selectedIncident.severity).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Incident Information */}
                  <div className="col-12">
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
                            <strong>Submitted:</strong>
                            <p className="mb-2">{formatDate(selectedIncident.submittedAt)}</p>
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
                  </div>

                  {/* Admin Review (if available) */}
                  {(selectedIncident.reviewNotes || selectedIncident.resolution || selectedIncident.reviewedBy) && (
                    <div className="col-12">
                      <div className="card border-0 bg-primary bg-opacity-10">
                        <div className="card-header bg-transparent border-0">
                          <h6 className="fw-bold mb-0 text-primary">Admin Review</h6>
                        </div>
                        <div className="card-body">
                          {selectedIncident.reviewedBy && (
                            <div className="mb-3">
                              <strong>Reviewed by:</strong>
                              <p className="mb-1">{selectedIncident.reviewedBy}</p>
                              <small className="text-muted">
                                {formatDate(selectedIncident.reviewedAt)}
                              </small>
                            </div>
                          )}
                          {selectedIncident.reviewNotes && (
                            <div className="mb-3">
                              <strong>Review Notes:</strong>
                              <p className="mb-2">{selectedIncident.reviewNotes}</p>
                            </div>
                          )}
                          {selectedIncident.resolution && (
                            <div className="mb-3">
                              <strong>Resolution:</strong>
                              <p className="mb-2">{selectedIncident.resolution}</p>
                            </div>
                          )}
                          {selectedIncident.resolvedAt && (
                            <div>
                              <strong>Resolved:</strong>
                              <p className="mb-0">{formatDate(selectedIncident.resolvedAt)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reporter Notes and Close Confirmation */}
                  <div className="col-12">
                    <div className="card border-0">
                      <div className="card-header bg-transparent border-0">
                        <h6 className="fw-bold mb-0">Your Notes</h6>
                      </div>
                      <div className="card-body">
                        {errorMsg && (
                          <div className="alert alert-danger py-2 mb-3">{errorMsg}</div>
                        )}
                        {successMsg && (
                          <div className="alert alert-success py-2 mb-3">{successMsg}</div>
                        )}
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Add notes or updates</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={reporterNotes}
                            onChange={(e) => setReporterNotes(e.target.value)}
                            placeholder="Add any updates or context for admins"
                          />
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary"
                            onClick={handleSaveNotes}
                            disabled={saving}
                          >
                            {saving ? "Saving..." : "Save Notes"}
                          </button>
                          {selectedIncident.status === 'resolved' && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={handleConfirmClose}
                              disabled={saving}
                            >
                              {saving ? "Closing..." : "Confirm Close"}
                            </button>
                          )}
                        </div>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styling */}
      <style>{`
        .card {
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }

        .table th {
          font-weight: 600;
          color: #374151;
        }

        .badge {
          font-weight: 500;
          border-radius: 6px;
        }

        .btn {
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .modal-content {
          border-radius: 16px;
        }

        /* Dark theme support */
        [data-bs-theme="dark"] .card {
          background-color: #2d3748;
          border-color: #4a5568;
          color: #e2e8f0;
        }

        [data-bs-theme="dark"] .card-header {
          background-color: #4a5568 !important;
          border-bottom: 1px solid #718096 !important;
          color: #e2e8f0 !important;
        }

        [data-bs-theme="dark"] .table {
          color: #e2e8f0;
        }

        [data-bs-theme="dark"] .table-light {
          background-color: #4a5568;
          color: #e2e8f0;
        }

        [data-bs-theme="dark"] .table-hover tbody tr:hover {
          background-color: rgba(74, 85, 104, 0.5);
        }

        [data-bs-theme="dark"] .modal-content {
          background-color: #2d3748;
          color: #e2e8f0;
        }

        [data-bs-theme="dark"] .text-muted {
          color: #a0aec0 !important;
        }
      `}</style>
    </>
  );
}
