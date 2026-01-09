// E:/SecureMind/web/src/pages/Terms.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const nav = useNavigate();

  return (
    <>
      <style>{`
        :root {
          --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --accent-color: #6366f1;
          --accent-light: #a5b4fc;
        }
        .navbar-custom { 
          backdrop-filter: blur(20px); 
          background: rgba(15, 23, 42, 0.95) !important; 
          border-bottom: 1px solid rgba(255,255,255,0.1); 
        }
        .clickable { 
          cursor: pointer; 
          transition: all 0.2s ease; 
        }
        .clickable:hover { 
          opacity: 0.8; 
        }
        .hero-header {
          background: var(--primary-gradient);
          color: white;
          position: relative;
          overflow: hidden;
        }
        .hero-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        .content-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        .content-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .section-icon {
          background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        .terms-section {
          padding: 2rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border: 1px solid #e2e8f0;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }
        .terms-section:hover {
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .btn-primary-custom {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: white;
          font-weight: 600;
          padding: 0.75rem 2rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        .btn-primary-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
          background: linear-gradient(135deg, #5856eb, #7c3aed);
          color: white;
        }
        .list-custom {
          list-style: none;
          padding-left: 0;
        }
        .list-custom li {
          position: relative;
          padding-left: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        .list-custom li::before {
          content: '•';
          position: absolute;
          left: 0;
          top: 0;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: bold;
        }
        .warning-box {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0;
        }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-dark navbar-custom fixed-top">
        <div className="container">
          <div
            className="navbar-brand fw-bold clickable d-flex align-items-center"
            onClick={() => nav("/")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && nav("/")}
            aria-label="SecureMind Home"
          >
            <img src="/src/img/Logo/SecureMind.png" alt="SecureMind" className="me-3" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 10 }} />
            <span style={{ fontSize: '1.5rem' }}>
              Secure<span style={{ color: '#a5b4fc' }}>Mind</span>
            </span>
          </div>
          <div className="ms-auto">
            <button className="btn btn-outline-light" onClick={() => nav("/")}>Back to Home</button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="hero-header" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="container position-relative">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <div className="section-icon mx-auto">
                📋
              </div>
              <h1 className="display-4 fw-bold mb-4">Policies & Guidelines</h1>
              <p className="lead mb-4 opacity-90">
                Comprehensive policies, acceptable use guidelines, and system usage instructions for the SecureMind cybersecurity awareness platform.
              </p>
              <div className="badge bg-light text-dark px-3 py-2 fs-6">
                Last Updated: {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="content-card p-5">
                {/* Agreement Notice */}
                <div className="warning-box text-center">
                  <h5 className="fw-bold text-dark mb-2">📚 Policy Overview</h5>
                  <p className="text-dark mb-0">
                    These policies ensure secure, efficient, and compliant use of the SecureMind cybersecurity awareness platform.
                  </p>
                </div>

                <div className="row g-4">
                  {/* Acceptable Use Policy */}
                  <div className="col-12">
                    <div className="terms-section">
                      <div className="section-icon">
                        �️
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Acceptable Use Policy (AUP)</h4>
                      <div className="row">
                        <div className="col-lg-6">
                          <h6 className="fw-bold text-dark mb-3">✅ Permitted Uses</h6>
                          <ul className="list-custom">
                            <li>Complete assigned cybersecurity training modules</li>
                            <li>Participate in security awareness games and quizzes</li>
                            <li>Report security incidents through designated channels</li>
                            <li>Access role-appropriate dashboard and resources</li>
                            <li>Update your profile and security settings</li>
                            <li>Collaborate on security awareness initiatives</li>
                          </ul>
                        </div>
                        <div className="col-lg-6">
                          <h6 className="fw-bold text-danger mb-3">❌ Prohibited Activities</h6>
                          <ul className="list-custom">
                            <li>Sharing account credentials with unauthorized users</li>
                            <li>Attempting to bypass security measures or access controls</li>
                            <li>Using the system for non-business related activities</li>
                            <li>Distributing malicious content or phishing attempts</li>
                            <li>Interfering with system operations or other users</li>
                            <li>Downloading or extracting training content without permission</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* How to Use the System */}
                  <div className="col-12">
                    <div className="terms-section">
                      <div className="section-icon">
                        �
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">How to Use SecureMind System</h4>
                      <div className="row">
                        <div className="col-lg-4">
                          <h6 className="fw-bold text-primary mb-3">🚀 Getting Started</h6>
                          <ul className="list-custom">
                            <li>Register with your organization email</li>
                            <li>Complete email verification</li>
                            <li>Set up multi-factor authentication (MFA)</li>
                            <li>Complete your user profile</li>
                            <li>Review your assigned role and permissions</li>
                          </ul>
                        </div>
                        <div className="col-lg-4">
                          <h6 className="fw-bold text-success mb-3">📚 Training & Learning</h6>
                          <ul className="list-custom">
                            <li>Access your role-specific dashboard</li>
                            <li>Complete mandatory training modules</li>
                            <li>Take interactive security quizzes</li>
                            <li>Play cybersecurity awareness games</li>
                            <li>Track your learning progress</li>
                          </ul>
                        </div>
                        <div className="col-lg-4">
                          <h6 className="fw-bold text-warning mb-3">🔧 System Features</h6>
                          <ul className="list-custom">
                            <li>Report security incidents</li>
                            <li>View organizational policies</li>
                            <li>Access security notifications</li>
                            <li>Update security preferences</li>
                            <li>Participate in security assessments</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Access Policy */}
                  <div className="col-lg-6">
                    <div className="terms-section h-100">
                      <div className="section-icon">
                        🔐
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">System Access Policy</h4>
                      <ul className="list-custom">
                        <li>Access is granted based on job role and responsibilities</li>
                        <li>All users must complete security awareness training</li>
                        <li>Regular access reviews and updates are conducted</li>
                        <li>Inactive accounts are automatically disabled</li>
                        <li>Privileged access requires additional authentication</li>
                        <li>Access logs are monitored and audited regularly</li>
                      </ul>
                    </div>
                  </div>

                  {/* Data Privacy Policy */}
                  <div className="col-lg-6">
                    <div className="terms-section h-100">
                      <div className="section-icon">
                        🔒
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Data Privacy Policy</h4>
                      <ul className="list-custom">
                        <li>Personal data is collected for legitimate business purposes</li>
                        <li>Data is encrypted in transit and at rest</li>
                        <li>Access to personal data is strictly controlled</li>
                        <li>Data retention follows organizational policies</li>
                        <li>Users can request data access and deletion</li>
                        <li>Data breaches are reported within required timeframes</li>
                      </ul>
                    </div>
                  </div>

                  {/* Training Completion Policy */}
                  <div className="col-lg-6">
                    <div className="terms-section h-100">
                      <div className="section-icon">
                        🎓
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Training Completion Policy</h4>
                      <ul className="list-custom">
                        <li>All users must complete mandatory security training</li>
                        <li>Training must be completed within specified timeframes</li>
                        <li>Regular refresher training is required annually</li>
                        <li>Completion certificates are automatically generated</li>
                        <li>Non-compliance may result in access restrictions</li>
                        <li>Specialized training based on role requirements</li>
                      </ul>
                    </div>
                  </div>

                  {/* Incident Reporting Policy */}
                  <div className="col-lg-6">
                    <div className="terms-section h-100">
                      <div className="section-icon">
                        🚨
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Incident Reporting Policy</h4>
                      <ul className="list-custom">
                        <li>All security incidents must be reported immediately</li>
                        <li>Use the built-in incident reporting system</li>
                        <li>Provide detailed information about the incident</li>
                        <li>Follow up on reported incidents as required</li>
                        <li>Confidentiality of incident details is maintained</li>
                        <li>No retaliation for good-faith incident reporting</li>
                      </ul>
                    </div>
                  </div>

                  {/* System Monitoring Policy */}
                  <div className="col-lg-6">
                    <div className="terms-section h-100">
                      <div className="section-icon">
                        �
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">System Monitoring Policy</h4>
                      <ul className="list-custom">
                        <li>System activities are logged and monitored</li>
                        <li>Monitoring is conducted for security and compliance</li>
                        <li>Unusual activities are automatically flagged</li>
                        <li>Users are notified of monitoring activities</li>
                        <li>Monitoring data is securely stored and protected</li>
                        <li>Regular security audits and assessments</li>
                      </ul>
                    </div>
                  </div>

                  {/* Compliance Requirements */}
                  <div className="col-lg-6">
                    <div className="terms-section h-100">
                      <div className="section-icon">
                        ⚖️
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Compliance Requirements</h4>
                      <ul className="list-custom">
                        <li>Comply with applicable cybersecurity frameworks</li>
                        <li>Adhere to industry-specific regulations</li>
                        <li>Follow organizational security policies</li>
                        <li>Participate in compliance assessments</li>
                        <li>Report compliance violations promptly</li>
                        <li>Maintain records of compliance activities</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="terms-section mt-4">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <div className="d-flex align-items-start">
                        <div className="section-icon me-4">
                          📞
                        </div>
                        <div>
                          <h4 className="fw-bold mb-3 text-dark">Need Help or Have Questions?</h4>
                          <p className="text-muted mb-0">
                            For policy clarifications, system support, or security concerns, 
                            contact our support team at <strong>securemindotp@gmail.com</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                      <button 
                        className="btn btn-primary-custom"
                        onClick={() => nav('/support')}
                      >
                        Get Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-dark text-light py-4">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="d-flex align-items-center">
                <img src="/src/img/Logo/SecureMind.png" alt="SecureMind" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} className="me-2" />
                <span className="h6 mb-0">
                  Secure<span style={{ color: '#a5b4fc' }}>Mind</span>
                </span>
                <span className="text-white small ms-3">
                  © {new Date().getFullYear()} All rights reserved.
                </span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-md-end align-items-center gap-4 flex-wrap">
                <div className="d-flex gap-4">
                  <span role="button" className="text-white clickable small" onClick={() => nav('/privacy')}>Privacy</span>
                  <span role="button" className="text-white clickable small" onClick={() => nav('/terms')}>Terms</span>
                  <span role="button" className="text-white clickable small" onClick={() => nav('/support')}>Support</span>
                  <span role="button" className="text-white clickable small" onClick={() => nav('/contact')}>Contact</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}