import React from "react";
import { Link } from "react-router-dom";
import UserTopbar from "../../components/UserTopbar";

export default function UserDashboard() {
  return (
    <>
      <UserTopbar />
      <div className="container py-4">
        <h2 className="fw-bold mb-2">Welcome</h2>
        <p className="text-body-secondary mb-4">
          Your account is active but no role was found yet. If you just registered, your role will appear after the server finishes setup.
        </p>
        
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-wrapper me-3">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1">Company Policies</h5>
                    <p className="text-muted small mb-0">Review and acknowledge required policies</p>
                  </div>
                </div>
                <Link to="/policies" className="btn btn-primary">
                  <i className="bi bi-file-text me-2"></i>
                  View Policies
                </Link>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-wrapper me-3" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}>
                    <i className="bi bi-exclamation-triangle"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1">Report Incident</h5>
                    <p className="text-muted small mb-0">Report security incidents or concerns</p>
                  </div>
                </div>
                <Link to="/report-incident" className="btn btn-outline-danger">
                  <i className="bi bi-shield-exclamation me-2"></i>
                  Report Incident
                </Link>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .icon-wrapper {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          
          .card {
            border-radius: 12px;
            transition: all 0.3s ease;
          }
          
          .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
          }
        `}</style>
      </div>
    </>
  );
}
