// web/src/pages/incidents/IncidentReport.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import UserTopbar from "../../components/UserTopbar";

const INCIDENT_TYPES = {
  security: [
    "Data Breach",
    "Phishing Attack",
    "Malware/Virus",
    "Unauthorized Access",
    "Social Engineering",
    "Password Compromise",
    "Suspicious Activity",
    "Security Policy Violation",
    "Other Security Issue"
  ],
  accounting: [
    "Financial Fraud",
    "Invoice Discrepancy",
    "Payment Processing Error",
    "Accounting System Issue",
    "Compliance Violation",
    "Audit Finding",
    "Budget Variance",
    "Expense Report Issue",
    "Other Financial Issue"
  ],
  marketing: [
    "Brand Misuse",
    "Content Violation",
    "Social Media Issue",
    "Campaign Problem",
    "Customer Complaint",
    "Reputation Issue",
    "Marketing System Failure",
    "Compliance Issue",
    "Other Marketing Issue"
  ],
  developer: [
    "Code Vulnerability",
    "System Outage",
    "Performance Issue",
    "Data Loss",
    "API Failure",
    "Deployment Issue",
    "Security Bug",
    "Integration Problem",
    "Other Technical Issue"
  ],
  design: [
    "Design System Violation",
    "Brand Guideline Issue",
    "Accessibility Problem",
    "User Experience Issue",
    "Asset Management Problem",
    "Tool/Software Issue",
    "Client Feedback Issue",
    "Quality Control Problem",
    "Other Design Issue"
  ],
  admin: [
    "Policy Violation",
    "System Administration Issue",
    "User Management Problem",
    "Access Control Issue",
    "Compliance Violation",
    "Process Failure",
    "Resource Issue",
    "Vendor Problem",
    "Other Administrative Issue"
  ]
};

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "success", description: "Minor issue with minimal impact" },
  { value: "medium", label: "Medium", color: "warning", description: "Moderate issue requiring attention" },
  { value: "high", label: "High", color: "danger", description: "Serious issue requiring immediate attention" },
  { value: "critical", label: "Critical", color: "dark", description: "Critical issue requiring urgent response" }
];

