// web\src\pages\accounting\UserPoliciesList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const PolicyCard = ({ policy, isAcknowledged }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString();
    } catch {
      return "—";
    }
  };

  const getRolesToDisplay = (policy) => {
    const roles = policy.targets?.roles || policy.roles || [];
    if (!roles || roles.length === 0) return "All users";
    return roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ");
  };

  return (
    <div className="col-md-6 col-lg-4">
      <div className="card h-100 border-0 shadow-sm policy-card">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h5 className="fw-bold mb-0">{policy.title}</h5>
            <div className="d-flex flex-column gap-1">
              <span className="badge bg-primary-subtle text-primary">
                v{policy.version || 1}
              </span>
              {isAcknowledged && (
                <span className="badge bg-success-subtle text-success">
                  <i className="bi bi-check-circle-fill me-1"></i>
                  Read
                </span>
              )}
            </div>
          </div>
          
          <p className="text-muted small mb-3">
            {policy.content ? 
              policy.content.substring(0, 120) + (policy.content.length > 120 ? '...' : '') : 
              'No content available'
            }
          </p>
          
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center text-muted small">
              <span>
                <i className="bi bi-people me-1"></i>
                {getRolesToDisplay(policy)}
              </span>
              <span>
                <i className="bi bi-calendar me-1"></i>
                {formatDate(policy.updatedAt)}
              </span>
            </div>
          </div>
          
          <div className="d-flex justify-content-between align-items-center">
            <Link 
              to={`/policies/${policy.id}`} 
              className="btn btn-primary btn-sm"
            >
              <i className="bi bi-eye me-1"></i>
              Read Policy
            </Link>
            {!isAcknowledged && (
              <span className="badge bg-warning-subtle text-warning">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Action Required
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UserPoliciesList() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState([]);
  const [acknowledgements, setAcknowledgements] = useState([]);

  const db = useMemo(() => getFirestore(), []);

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
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, db]);

  // Fetch policies that target the user
  useEffect(() => {
    if (!user || !userProfile) return;

    const policiesQuery = query(
      collection(db, "policies"),
      where("status", "==", "published"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(policiesQuery, (snapshot) => {
      const policiesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(policy => {
          // Check if policy targets the user
          const targets = policy.targets || {};
          const userRole = userProfile.role || 'user';
          
          // If targets all users
          if (targets.all === true) return true;
          
          // If targets specific roles and user's role is included
          if (targets.roles && Array.isArray(targets.roles)) {
            return targets.roles.includes(userRole);
          }
          
          // If targets specific users
          if (targets.users && Array.isArray(targets.users)) {
            return targets.users.includes(user.uid);
          }

          // Fallback: check old roles field format
          if (policy.roles && Array.isArray(policy.roles)) {
            return policy.roles.includes(userRole);
          }

          return false;
        });
      
      setPolicies(policiesData);
      console.log('Loaded policies for user:', policiesData.length);
    }, (error) => {
      console.error('Error fetching policies:', error);
    });

    return () => unsubscribe();
  }, [user, userProfile, db]);

  // Fetch user's acknowledgements
  useEffect(() => {
    if (!user) return;

    const acknowledgementsQuery = query(
      collection(db, "policy_acks"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(acknowledgementsQuery, (snapshot) => {
      const acks = snapshot.docs.map(doc => doc.data());
      setAcknowledgements(acks);
    }, (error) => {
      console.error('Error fetching acknowledgements:', error);
    });

    return () => unsubscribe();
  }, [user, db]);

  // Helper to check if policy is acknowledged
  const isPolicyAcknowledged = (policyId) => {
    return acknowledgements.some(ack => ack.policyId === policyId);
  };

  // Separate acknowledged and unacknowledged policies
  const unacknowledgedPolicies = policies.filter(p => !isPolicyAcknowledged(p.id));
  const acknowledgedPolicies = policies.filter(p => isPolicyAcknowledged(p.id));

  if (loading) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4 d-flex justify-content-center align-items-center" style={{minHeight: '50vh'}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading policies...</span>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <UserTopbar />
      <div className="container my-4" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold text-gradient mb-3">Company Policies</h1>
          <p className="lead text-body-secondary">
            Review and acknowledge company policies that apply to your role
          </p>
        </div>

        {/* Summary Stats */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm stats-card">
              <div className="card-body text-center p-4">
                <div className="stats-icon bg-primary-subtle mb-3">
                  <i className="bi bi-file-text text-primary"></i>
                </div>
                <h3 className="fw-bold mb-1">{policies.length}</h3>
                <p className="text-muted mb-0">Total Policies</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm stats-card">
              <div className="card-body text-center p-4">
                <div className="stats-icon bg-success-subtle mb-3">
                  <i className="bi bi-check-circle text-success"></i>
                </div>
                <h3 className="fw-bold mb-1">{acknowledgedPolicies.length}</h3>
                <p className="text-muted mb-0">Acknowledged</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm stats-card">
              <div className="card-body text-center p-4">
                <div className="stats-icon bg-warning-subtle mb-3">
                  <i className="bi bi-exclamation-triangle text-warning"></i>
                </div>
                <h3 className="fw-bold mb-1">{unacknowledgedPolicies.length}</h3>
                <p className="text-muted mb-0">Pending Review</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Policies */}
        {unacknowledgedPolicies.length > 0 && (
          <div className="mb-5">
            <div className="d-flex align-items-center mb-4">
              <i className="bi bi-exclamation-triangle-fill text-warning me-2 fs-4"></i>
              <h2 className="fw-bold mb-0">Policies Requiring Your Acknowledgment</h2>
            </div>
            <div className="row g-4">
              {unacknowledgedPolicies.map((policy) => (
                <PolicyCard 
                  key={policy.id} 
                  policy={policy} 
                  isAcknowledged={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Acknowledged Policies */}
        {acknowledgedPolicies.length > 0 && (
          <div className="mb-5">
            <div className="d-flex align-items-center mb-4">
              <i className="bi bi-check-circle-fill text-success me-2 fs-4"></i>
              <h2 className="fw-bold mb-0">Acknowledged Policies</h2>
            </div>
            <div className="row g-4">
              {acknowledgedPolicies.map((policy) => (
                <PolicyCard 
                  key={policy.id} 
                  policy={policy} 
                  isAcknowledged={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Policies State */}
        {policies.length === 0 && (
          <div className="text-center py-5">
            <div className="mb-4">
              <i className="bi bi-file-text text-muted" style={{ fontSize: '4rem' }}></i>
            </div>
            <h3 className="fw-bold mb-3">No Policies Available</h3>
            <p className="text-muted mb-4">
              There are currently no policies assigned to your role. 
              Check back later or contact your administrator if you believe this is an error.
            </p>
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate('/accounting')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </button>
          </div>
        )}

        <style>{`
          .text-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .stats-card {
            border-radius: 16px;
            transition: all 0.3s ease;
          }

          .stats-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 35px rgba(0,0,0,0.15) !important;
          }

          .stats-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            font-size: 1.5rem;
          }

          .policy-card {
            border-radius: 16px;
            transition: all 0.3s ease;
            border-left: 4px solid var(--bs-primary);
          }

          .policy-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 35px rgba(0,0,0,0.15) !important;
          }

          /* Badge styles */
          .badge {
            font-weight: 500;
            border-radius: 8px;
            padding: 4px 8px;
          }

          .bg-primary-subtle { background-color: #dbeafe !important; }
          .text-primary { color: #2563eb !important; }
          .bg-success-subtle { background-color: #dcfce7 !important; }
          .text-success { color: #16a34a !important; }
          .bg-warning-subtle { background-color: #fef3c7 !important; }
          .text-warning { color: #d97706 !important; }

          /* Dark theme support */
          [data-bs-theme="dark"] .stats-card,
          [data-bs-theme="dark"] .policy-card {
            background-color: #2d3748;
            border-color: #4a5568;
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .text-gradient {
            background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          [data-bs-theme="dark"] .bg-primary-subtle { background-color: #1e3a8a !important; }
          [data-bs-theme="dark"] .text-primary { color: #60a5fa !important; }
          [data-bs-theme="dark"] .bg-success-subtle { background-color: #14532d !important; }
          [data-bs-theme="dark"] .text-success { color: #4ade80 !important; }
          [data-bs-theme="dark"] .bg-warning-subtle { background-color: #744210 !important; }
          [data-bs-theme="dark"] .text-warning { color: #fbbf24 !important; }

          @media (max-width: 768px) {
            .display-5 {
              font-size: 2.5rem;
            }
            
            .stats-icon {
              width: 50px;
              height: 50px;
              font-size: 1.25rem;
            }
          }
        `}</style>
      </div>
    </>
  );
}