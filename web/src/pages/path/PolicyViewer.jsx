// web/src/pages/accounting/PolicyViewer.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getFirestore, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import UserTopbar from "../../components/UserTopbar";

export default function PolicyViewer() {
  const { policyId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const db = useMemo(() => getFirestore(), []);

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [hasReadToEnd, setHasReadToEnd] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Auth state monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchPolicy = async () => {
      if (!policyId || !user) {
        setError("Policy ID not provided or user not authenticated");
        setLoading(false);
        return;
      }

      try {
        const policyDoc = await getDoc(doc(db, "policies", policyId));
        
        if (!policyDoc.exists()) {
          setError("Policy not found");
          setLoading(false);
          return;
        }

        const policyData = { id: policyDoc.id, ...policyDoc.data() };
        setPolicy(policyData);

        // Check if already acknowledged
        try {
          const ackDoc = await getDoc(doc(db, "policy_acks", `${user.uid}_${policyId}`));
          setIsAcknowledged(ackDoc.exists());
        } catch (ackError) {
          console.log("Could not check acknowledgment status:", ackError);
        }

      } catch (err) {
        console.error("Error fetching policy:", err);
        setError("Error loading policy");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPolicy();
    }
  }, [policyId, user, db]);

  // Scroll tracking effect
  useEffect(() => {
    const handleScroll = (e) => {
      const element = e.target;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      // If content fits in viewport (no scrolling needed), consider it fully read
      if (scrollHeight <= clientHeight + 30) { // Increased buffer for browser differences
        setHasReadToEnd(true);
        setScrollProgress(100);
        return;
      }

      const scrollPercent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      setScrollProgress(Math.max(0, Math.min(100, scrollPercent))); // Ensure 0-100 range
      
      // Consider fully read when user has scrolled to 90% or more
      if (scrollPercent >= 90) {
        setHasReadToEnd(true);
      }
    };

    // Enhanced check initial state function
    const checkInitialState = () => {
      const policyContent = document.querySelector('.policy-content-container');
      if (!policyContent || !policy?.content) {
        return false; // Return false to indicate we need to retry
      }

      // Force a layout recalculation by accessing offsetHeight
      const forceLayout = policyContent.offsetHeight;
      
      // Use multiple measurement attempts with requestAnimationFrame
      const measureContent = () => {
        const scrollHeight = policyContent.scrollHeight;
        const clientHeight = policyContent.clientHeight;
        const offsetHeight = policyContent.offsetHeight;
        
        console.log('Policy content measurements:', { 
          scrollHeight, 
          clientHeight, 
          offsetHeight, 
          contentLength: policy.content.length,
          fits: scrollHeight <= clientHeight + 30 
        });
        
        // Multiple conditions to detect small content
        const contentFitsInViewport = (
          scrollHeight <= clientHeight + 30 || // Standard check with buffer
          scrollHeight <= offsetHeight + 30 || // Alternative measurement
          scrollHeight < 200 || // Very small content
          (policy.content.length < 500 && scrollHeight <= clientHeight + 50) // Short text with larger buffer
        );
        
        if (contentFitsInViewport) {
          console.log('✅ Content determined to fit in viewport - marking as fully read');
          setHasReadToEnd(true);
          setScrollProgress(100);
        } else {
          console.log('📜 Content requires scrolling - resetting progress');
          setHasReadToEnd(false);
          setScrollProgress(0);
        }
        
        // Add scroll listener for scrollable content
        if (!contentFitsInViewport) {
          policyContent.addEventListener('scroll', handleScroll);
        }
        
        return true; // Measurement successful
      };

      // Try immediate measurement
      if (measureContent()) {
        return true;
      }
      
      // If immediate measurement failed, try with requestAnimationFrame
      requestAnimationFrame(() => {
        if (measureContent()) {
          return;
        }
        
        // Final attempt after another frame
        requestAnimationFrame(measureContent);
      });
      
      return true;
    };

    // Reset state first
    setHasReadToEnd(false);
    setScrollProgress(0);

    // Try multiple times with increasing delays
    const attempts = [50, 200, 500, 1000]; // Multiple timing attempts
    const timeouts = [];
    
    attempts.forEach((delay, index) => {
      const timeoutId = setTimeout(() => {
        if (checkInitialState()) {
          // Clear remaining timeouts if successful
          timeouts.slice(index + 1).forEach(clearTimeout);
        }
      }, delay);
      timeouts.push(timeoutId);
    });
    
    return () => {
      // Cleanup
      timeouts.forEach(clearTimeout);
      const policyContent = document.querySelector('.policy-content-container');
      if (policyContent) {
        policyContent.removeEventListener('scroll', handleScroll);
      }
    };
  }, [policy?.content, policy?.id, policy?.title]); // Enhanced dependencies

  // Manual refresh function for edge cases
  const handleManualRefresh = () => {
    const policyContent = document.querySelector('.policy-content-container');
    if (policyContent && policy?.content) {
      const scrollHeight = policyContent.scrollHeight;
      const clientHeight = policyContent.clientHeight;
      
      console.log('Manual refresh triggered:', { scrollHeight, clientHeight });
      
      const contentFitsInViewport = (
        scrollHeight <= clientHeight + 30 ||
        scrollHeight < 200 ||
        (policy.content.length < 500 && scrollHeight <= clientHeight + 50)
      );
      
      if (contentFitsInViewport) {
        setHasReadToEnd(true);
        setScrollProgress(100);
      }
    }
  };

  const handleAcknowledge = async () => {
    if (!user || !policy) return;

    setAcknowledging(true);
    try {
      await setDoc(doc(db, "policy_acks", `${user.uid}_${policy.id}`), {
        userId: user.uid,
        userEmail: user.email,
        policyId: policy.id,
        policyTitle: policy.title,
        policyVersion: policy.version || 1,
        acknowledgedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setIsAcknowledged(true);
      alert('Policy acknowledged successfully!');
    } catch (err) {
      console.error("Error acknowledging policy:", err);
      alert("Error acknowledging policy. Please try again.");
    } finally {
      setAcknowledging(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "â€”";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "â€”";
    }
  };

  const getRolesToDisplay = (policy) => {
    // Handle both new targets format and legacy roles format
    const roles = policy.targets?.roles || policy.roles || [];
    if (!roles || roles.length === 0) return "All users";
    return roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ");
  };

  if (loading) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4 d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading policy...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !policy) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4" style={{ maxWidth: 800 }}>
          <div className="alert alert-danger d-flex align-items-center">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error || "Policy not found"}
          </div>
          <button 
            className="btn btn-outline-primary"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Go Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <UserTopbar />
      <div className="container my-4" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div className="d-flex align-items-center mb-4">
          <button 
            className="btn btn-outline-secondary me-3"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </button>
          <div className="flex-grow-1">
            <h1 className="h3 fw-bold mb-1">{policy.title}</h1>
            <div className="d-flex align-items-center gap-3">
              <span className="badge bg-primary-subtle text-primary">
                Version {policy.version || 1}
              </span>
              <span className={`badge ${policy.status === 'published' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                {policy.status === 'published' ? 'Published' : 'Draft'}
              </span>
              {isAcknowledged && (
                <span className="badge bg-info-subtle text-info">
                  <i className="bi bi-check-circle me-1"></i>
                  Acknowledged
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Policy Metadata */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-calendar-event me-2 text-primary"></i>
                  <div>
                    <div className="fw-semibold small">Updated</div>
                    <div className="text-muted small">{formatDate(policy.updatedAt)}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-people me-2 text-primary"></i>
                  <div>
                    <div className="fw-semibold small">Applies to</div>
                    <div className="text-muted small">{getRolesToDisplay(policy)}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-broadcast me-2 text-primary"></i>
                  <div>
                    <div className="fw-semibold small">Published</div>
                    <div className="text-muted small">{formatDate(policy.publishedAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="card border-0 shadow-sm policy-content-card">
          {/* Reading Progress Bar - Only show if content requires scrolling */}
          {!hasReadToEnd && policy?.content && scrollProgress < 100 && (
            <div className="reading-progress-container">
              <div className="reading-progress-header">
                <div className="d-flex justify-content-between align-items-center p-3 bg-info-subtle">
                  <div>
                    <i className="bi bi-book me-2 text-info"></i>
                    <strong>Reading Progress: {scrollProgress}%</strong>
                  </div>
                  <div className="text-muted small">
                    "Please scroll through the entire policy content to acknowledge"
                  </div>
                </div>
                <div className="progress" style={{ height: '4px' }}>
                  <div 
                    className="progress-bar bg-info" 
                    role="progressbar" 
                    style={{ width: `${scrollProgress}%` }}
                  ></div>
                </div>
              </div>
              {/* Manual refresh button for small content detection issues */}
              {scrollProgress === 0 && policy?.content && (
                <div className="p-2 text-center bg-light border-top">
                  <small className="text-muted me-2">Content appears small but not detected?</small>
                  <button 
                    className="btn btn-sm btn-outline-info" 
                    onClick={handleManualRefresh}
                    title="Click if you can see all content without scrolling"
                  >
                    <i className="bi bi-eye-fill me-1"></i>
                    I can see all content
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Show confirmation when small content is properly detected */}
          {hasReadToEnd && scrollProgress === 100 && policy?.content && (
            <div className="reading-progress-container">
              <div className="reading-progress-header">
                <div className="d-flex justify-content-between align-items-center p-3 bg-success-subtle">
                  <div>
                    <i className="bi bi-check-circle me-2 text-success"></i>
                    <strong>Content Fully Visible: 100%</strong>
                  </div>
                  <div className="text-muted small">
                    "All policy content is visible - you may acknowledge"
                  </div>
                </div>
                <div className="progress" style={{ height: '4px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          
          <div 
            className="card-body p-4 p-md-5 policy-content-container" 
            style={{ 
              maxHeight: '70vh', 
              overflowY: 'auto',
              scrollBehavior: 'smooth'
            }}
          >
            <div className="policy-content">
              {policy.content ? (
                <div 
                  className="policy-text"
                  style={{ 
                    whiteSpace: 'pre-wrap', 
                    lineHeight: '1.7',
                    fontSize: '1.1rem'
                  }}
                >
                  {policy.content}
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-file-text" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-3">No content available for this policy</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acknowledgment Section */}
        {policy.status === 'published' && !isAcknowledged && (
          <div className="card border-0 shadow-sm mt-4 acknowledgment-card">
            <div className="card-body text-center p-4">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-check-circle me-2"></i>
                Acknowledge Policy
              </h5>
              
              {!hasReadToEnd ? (
                <div className="mb-4">
                  <div className="alert alert-warning d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <div>
                      <strong>Please read the entire policy content above before acknowledging.</strong>
                      <div className="small mt-1">
                        Scroll through the policy content to unlock the acknowledgment button.
                        Current progress: {scrollProgress}% (Need 90% to acknowledge)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="alert alert-success d-flex align-items-center">
                    <i className="bi bi-check-circle me-2"></i>
                    <div>
                      <strong>Thank you for reading the complete policy!</strong>
                      <div className="small mt-1">You can now acknowledge this policy.</div>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-muted mb-4">
                By acknowledging this policy, you confirm that you have read and understood 
                the content and agree to comply with its requirements.
              </p>
              
              <button 
                className="btn btn-success btn-lg"
                onClick={handleAcknowledge}
                disabled={acknowledging || !hasReadToEnd}
                style={{ 
                  opacity: hasReadToEnd ? 1 : 0.5,
                  cursor: hasReadToEnd ? 'pointer' : 'not-allowed'
                }}
              >
                {acknowledging ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Acknowledging...
                  </>
                ) : (
                  <>
                    <i className={`bi ${hasReadToEnd ? 'bi-check-circle' : 'bi-lock'} me-2`}></i>
                    {hasReadToEnd ? 'I Acknowledge This Policy' : 'Read Policy to Unlock'}
                  </>
                )}
              </button>
              
              {!hasReadToEnd && (
                <div className="mt-3">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    This button will be enabled once you've read the entire policy content
                  </small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Already Acknowledged */}
        {isAcknowledged && (
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body text-center p-4">
              <div className="text-success mb-3">
                <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem' }}></i>
              </div>
              <h5 className="fw-bold text-success mb-2">Policy Acknowledged</h5>
              <p className="text-muted mb-0">
                You have successfully acknowledged this policy. Thank you for your compliance.
              </p>
            </div>
          </div>
        )}

        <style>{`
          .policy-content-card {
            border-radius: 16px;
            border-left: 4px solid var(--bs-primary);
          }

          .policy-content-container {
            position: relative;
          }

          .policy-content-container::-webkit-scrollbar {
            width: 8px;
          }

          .policy-content-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }

          .policy-content-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }

          .policy-content-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }

          .reading-progress-container {
            border-radius: 16px 16px 0 0;
            overflow: hidden;
          }

          .reading-progress-header {
            background: linear-gradient(135deg, rgba(13, 202, 240, 0.1), rgba(13, 110, 253, 0.05));
          }

          .policy-text {
            color: var(--bs-dark);
          }

          .acknowledgment-card {
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(25, 135, 84, 0.05), rgba(25, 135, 84, 0.02));
            border-left: 4px solid var(--bs-success);
          }

          .badge {
            font-weight: 500;
            padding: 6px 12px;
            border-radius: 8px;
          }

          .bg-primary-subtle { background-color: #dbeafe !important; }
          .text-primary { color: #2563eb !important; }
          .bg-success-subtle { background-color: #dcfce7 !important; }
          .text-success { color: #16a34a !important; }
          .bg-warning-subtle { background-color: #fef3c7 !important; }
          .text-warning { color: #d97706 !important; }
          .bg-info-subtle { background-color: #dbeafe !important; }
          .text-info { color: #0891b2 !important; }

          /* Dark theme support */
          [data-bs-theme="dark"] .policy-content-card,
          [data-bs-theme="dark"] .acknowledgment-card,
          [data-bs-theme="dark"] .card {
            background-color: #2d3748;
            border-color: #4a5568;
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .policy-content-container::-webkit-scrollbar-track {
            background: #4a5568;
          }

          [data-bs-theme="dark"] .policy-content-container::-webkit-scrollbar-thumb {
            background: #718096;
          }

          [data-bs-theme="dark"] .policy-content-container::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }

          [data-bs-theme="dark"] .reading-progress-header {
            background: linear-gradient(135deg, rgba(56, 178, 172, 0.2), rgba(49, 130, 206, 0.1));
          }

          [data-bs-theme="dark"] .policy-text {
            color: var(--bs-light);
          }

          [data-bs-theme="dark"] .bg-primary-subtle { background-color: #1e3a8a !important; }
          [data-bs-theme="dark"] .text-primary { color: #60a5fa !important; }
          [data-bs-theme="dark"] .bg-success-subtle { background-color: #14532d !important; }
          [data-bs-theme="dark"] .text-success { color: #4ade80 !important; }
          [data-bs-theme="dark"] .bg-warning-subtle { background-color: #744210 !important; }
          [data-bs-theme="dark"] .text-warning { color: #fbbf24 !important; }
          [data-bs-theme="dark"] .bg-info-subtle { background-color: #164e63 !important; }
          [data-bs-theme="dark"] .text-info { color: #38bdf8 !important; }

          [data-bs-theme="dark"] .text-muted {
            color: #a0aec0 !important;
          }

          @media (max-width: 768px) {
            .policy-content-card .card-body {
              padding: 1.5rem;
            }
            
            .policy-text {
              font-size: 1rem;
            }

            .policy-content-container {
              max-height: 60vh;
            }
          }
        `}</style>
      </div>
    </>
  );
}