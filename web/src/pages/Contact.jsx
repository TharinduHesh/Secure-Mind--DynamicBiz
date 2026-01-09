// E:/SecureMind/web/src/pages/Contact.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Contact() {
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
        .contact-section {
          padding: 2rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border: 1px solid #e2e8f0;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }
        .contact-section:hover {
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
          text-decoration: none;
          display: inline-block;
        }
        .btn-primary-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
          background: linear-gradient(135deg, #5856eb, #7c3aed);
          color: white;
          text-decoration: none;
        }
        .contact-info {
          background: linear-gradient(135deg, #e0f2fe, #b3e5fc);
          border: 2px solid #0288d1;
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }
        .contact-info:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .location-badge {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          border: 1px solid #16a34a;
          color: #15803d;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.875rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .email-link {
          color: var(--accent-color);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .email-link:hover {
          color: var(--accent-light);
          text-decoration: underline;
        }
        .office-hours {
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
                📞
              </div>
              <h1 className="display-4 fw-bold mb-4">Contact Us</h1>
              <p className="lead mb-4 opacity-90">
                Get in touch with our team for support, inquiries, or collaboration opportunities.
              </p>
              <div className="location-badge">
                <span>📍</span>
                Located in Kandy, Sri Lanka
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
                {/* Primary Contact */}
                <div className="contact-info mb-5">
                  <div className="section-icon mx-auto mb-4">
                    ✉️
                  </div>
                  <h3 className="fw-bold text-dark mb-3">Primary Contact</h3>
                  <p className="text-dark mb-4">
                    For all support requests, technical assistance, and general inquiries
                  </p>
                  <div className="mb-4">
                    <a 
                      href="mailto:securemindotp@gmail.com" 
                      className="email-link h4"
                    >
                      securemindotp@gmail.com
                    </a>
                  </div>
                  <a 
                    href="mailto:securemindotp@gmail.com" 
                    className="btn btn-primary-custom btn-lg"
                  >
                    Send Email
                  </a>
                </div>

                <div className="row g-4">
                  {/* Support Categories */}
                  <div className="col-md-6">
                    <div className="contact-section h-100">
                      <div className="section-icon">
                        🛠️
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Technical Support</h4>
                      <p className="text-muted mb-3">
                        Get help with platform issues, bugs, and technical questions
                      </p>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Platform troubleshooting
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Account access issues
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Bug reports and fixes
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="contact-section h-100">
                      <div className="section-icon">
                        💼
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Business Inquiries</h4>
                      <p className="text-muted mb-3">
                        Discuss partnerships, enterprise solutions, and custom implementations
                      </p>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Enterprise licensing
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Custom training content
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Integration services
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="contact-section h-100">
                      <div className="section-icon">
                        🎓
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Training Support</h4>
                      <p className="text-muted mb-3">
                        Questions about training modules, assessments, and certification
                      </p>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Course content questions
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Assessment guidance
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Progress tracking help
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="contact-section h-100">
                      <div className="section-icon">
                        🔒
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Security & Privacy</h4>
                      <p className="text-muted mb-3">
                        Report security vulnerabilities and privacy concerns
                      </p>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Security vulnerability reports
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Data privacy questions
                        </li>
                        <li className="mb-2">
                          <span className="text-success me-2">•</span>
                          Compliance inquiries
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Response Time */}
                <div className="office-hours text-center">
                  <h5 className="fw-bold text-dark mb-3">
                    <span className="me-2">⏰</span>
                    Response Time
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="fw-bold text-dark">General Inquiries</div>
                      <div className="text-muted">24-48 hours</div>
                    </div>
                    <div className="col-md-4">
                      <div className="fw-bold text-dark">Technical Support</div>
                      <div className="text-muted">12-24 hours</div>
                    </div>
                    <div className="col-md-4">
                      <div className="fw-bold text-dark">Security Issues</div>
                      <div className="text-muted">Within 6 hours</div>
                    </div>
                  </div>
                </div>

                {/* Location Info */}
                <div className="contact-section">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <div className="d-flex align-items-start">
                        <div className="section-icon me-4">
                          🏢
                        </div>
                        <div>
                          <h4 className="fw-bold mb-3 text-dark">Our Location</h4>
                          <p className="text-muted mb-2">
                            <strong>SecureMind Headquarters</strong>
                          </p>
                          <p className="text-muted mb-0">
                            Kandy, Central Province<br />
                            Sri Lanka
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                      <div className="location-badge">
                        <span>🌏</span>
                        GMT+5:30 (IST)
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