// web/src/pages/dashboards/Accounting.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useRoleDashboardData from "../path/useRoleDashboardData";
import useIdleLogout from "../../hooks/useIdleLogout";
import useSystemSettings from "../../hooks/useSystemSettings";
import UserTopbar from "../../components/UserTopbar";

const Page = ({ title, children, icon }) => (
  <section className="glass-card shadow-lg border-0 mb-4">
    <div className="card-header glass-header d-flex justify-content-between align-items-center py-3">
      <h5 className="mb-0 fw-bold text-gradient d-flex align-items-center">
        <i className={`bi ${icon} me-2`}></i>
        {title}
      </h5>
    </div>
    <div className="card-body p-4">{children}</div>
  </section>
);

const NotificationCard = ({ fact, onMarkRead }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    try {
      const ts = timestamp?.toDate ? timestamp.toDate() : (timestamp?.seconds ? new Date(timestamp.seconds * 1000) : null);
      if (!ts) return "—";
      return ts.toLocaleDateString() + " " + ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "—";
    }
  };

  // Prefer the admin-created `message` field, fall back to other common fields
  const message = fact.message || fact.summary || fact.content || fact.text || fact.body || '';
  const when = fact.publishedAt || fact.createdAt || fact.updatedAt || null;

  return (
    <div className="card border-0 shadow-sm mb-3 notification-card" data-fact-id={fact.id}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center gap-2">
            <div className="notification-icon">
              <i className="bi bi-lightbulb-fill text-warning"></i>
            </div>
            <h6 className="fw-semibold mb-0">{fact.title || "Security Tip"}</h6>
          </div>
          <div className="text-muted small">{formatDate(when)}</div>
        </div>
        <p className="mb-2">{message}</p>
        <div className="d-flex justify-content-end">
          <button className="btn btn-sm btn-outline-primary" onClick={() => onMarkRead && onMarkRead()}>
            Mark Read
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizCard = ({ assignment, quiz, onStartQuiz }) => (
  <div className="card border-0 shadow-sm mb-3 quiz-card">
    <div className="card-body d-flex justify-content-between align-items-start">
      <div>
        <h6 className="mb-1">{quiz.title}</h6>
        <div className="text-muted small">{quiz.description || ''}</div>
      </div>
      <div>
        <button className="btn btn-sm btn-primary" onClick={() => onStartQuiz(assignment, quiz)}>Start</button>
      </div>
    </div>
  </div>
);

const PolicyCard = ({ policy, onAcknowledge }) => (
  <div className="card border-0 shadow-sm mb-3 policy-card">
    <div className="card-body">
      <h6 className="mb-1">{policy.title}</h6>
      <div className="text-muted small mb-2">{policy.summary || policy.content?.substring(0, 150) || ''}</div>
      <div className="d-flex justify-content-between align-items-center">
        <Link to={`/policies/${policy.id}`} className="btn btn-sm btn-outline-primary">
          <i className="bi bi-eye me-1"></i>
          Read Policy
        </Link>
        {onAcknowledge ? (
          <span className="badge bg-warning-subtle text-warning">
            <i className="bi bi-exclamation-triangle me-1"></i>
            Read Required
          </span>
        ) : (
          <span className="badge bg-success-subtle text-success">
            <i className="bi bi-check-circle me-1"></i>
            Acknowledged
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function AccountingDashboard() {
  const navigate = useNavigate();
  const {
    user,
    userProfile,
    loading,
    facts = [],
    factReads = [],
    policies = [],
    policyAcks = [],
    quizAssignments = [],
    quizzes = [],
    fetchQuizIfNeeded,
    markFactRead,
    acknowledgePolicy,
    getUserDisplayName
  } = useRoleDashboardData('accounting');

  const { settings } = useSystemSettings();
  const sessionTimeout = Math.max(5, Number(settings?.security?.sessionTimeoutMins || 30));
  useIdleLogout(sessionTimeout);

  const handleStartQuiz = (assignment, quiz) => {
    if (!quiz) {
      alert('Quiz data not available.');
      return;
    }
    navigate('/accounting/quiz', { state: { assignment, quiz } });
  };

  const getName = () => {
    if (typeof getUserDisplayName === 'function') return getUserDisplayName();
    return user?.email?.split('@')[0] || 'User';
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

  if (!user) return null;

  return (
    <>
      <UserTopbar />
      <div className="container my-4" style={{maxWidth:1200}}>
        <div className="text-center mb-4">
          <h3 className="fw-bold text-gradient mb-2">Welcome, {getName()}</h3>
          <h1 className="display-4 fw-bold text-gradient mb-3">Accounting Team Dashboard</h1>
          <p className="lead text-body-secondary mb-4">Your role-specific security training and tools</p>
        </div>

        <div className="alert alert-info border-0 shadow-sm mb-4 d-flex align-items-center" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          <div>
            <small className="fw-semibold">Session Info:</small>
            <small className="text-muted ms-2">Auto-logout after {sessionTimeout} minutes of inactivity</small>
          </div>
        </div>

        <Page title="Quick Actions" icon="bi-grid-fill">
          <div className="row g-3">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border-0 glass-card hover-lift">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <div className="icon-wrapper me-2">
                      <i className="bi bi-file-text"></i>
                    </div>
                    <div className="fw-bold">Invoice Fraud Detective</div>
                  </div>
                  <div className="text-body-secondary small mb-3">Spot doctored invoices and financial fraud attempts.</div>
                  <Link to="/accounting/invoice-fraud" className="btn btn-outline-primary btn-sm">
                    Open Tool
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border-0 glass-card hover-lift">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <div className="icon-wrapper me-2">
                      <i className="bi bi-controller"></i>
                    </div>
                    <div className="fw-bold">Security Awareness Games</div>
                  </div>
                  <div className="text-body-secondary small mb-3">Interactive mini-games to test your security knowledge.</div>
                  <Link to="/accounting/games" className="btn btn-outline-primary btn-sm">
                    Play Games
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border-0 glass-card hover-lift">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <div className="icon-wrapper me-2">
                      <i className="bi bi-graph-up"></i>
                    </div>
                    <div className="fw-bold">Training Progress</div>
                  </div>
                  <div className="text-body-secondary small mb-3">View your completed training modules and scores.</div>
                  <Link to="/accounting/progress" className="btn btn-outline-primary btn-sm">
                    View Progress
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border-0 glass-card hover-lift">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <div className="icon-wrapper me-2" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}>
                      <i className="bi bi-exclamation-triangle"></i>
                    </div>
                    <div className="fw-bold">Report Incident</div>
                  </div>
                  <div className="text-body-secondary small mb-3">Report security incidents, vulnerabilities, or concerns.</div>
                  <Link to="/report-incident" className="btn btn-outline-danger btn-sm">
                    Report Incident
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Page>

        <div className="row g-4">
          <div className="col-lg-6">
            <Page title="Security Updates" icon="bi-bell-fill">
              {facts.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-lightbulb text-muted" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mt-2 mb-0">No recent security updates</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {facts.map((fact) => {
                    const isRead = factReads.some(r => r.factId === fact.id);
                    return (
                      <div key={fact.id} className={isRead ? 'opacity-75' : ''}>
                        <NotificationCard fact={fact} onMarkRead={isRead ? null : () => markFactRead(fact.id)} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Page>
          </div>

          <div className="col-lg-6">
            <Page title="Assigned Quizzes" icon="bi-patch-question-fill">
              {quizAssignments.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-check-circle text-success" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mt-2 mb-0">No pending quizzes</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {quizAssignments.map((assignment) => {
                    let quiz = quizzes.find(q => q.id === assignment.quizId);
                    if (!quiz && !assignment.quizTitle) {
                      fetchQuizIfNeeded(assignment.quizId).then(fq => {
                        // no-op if already present
                      });
                    }

                    if (!quiz) {
                      quiz = {
                        id: assignment.quizId,
                        title: assignment.quizTitle || 'Quiz Assignment',
                        description: assignment.quizDescription || 'Complete this training quiz',
                        questions: assignment.questions || [],
                        roles: assignment.roles || ['accounting'],
                        topic: assignment.topic || assignment.quizTopic || null,
                        isFallback: true
                      };
                    }

                    return (
                      <QuizCard key={assignment.id} assignment={assignment} quiz={quiz} onStartQuiz={handleStartQuiz} />
                    );
                  })}
                </div>
              )}
            </Page>
          </div>
        </div>

        <Page title="Company Policies" icon="bi-shield-check-fill">
          <div className="alert alert-info border-0 mb-4">
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle me-3"></i>
              <div>
                <strong>Important:</strong> You must read each policy completely before acknowledging. 
                For longer policies, the system tracks your reading progress and will only enable the acknowledgment button after you've scrolled through the entire content.
              </div>
            </div>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">Policies found: {policies.length} | Acknowledged: {policyAcks.length}</small>
              <Link to="/policies" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-eye me-1"></i>
                View All
              </Link>
            </div>
          </div>

          {policies.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-file-text text-muted" style={{ fontSize: '2rem' }}></i>
              <p className="text-muted mt-2 mb-0">No recent policies for your role</p>
            </div>
          ) : (
            <>
              {/* Unread Policies */}
              {policies.filter(p => !policyAcks.some(a => a.policyId === p.id)).length > 0 && (
                <>
                  <h6 className="mb-2 text-warning">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Policies Requiring Acknowledgment
                  </h6>
                  <div className="row g-3 mb-4">
                    {policies.filter(p => !policyAcks.some(a => a.policyId === p.id)).map((policy) => (
                      <div key={policy.id} className="col-md-6 col-lg-4">
                        <PolicyCard policy={policy} onAcknowledge={acknowledgePolicy} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Acknowledged Policies */}
              {policies.filter(p => policyAcks.some(a => a.policyId === p.id)).length > 0 && (
                <>
                  <h6 className="mb-2 text-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Acknowledged Policies
                  </h6>
                  <div className="row g-3">
                    {policies.filter(p => policyAcks.some(a => a.policyId === p.id)).map((policy) => (
                      <div key={policy.id} className="col-md-6 col-lg-4">
                        <PolicyCard policy={policy} onAcknowledge={null} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </Page>

        <style>{`
          .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
          .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important; }
          .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; }
          .glass-header { background: rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
          .text-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          .icon-wrapper { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .notification-card, .quiz-card, .policy-card { border-radius: 12px; transition: all 0.2s ease; }
          .notification-card { border-left: 4px solid #fbbf24; }
          .quiz-card { border-left: 4px solid #3b82f6; }
          .policy-card { border-left: 4px solid #10b981; }
          .notification-card:hover, .quiz-card:hover, .policy-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
          .notification-icon { width: 32px; height: 32px; border-radius: 8px; background: #fef3c7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .alert-info { background: rgba(13, 110, 253, 0.1); border: 1px solid rgba(13, 110, 253, 0.2); color: #0a58ca; }
          .badge { font-weight: 500; border-radius: 8px; padding: 4px 8px; }
          .bg-success-subtle { background-color: #dcfce7 !important; } .text-success { color: #16a34a !important; }
          .bg-warning-subtle { background-color: #fef3c7 !important; } .text-warning { color: #d97706 !important; }
          .bg-danger-subtle { background-color: #fee2e2 !important; } .text-danger { color: #dc2626 !important; }
          .bg-info-subtle { background-color: #dbeafe !important; } .text-info { color: #0891b2 !important; }
          [data-bs-theme="dark"] .glass-card { background: rgba(33, 37, 41, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); }
          [data-bs-theme="dark"] .notification-icon { background-color: #744210; }
          [data-bs-theme="dark"] .text-gradient { background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          [data-bs-theme="dark"] .alert-info { background-color: #1e3a8a; border-color: #1e40af; color: #dbeafe; }
          @media (max-width: 768px) { .display-4 { font-size: 2rem; } }
        `}</style>
      </div>
    </>
  );
}