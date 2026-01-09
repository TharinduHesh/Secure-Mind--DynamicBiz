// E:/SecureMind/web/src/pages/Support.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Support() {
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
        .support-section {
          padding: 2rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border: 1px solid #e2e8f0;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }
        .support-section:hover {
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
        .btn-success-custom {
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          color: white;
          font-weight: 600;
          padding: 0.75rem 2rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        .btn-success-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
          background: linear-gradient(135deg, #059669, #047857);
          color: white;
        }
        .contact-card {
          background: linear-gradient(135deg, #e0f2fe, #b3e5fc);
          border: 2px solid #0288d1;
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }
        .contact-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          border: 1px solid #16a34a;
          border-radius: 50px;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #15803d;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: #16a34a;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
                🎧
              </div>
              <h1 className="display-4 fw-bold mb-4">Support Center</h1>
              <p className="lead mb-4 opacity-90">
                We're here to help you succeed with SecureMind. Find resources, get answers, and connect with our team.
              </p>
              <div className="status-indicator">
                <div className="status-dot"></div>
                All systems operational
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
                <div className="row g-4">
                  {/* Knowledge Base */}
                  <div className="col-lg-4">
                    <div className="support-section h-100 text-center">
                      <div className="section-icon mx-auto">
                        📚
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Knowledge Base</h4>
                      <p className="text-muted mb-4">
                        Comprehensive guides and tutorials covering training modules, policy management, 
                        dashboard navigation, and platform features.
                      </p>
                      <ul className="list-unstyled text-start mb-4">
                        <li className="mb-2">
                          <span className="text-success me-2">✓</span>
                          Getting started guides
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">✓</span>
                          Role-based tutorials
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">✓</span>
                          Troubleshooting guides
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">✓</span>
                          Best practices
                        </li>
                      </ul>
                      <button className="btn btn-primary-custom">
                        Browse Guides
                      </button>
                    </div>
                  </div>

                  {/* Report Issues */}
                  <div className="col-lg-4">
                    <div className="support-section h-100 text-center">
                      <div className="section-icon mx-auto">
                        🐛
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Report an Issue</h4>
                      <p className="text-muted mb-4">
                        Encountered a problem or bug? Our technical team is ready to help resolve any issues 
                        you're experiencing with the platform.
                      </p>
                      <div className="text-start mb-4">
                        <p className="small text-muted mb-2">
                          <strong>Include in your report:</strong>
                        </p>
                        <ul className="list-unstyled small">
                          <li className="mb-1">• Detailed description of the issue</li>
                          <li className="mb-1">• Steps to reproduce the problem</li>
                          <li className="mb-1">• Screenshots or error messages</li>
                          <li className="mb-1">• Browser and device information</li>
                        </ul>
                      </div>
                      <button 
                        className="btn btn-primary-custom"
                        onClick={() => nav('/contact')}
                      >
                        Report Issue
                      </button>
                    </div>
                  </div>

                  {/* Service Status */}
                  <div className="col-lg-4">
                    <div className="support-section h-100 text-center">
                      <div className="section-icon mx-auto">
                        📊
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Service Status</h4>
                      <p className="text-muted mb-4">
                        Check real-time system availability, scheduled maintenance windows, 
                        and incident history to stay informed about platform status.
                      </p>
                      <div className="row g-3 mb-4">
                        <div className="col-6">
                          <div className="border rounded-3 p-2">
                            <div className="small text-muted">API Status</div>
                            <div className="text-success fw-bold small">✓ Online</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="border rounded-3 p-2">
                            <div className="small text-muted">Database</div>
                            <div className="text-success fw-bold small">✓ Online</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="border rounded-3 p-2">
                            <div className="small text-muted">Training</div>
                            <div className="text-success fw-bold small">✓ Online</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="border rounded-3 p-2">
                            <div className="small text-muted">Analytics</div>
                            <div className="text-success fw-bold small">✓ Online</div>
                          </div>
                        </div>
                      </div>
                      <button className="btn btn-success-custom">
                        View Status Page
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contact Support Section */}
                <div className="mt-5">
                  <div className="contact-card">
                    <div className="row align-items-center">
                      <div className="col-md-8 text-md-start">
                        <h4 className="fw-bold text-dark mb-3">
                          <span className="me-2">💬</span>
                          Need Direct Support?
                        </h4>
                        <p className="text-dark mb-3 mb-md-0">
                          Can't find what you're looking for? Our support team is available to help with any questions, 
                          technical issues, or account-related inquiries. Contact us at <strong>securemindotp@gmail.com</strong>
                        </p>
                      </div>
                      <div className="col-md-4">
                        <button 
                          className="btn btn-primary-custom btn-lg"
                          onClick={() => nav('/contact')}
                        >
                          Contact Support
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Resources */}
                <div className="row g-4 mt-4">
                  <div className="col-md-6">
                    <div className="support-section">
                      <div className="d-flex align-items-start">
                        <div className="section-icon me-3">
                          🎓
                        </div>
                        <div>
                          <h5 className="fw-bold text-dark mb-2">Training Resources</h5>
                          <p className="text-muted mb-0">
                            Access video tutorials, webinars, and training sessions to maximize 
                            your use of SecureMind's security training platform.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="support-section">
                      <div className="d-flex align-items-start">
                        <div className="section-icon me-3">
                          💡
                        </div>
                        <div>
                          <h5 className="fw-bold text-dark mb-2">Feature Requests</h5>
                          <p className="text-muted mb-0">
                            Have ideas for new features or improvements? We love hearing from our users. 
                            Share your suggestions to help shape the future of SecureMind.
                          </p>
                        </div>
                      </div>
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