export default function IncidentReport() {
  const navigate = useNavigate();
  const db = useMemo(() => getFirestore(), []);
  
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    incidentType: '',
    customIncidentType: '',
    severity: 'medium',
    title: '',
    description: '',
    location: '',
    witnessesInvolved: '',
    immediateActions: '',
    additionalNotes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

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

  const getUserRole = () => {
    return userProfile?.role?.toLowerCase() || 'user';
  };

  const getIncidentTypes = () => {
    const role = getUserRole();
    return INCIDENT_TYPES[role] || INCIDENT_TYPES.admin;
  };

  const clearMessages = () => {
    setErrors({});
    setSuccess('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Incident title is required';
    }
    
    if (!formData.incidentType && !formData.customIncidentType.trim()) {
      newErrors.incidentType = 'Please select an incident type or specify a custom type';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Incident description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
    }
    
    if (!formData.severity) {
      newErrors.severity = 'Severity level is required';
    }
    
    return newErrors;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setSubmitting(true);
    try {
      const incidentData = {
        // Reporter information
        reporterId: user.uid,
        reporterName: user.displayName || userProfile?.displayName || user.email?.split('@')[0] || 'Unknown',
        reporterEmail: user.email,
        reporterRole: getUserRole(),
        
        // Incident details
        title: formData.title.trim(),
        incidentType: formData.incidentType || formData.customIncidentType.trim(),
        severity: formData.severity,
        description: formData.description.trim(),
        location: formData.location.trim(),
        witnessesInvolved: formData.witnessesInvolved.trim(),
        immediateActions: formData.immediateActions.trim(),
        additionalNotes: formData.additionalNotes.trim(),
        
        // Status and tracking
        status: 'submitted',
        priority: formData.severity === 'critical' ? 'urgent' : 
                 formData.severity === 'high' ? 'high' : 
                 formData.severity === 'medium' ? 'medium' : 'low',
        
        // Timestamps
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Admin review fields (initially empty)
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: '',
        resolution: '',
        resolvedAt: null,
        
        // Tracking
        incidentNumber: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        updates: []
      };

      const docRef = await addDoc(collection(db, "incidents"), incidentData);
      
      setSuccess(`Incident report submitted successfully! Incident Number: ${incidentData.incidentNumber}`);
      
      // Reset form
      setFormData({
        incidentType: '',
        customIncidentType: '',
        severity: 'medium',
        title: '',
        description: '',
        location: '',
        witnessesInvolved: '',
        immediateActions: '',
        additionalNotes: ''
      });
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Error submitting incident report:', error);
      setErrors({ general: 'Failed to submit incident report. Please try again.' });
    } finally {
      setSubmitting(false);
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
  const incidentTypes = getIncidentTypes();

  return (
    <>
      <UserTopbar />
      <div className="container my-4" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">
              <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
              Submit Incident Report
            </h1>
            <p className="text-muted mb-0">
              Report security incidents, issues, or concerns for immediate attention
            </p>
          </div>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate(`/${userRole}`)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="alert alert-success border-0 shadow-sm mb-4" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {success}
          </div>
        )}

        {errors.general && (
          <div className="alert alert-danger border-0 shadow-sm mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errors.general}
          </div>
        )}

        {/* Reporter Information */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white border-0 py-3">
            <h5 className="mb-0 fw-bold d-flex align-items-center">
              <i className="bi bi-person-badge me-2 text-primary"></i>
              Reporter Information
            </h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={user.displayName || userProfile?.displayName || user.email?.split('@')[0] || 'Unknown'}
                  disabled
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Role</label>
                <input
                  type="text"
                  className="form-control"
                  value={userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  disabled
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={user.email}
                  disabled
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Incident Details Form */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 py-3">
            <h5 className="mb-0 fw-bold d-flex align-items-center">
              <i className="bi bi-file-text me-2 text-primary"></i>
              Incident Details
            </h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Incident Title */}
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Incident Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief summary of the incident"
                    maxLength={200}
                  />
                  {errors.title && (
                    <div className="invalid-feedback">{errors.title}</div>
                  )}
                </div>

                {/* Incident Type */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Incident Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.incidentType ? 'is-invalid' : ''}`}
                    value={formData.incidentType}
                    onChange={(e) => handleInputChange('incidentType', e.target.value)}
                  >
                    <option value="">Select incident type...</option>
                    {incidentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="custom">Other (specify below)</option>
                  </select>
                  {errors.incidentType && (
                    <div className="invalid-feedback">{errors.incidentType}</div>
                  )}
                </div>

                {/* Custom Incident Type */}
                {formData.incidentType === 'custom' && (
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Custom Incident Type <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.customIncidentType}
                      onChange={(e) => handleInputChange('customIncidentType', e.target.value)}
                      placeholder="Specify the incident type"
                    />
                  </div>
                )}

                {/* Severity */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Severity Level <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.severity ? 'is-invalid' : ''}`}
                    value={formData.severity}
                    onChange={(e) => handleInputChange('severity', e.target.value)}
                  >
                    {SEVERITY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </option>
                    ))}
                  </select>
                  {errors.severity && (
                    <div className="invalid-feedback">{errors.severity}</div>
                  )}
                </div>

                {/* Description */}
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Detailed Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide a detailed description of the incident, including what happened, when it occurred, and any relevant context..."
                  />
                  {errors.description && (
                    <div className="invalid-feedback">{errors.description}</div>
                  )}
                  <small className="form-text text-muted">
                    Minimum 20 characters. Current: {formData.description.length}
                  </small>
                </div>

                {/* Location */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Where did the incident occur? (office, system, URL, etc.)"
                  />
                </div>

                {/* Witnesses/People Involved */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Witnesses/People Involved</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.witnessesInvolved}
                    onChange={(e) => handleInputChange('witnessesInvolved', e.target.value)}
                    placeholder="Names or roles of people who witnessed or were involved"
                  />
                </div>

                {/* Immediate Actions */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Immediate Actions Taken</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.immediateActions}
                    onChange={(e) => handleInputChange('immediateActions', e.target.value)}
                    placeholder="What immediate actions were taken to address or contain the incident?"
                  />
                </div>

                {/* Additional Notes */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Additional Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.additionalNotes}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                    placeholder="Any additional information, attachments, or context that might be helpful..."
                  />
                </div>

                {/* Submit Button */}
                <div className="col-12">
                  <div className="d-flex gap-3 justify-content-end">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={() => navigate(`/${userRole}`)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-danger"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Submit Incident Report
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

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

          .form-control, .form-select {
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            padding: 12px 16px;
            transition: all 0.2s ease;
          }

          .form-control:focus, .form-select:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-control:disabled {
            background-color: #f8f9fa !important;
            opacity: 0.7;
          }

          .btn {
            border-radius: 8px;
            padding: 12px 24px;
            font-weight: 600;
            transition: all 0.2s ease;
          }

          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .alert {
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
          }

          .form-label {
            margin-bottom: 8px;
            color: #374151;
          }

          .text-danger {
            color: #dc2626 !important;
          }

          .invalid-feedback {
            display: block;
            color: #dc2626;
            font-size: 0.875rem;
            margin-top: 4px;
          }

          .is-invalid {
            border-color: #dc2626 !important;
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

          [data-bs-theme="dark"] .form-control,
          [data-bs-theme="dark"] .form-select {
            background-color: #4a5568;
            border-color: #718096;
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .form-control:focus,
          [data-bs-theme="dark"] .form-select:focus {
            background-color: #2d3748;
            border-color: #60a5fa;
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .form-control:disabled {
            background-color: #374151 !important;
            color: #9ca3af !important;
          }

          [data-bs-theme="dark"] .form-label {
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .text-muted {
            color: #a0aec0 !important;
          }

          [data-bs-theme="dark"] .alert-success {
            background-color: #14532d;
            border-color: #16a34a;
            color: #bbf7d0;
          }

          [data-bs-theme="dark"] .alert-danger {
            background-color: #7f1d1d;
            border-color: #dc2626;
            color: #fecaca;
          }
        `}</style>
      </div>
    </>
  );
}
