// web/src/routes/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth, isEmailVerified } from "../firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function ProtectedRoute({ children }) {
  const loc = useLocation();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [maintenance, setMaintenance] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");

  useEffect(() => {
    const db = getFirestore();
    return auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        try {
          const [userSnap, sysSnap] = await Promise.all([
            getDoc(doc(db, "users", u.uid)).catch(() => null),
            getDoc(doc(db, "app_settings", "system")).catch(() => null),
          ]);
          const r = userSnap?.data()?.role?.toLowerCase?.() || null;
          setRole(r);
          const sys = sysSnap?.data() || {};
          setMaintenance(Boolean(sys?.security?.maintenanceMode));
          setSupportEmail(String(sys?.org?.supportEmail || ""));
        } catch {}
      }
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <div className="container py-5 text-center text-body-secondary">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  
  if (!isEmailVerified(user)) {
    return <Navigate to="/login" replace state={{ 
      from: loc, 
      message: "Please verify your email address before accessing the dashboard." 
    }} />;
  }

  if (maintenance && role !== "admin") {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{minHeight:'100vh'}}>
        <div className="card border-0 shadow-sm modern-card" style={{maxWidth: 640, width:'92%'}}>
          <div className="card-body p-4 text-center">
            <div className="display-6 mb-2" aria-hidden="true">🛠️</div>
            <h3 className="fw-bold mb-2">Maintenance in progress</h3>
            <p className="text-body-secondary mb-3">
              Access is temporarily limited to administrators. Please try again later.
            </p>
            {supportEmail && (
              <p className="text-body-secondary small mb-4">
                Need help? Contact <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
              </p>
            )}
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary" onClick={()=>window.location.reload()}>Refresh</button>
              <a className="btn btn-primary" href="/">Go to Home</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
}
