// E:/SecureMind/web/src/pages/Privacy.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
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
        .privacy-section {
          padding: 2rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border: 1px solid #e2e8f0;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }
        .privacy-section:hover {
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
          content: '✓';
          position: absolute;
          left: 0;
          top: 0;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
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
                🛡️
              </div>
              <h1 className="display-4 fw-bold mb-4">Privacy Policy</h1>
              <p className="lead mb-4 opacity-90">
                Your privacy and data security are our top priorities. Learn how we protect and handle your information.
              </p>
              <div className="badge bg-light text-dark px-3 py-2 fs-6">
                Last updated: {new Date().getFullYear()}
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
                {/* Introduction */}
                <div className="privacy-section">
                  <div className="d-flex align-items-start mb-4">
                    <div className="section-icon me-4">
                      📋
                    </div>
                    <div>
                      <h3 className="h4 fw-bold mb-3 text-dark">Our Commitment</h3>
                      <p className="text-muted mb-0 lead">
                        We value your privacy and are committed to protecting your personal information. 
                        This policy describes how SecureMind collects, uses, and protects your information 
                        when you use our security training platform.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="row g-4">
                  {/* Information We Collect */}
                  <div className="col-md-6">
                    <div className="privacy-section h-100">
                      <div className="section-icon">
                        📊
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Information We Collect</h4>
                      <ul className="list-custom">
                        <li>Account details such as name, email, and organization</li>
                        <li>Usage data related to training progress and interactions</li>
                        <li>Technical data such as device, browser, and IP address</li>
                        <li>Authentication information and security credentials</li>
                      </ul>
                    </div>
                  </div>

                  {/* How We Use Information */}
                  <div className="col-md-6">
                    <div className="privacy-section h-100">
                      <div className="section-icon">
                        ⚙️
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">How We Use Information</h4>
                      <ul className="list-custom">
                        <li>To provide and improve training content and analytics</li>
                        <li>To communicate updates, policy changes, and support notices</li>
                        <li>To maintain the security and integrity of the service</li>
                        <li>To personalize your learning experience</li>
                      </ul>
                    </div>
                  </div>

                  {/* Your Rights */}
                  <div className="col-md-6">
                    <div className="privacy-section h-100">
                      <div className="section-icon">
                        🔐
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Your Rights</h4>
                      <p className="text-muted mb-3">
                        You have full control over your personal data and can exercise the following rights:
                      </p>
                      <ul className="list-custom">
                        <li>Access and review your personal data</li>
                        <li>Correct or update inaccurate information</li>
                        <li>Delete your account and associated data</li>
                        <li>Export your data in a portable format</li>
                      </ul>
                    </div>
                  </div>

                  {/* Data Security */}
                  <div className="col-md-6">
                    <div className="privacy-section h-100">
                      <div className="section-icon">
                        🔒
                      </div>
                      <h4 className="fw-bold mb-3 text-dark">Data Security</h4>
                      <p className="text-muted mb-3">
                        We implement comprehensive security measures to protect your data:
                      </p>
                      <ul className="list-custom">
                        <li>End-to-end encryption for data transmission</li>
                        <li>Secure cloud infrastructure with regular audits</li>
                        <li>Multi-factor authentication requirements</li>
                        <li>Regular security updates and monitoring</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="privacy-section mt-4">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <div className="d-flex align-items-start">
                        <div className="section-icon me-4">
                          📞
                        </div>
                        <div>
                          <h4 className="fw-bold mb-3 text-dark">Questions or Concerns?</h4>
                          <p className="text-muted mb-0">
                            If you have any questions about this privacy policy or need to exercise your data rights, 
                            please don't hesitate to contact our privacy team at <strong>securemindotp@gmail.com</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                      <button 
                        className="btn btn-primary-custom"
                        onClick={() => nav('/contact')}
                      >
                        Contact Us
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