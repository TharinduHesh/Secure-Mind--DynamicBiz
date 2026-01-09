// web/src/pages/accounting/Progress.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs 
} from "firebase/firestore";
import { auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import UserTopbar from "../../components/UserTopbar";

const ProgressCard = ({ title, value, total, percentage, icon, color = "primary" }) => (
  <div className="card border-0 shadow-sm h-100 progress-card">
    <div className="card-body p-4">
      <div className="d-flex align-items-center mb-3">
        <div className={`progress-icon bg-${color}-subtle me-3`}>
          <i className={`bi ${icon} text-${color}`}></i>
        </div>
        <h6 className="fw-semibold mb-0">{title}</h6>
      </div>
      
      <div className="d-flex align-items-end justify-content-between mb-2">
        <span className="display-6 fw-bold">{value}</span>
        {total && <span className="text-muted">/ {total}</span>}
      </div>
      
      <div className="progress mb-2" style={{ height: '8px' }}>
        <div 
          className={`progress-bar bg-${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      
      <div className="d-flex justify-content-between">
        <span className="small text-muted">{percentage}% Complete</span>
      </div>
    </div>
  </div>
);

const ActivityItem = ({ activity, icon, color }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="activity-item">
      <div className="activity-icon">
        <i className={`bi ${icon} text-${color}`}></i>
      </div>
      <div className="activity-content flex-grow-1">
        <div className="activity-title">{activity.title}</div>
        <div className="activity-meta">
          {activity.score !== undefined && (
            <span className={`badge bg-${activity.score >= 80 ? 'success' : activity.score >= 60 ? 'warning' : 'danger'}-subtle text-${activity.score >= 80 ? 'success' : activity.score >= 60 ? 'warning' : 'danger'}`}>
              {activity.score}%
            </span>
          )}
          <span className="text-muted ms-2">{formatDate(activity.date)}</span>
        </div>
      </div>
    </div>
  );
};

const CertificateCard = ({ certificate }) => (
  <div className="card border-0 shadow-sm certificate-card">
    <div className="card-body p-4 text-center">
      <div className="certificate-icon mb-3">
        <i className="bi bi-award-fill text-warning"></i>
      </div>
      <h6 className="fw-bold mb-2">{certificate.name}</h6>
      <p className="text-muted small mb-3">{certificate.description}</p>
      <div className="d-flex justify-content-between align-items-center">
        <span className="small text-success">
          <i className="bi bi-check-circle me-1"></i>
          Earned
        </span>
        <span className="small text-muted">
          {new Date(certificate.earnedDate).toLocaleDateString()}
        </span>
      </div>
    </div>
  </div>
);

export default function AccountingProgress() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const db = useMemo(() => getFirestore(), []);
  
  const [quizResults, setQuizResults] = useState([]);
  const [gameResults, setGameResults] = useState([]);
  const [policyAcks, setPolicyAcks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch user's progress data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribes = [];
    let loadedCount = 0;
    const totalToLoad = 3;

    const handleDataLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) {
        setLoading(false);
      }
    };

    // Fetch quiz results
    const quizQuery = query(
      collection(db, "quiz_results"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const subscribeQuizResults = (q) => {
      return onSnapshot(q, (snapshot) => {
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuizResults(results);
        handleDataLoaded();
      }, async (err) => {
        console.error('Error fetching quiz results (primary query):', err);
        // Try fallback query without orderBy in case createdAt is missing or index not present
        try {
          const fallbackQ = query(collection(db, "quiz_results"), where("userId", "==", user.uid));
          const snap = await getDocs(fallbackQ);
          const fallbackResults = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setQuizResults(fallbackResults);
          console.warn('Fetched quiz results using fallback query without ordering.');
        } catch (fallbackErr) {
          console.error('Fallback query failed for quiz results:', fallbackErr);
          setError('Error loading quiz results');
        }
        handleDataLoaded();
      });
    };

    try {
      unsubscribes.push(subscribeQuizResults(quizQuery));
    } catch (err) {
      console.error('Exception setting up quiz results listener:', err);
      setError('Error loading quiz results');
      handleDataLoaded();
    }

    // Fetch game results (optional - may not exist)
    const gameQuery = query(
      collection(db, "game_results"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const subscribeGameResults = (q) => {
      return onSnapshot(q, (snapshot) => {
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGameResults(results);
        handleDataLoaded();
      }, async (err) => {
        console.error('Error fetching game results (primary query):', err);
        // Try fallback query without orderBy
        try {
          const snap = await getDocs(query(collection(db, "game_results"), where("userId", "==", user.uid)));
          const fallbackResults = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setGameResults(fallbackResults);
          console.warn('Fetched game results using fallback query without ordering.');
        } catch (fallbackErr) {
          console.error('Fallback query failed for game results:', fallbackErr);
          setGameResults([]);
        }
        handleDataLoaded();
      });
    };

    try {
      unsubscribes.push(subscribeGameResults(gameQuery));
    } catch (err) {
      console.error('Exception setting up game results listener:', err);
      setGameResults([]);
      handleDataLoaded();
    }

    // Fetch policy acknowledgments (collection name: policy_acks)
    try {
      const policyQuery = query(
        collection(db, "policy_acks"),
        where("userId", "==", user.uid),
        orderBy("acknowledgedAt", "desc")
      );

      unsubscribes.push(onSnapshot(policyQuery, (snapshot) => {
        const acks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPolicyAcks(acks);
        handleDataLoaded();
      }, (error) => {
        console.error('Error fetching policy acknowledgements:', error);
        setError('Error loading policy acknowledgements');
        handleDataLoaded();
      }));
    } catch (err) {
      console.error('Exception setting up policy acknowledgements listener:', err);
      setError('Error loading policy acknowledgements');
      handleDataLoaded();
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user, db]);

  // Calculate overall progress statistics
  const progressStats = useMemo(() => {
    const totalQuizzes = quizResults.length;
    const passedQuizzes = quizResults.filter(r => (r.percentage || 0) >= 70).length;
    const avgQuizScore = totalQuizzes > 0 ? 
      Math.round(quizResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalQuizzes) : 0;

    const totalGames = gameResults.length;
    const avgGameScore = totalGames > 0 ?
      Math.round(gameResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalGames) : 0;

    const totalPolicies = policyAcks.length;

    // Mock total available content for percentage calculations
    const availableQuizzes = Math.max(8, totalQuizzes); // At least show completed count
    const availableGames = Math.max(3, totalGames);
    const availablePolicies = Math.max(5, totalPolicies);

    return {
      quizzes: {
        completed: totalQuizzes,
        passed: passedQuizzes,
        total: availableQuizzes,
        avgScore: avgQuizScore,
        percentage: totalQuizzes > 0 ? Math.round((totalQuizzes / availableQuizzes) * 100) : 0
      },
      games: {
        completed: totalGames,
        total: availableGames,
        avgScore: avgGameScore,
        percentage: totalGames > 0 ? Math.round((totalGames / availableGames) * 100) : 0
      },
      policies: {
        acknowledged: totalPolicies,
        total: availablePolicies,
        percentage: totalPolicies > 0 ? Math.round((totalPolicies / availablePolicies) * 100) : 0
      }
    };
  }, [quizResults, gameResults, policyAcks]);

  // Combine all activities for timeline
  const recentActivities = useMemo(() => {
    const activities = [];

    // Add quiz results
    quizResults.forEach(result => {
      activities.push({
        type: 'quiz',
        title: result.quizTitle || 'Training Quiz',
        score: result.percentage,
        date: result.completedAt || result.createdAt,
        icon: 'bi-patch-question-fill',
        color: result.percentage >= 80 ? 'success' : result.percentage >= 60 ? 'warning' : 'danger'
      });
    });

    // Add game results
    gameResults.forEach(result => {
      const gameNames = {
        phishing: 'Phishing Detective',
        password: 'Password Fortress',
        privacy: 'Privacy Guardian'
      };
      
      activities.push({
        type: 'game',
        title: gameNames[result.gameType] || 'Security Game',
        score: result.percentage,
        date: result.completedAt || result.createdAt,
        icon: 'bi-controller',
        color: result.percentage >= 80 ? 'success' : result.percentage >= 60 ? 'warning' : 'danger'
      });
    });

    // Add policy acknowledgments
    policyAcks.forEach(ack => {
      activities.push({
        type: 'policy',
        title: `Policy: ${ack.policyTitle || 'Security Policy'}`,
        date: ack.acknowledgedAt || ack.createdAt,
        icon: 'bi-shield-check',
        color: 'info'
      });
    });

    // Sort by date (most recent first)
    return activities.sort((a, b) => {
      const dateA = a.date?.toDate?.() || new Date(a.date?.seconds * 1000) || new Date(0);
      const dateB = b.date?.toDate?.() || new Date(b.date?.seconds * 1000) || new Date(0);
      return dateB - dateA;
    }).slice(0, 10); // Show last 10 activities
  }, [quizResults, gameResults, policyAcks]);

  // Mock certificates based on achievements
  const certificates = useMemo(() => {
    const certs = [];
    
    if (progressStats.quizzes.passed >= 3) {
      certs.push({
        name: 'Quiz Master',
        description: 'Completed 3+ training quizzes with passing scores',
        earnedDate: quizResults[2]?.completedAt?.toDate?.() || new Date()
      });
    }

    if (progressStats.games.completed >= 2) {
      certs.push({
        name: 'Security Gamer',
        description: 'Completed multiple security awareness games',
        earnedDate: gameResults[1]?.completedAt?.toDate?.() || new Date()
      });
    }

    if (progressStats.policies.acknowledged >= 3) {
      certs.push({
        name: 'Policy Expert',
        description: 'Acknowledged 3+ company security policies',
        earnedDate: policyAcks[2]?.acknowledgedAt?.toDate?.() || new Date()
      });
    }

    return certs;
  }, [progressStats, quizResults, gameResults, policyAcks]);

  if (!user) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4" style={{ maxWidth: 1200 }}>
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Please sign in to view your progress.
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4 d-flex justify-content-center" style={{ minHeight: '50vh', alignItems: 'center' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading progress...</span>
            </div>
            <p className="text-muted">Loading your training progress...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4" style={{ maxWidth: 1200 }}>
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Try Again
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <UserTopbar />
      <div className="container my-4" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">Your Training Progress</h1>
            <p className="text-muted mb-0">Track your security awareness journey</p>
          </div>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/accounting')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </button>
        </div>

        {/* Progress Overview */}
        <div className="row g-4 mb-5">
          <div className="col-md-6 col-lg-3">
            <ProgressCard
              title="Training Quizzes"
              value={progressStats.quizzes.completed}
              total={progressStats.quizzes.total}
              percentage={progressStats.quizzes.percentage}
              icon="bi-patch-question-fill"
              color="primary"
            />
          </div>
          <div className="col-md-6 col-lg-3">
            <ProgressCard
              title="Security Games"
              value={progressStats.games.completed}
              total={progressStats.games.total}
              percentage={progressStats.games.percentage}
              icon="bi-controller"
              color="success"
            />
          </div>
          <div className="col-md-6 col-lg-3">
            <ProgressCard
              title="Policies Read"
              value={progressStats.policies.acknowledged}
              total={progressStats.policies.total}
              percentage={progressStats.policies.percentage}
              icon="bi-shield-check"
              color="info"
            />
          </div>
          <div className="col-md-6 col-lg-3">
            <ProgressCard
              title="Average Score"
              value={`${Math.round((progressStats.quizzes.avgScore + progressStats.games.avgScore) / 2) || 0}%`}
              percentage={Math.round((progressStats.quizzes.avgScore + progressStats.games.avgScore) / 2) || 0}
              icon="bi-trophy"
              color="warning"
            />
          </div>
        </div>

        <div className="row g-4">
          {/* Recent Activity */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header border-0 py-3 bg-transparent">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-clock-history me-2"></i>
                  Recent Activity
                </h5>
              </div>
              <div className="card-body">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-activity text-muted" style={{ fontSize: '2rem' }}></i>
                    <p className="text-muted mt-2 mb-0">No activity yet</p>
                    <p className="small text-muted">Complete quizzes and games to see your progress here</p>
                  </div>
                ) : (
                  <div className="activity-timeline">
                    {recentActivities.map((activity, index) => (
                      <ActivityItem 
                        key={`${activity.type}-${index}`}
                        activity={activity}
                        icon={activity.icon}
                        color={activity.color}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Certificates */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header border-0 py-3 bg-transparent">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-award me-2"></i>
                  Certificates
                </h5>
              </div>
              <div className="card-body">
                {certificates.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-award text-muted" style={{ fontSize: '2rem' }}></i>
                    <p className="text-muted mt-2 mb-0">No certificates yet</p>
                    <p className="small text-muted">Complete more training to earn certificates</p>
                  </div>
                ) : (
                  <div className="certificates-grid">
                    {certificates.map((cert, index) => (
                      <CertificateCard key={index} certificate={cert} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-header border-0 py-3 bg-transparent">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-lightning me-2"></i>
                  Quick Actions
                </h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => navigate('/accounting/games')}
                  >
                    <i className="bi bi-controller me-2"></i>
                    Play Security Games
                  </button>
                  <button 
                    className="btn btn-outline-info btn-sm"
                    onClick={() => navigate('/policies')}
                  >
                    <i className="bi bi-shield-check me-2"></i>
                    Review Policies
                  </button>
                  <button 
                    className="btn btn-outline-success btn-sm"
                    onClick={() => navigate('/accounting/quiz')}
                  >
                    <i className="bi bi-patch-question me-2"></i>
                    Take Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .progress-card {
            border-radius: 16px;
            transition: all 0.3s ease;
          }

          .progress-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
          }

          .progress-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
          }

          .activity-timeline {
            max-height: 500px;
            overflow-y: auto;
          }

          .activity-item {
            display: flex;
            align-items: flex-start;
            padding: 1rem 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
          }

          .activity-item:last-child {
            border-bottom: none;
          }

          .activity-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: rgba(var(--bs-light-rgb), 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            flex-shrink: 0;
          }

          .activity-title {
            font-weight: 600;
            color: var(--bs-dark);
            margin-bottom: 0.25rem;
          }

          .activity-meta {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
          }

          .certificate-card {
            border-radius: 12px;
            margin-bottom: 1rem;
            border-left: 4px solid #fbbf24;
          }

          .certificate-icon {
            font-size: 2.5rem;
            color: #fbbf24;
          }

          .certificates-grid {
            max-height: 400px;
            overflow-y: auto;
          }

          /* Badge styles */
          .badge {
            font-weight: 500;
            border-radius: 6px;
            padding: 4px 8px;
          }

          .bg-success-subtle { background-color: #dcfce7 !important; }
          .text-success { color: #16a34a !important; }
          .bg-warning-subtle { background-color: #fef3c7 !important; }
          .text-warning { color: #d97706 !important; }
          .bg-danger-subtle { background-color: #fee2e2 !important; }
          .text-danger { color: #dc2626 !important; }
          .bg-info-subtle { background-color: #dbeafe !important; }
          .text-info { color: #0891b2 !important; }
          .bg-primary-subtle { background-color: #dbeafe !important; }
          .text-primary { color: #2563eb !important; }

          /* Dark theme support */
          [data-bs-theme="dark"] .progress-card,
          [data-bs-theme="dark"] .certificate-card,
          [data-bs-theme="dark"] .card {
            background-color: #2d3748;
            border-color: #4a5568;
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .activity-icon {
            background: rgba(255, 255, 255, 0.1);
          }

          [data-bs-theme="dark"] .activity-title {
            color: var(--bs-light);
          }

          [data-bs-theme="dark"] .activity-item {
            border-bottom-color: rgba(255, 255, 255, 0.1);
          }

          [data-bs-theme="dark"] .bg-success-subtle { background-color: #14532d !important; }
          [data-bs-theme="dark"] .text-success { color: #4ade80 !important; }
          [data-bs-theme="dark"] .bg-warning-subtle { background-color: #744210 !important; }
          [data-bs-theme="dark"] .text-warning { color: #fbbf24 !important; }
          [data-bs-theme="dark"] .bg-danger-subtle { background-color: #7f1d1d !important; }
          [data-bs-theme="dark"] .text-danger { color: #f87171 !important; }
          [data-bs-theme="dark"] .bg-info-subtle { background-color: #164e63 !important; }
          [data-bs-theme="dark"] .text-info { color: #38bdf8 !important; }
          [data-bs-theme="dark"] .bg-primary-subtle { background-color: #1e3a8a !important; }
          [data-bs-theme="dark"] .text-primary { color: #60a5fa !important; }

          @media (max-width: 768px) {
            .activity-timeline {
              max-height: 300px;
            }
            
            .certificates-grid {
              max-height: 250px;
            }
          }
        `}</style>
      </div>
    </>
  );
}