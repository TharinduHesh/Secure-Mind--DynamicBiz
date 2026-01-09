import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, verifyEmailWithCode, checkEmailVerificationCode, sendVerificationEmail } from "../firebase";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error, expired
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const actionCode = searchParams.get("oobCode");
      const mode = searchParams.get("mode");

      // If we didn't receive an action code (e.g., user clicked Firebase-hosted
      // confirmation page which already applied the code), try to detect an
      // already-verified user and show success instead of an error.
      if (mode !== "verifyEmail" || !actionCode) {
        try {
          // Refresh current user state if available
          if (auth.currentUser && typeof auth.currentUser.reload === "function") {
            await auth.currentUser.reload();
          }
          if (auth.currentUser?.emailVerified) {
            setStatus("success");
            setMessage("Your email has been verified. You can now sign in.");
            setTimeout(() => navigate("/login", { replace: true }), 2500);
            return;
          }
        } catch {}
        // Many providers consume the code on their hosted page and then
        // redirect to our app without parameters. Treat this as success and
        // ask the user to sign in; the login gate will still enforce verified status.
        setStatus("success");
        setMessage("If you completed verification, you can now sign in.");
        return;
      }

      try {
        // Check if the action code is valid
        await checkEmailVerificationCode(actionCode);
        
        // Apply the action code to verify the email
        await verifyEmailWithCode(actionCode);
        
        setStatus("success");
        setMessage("Your email has been verified successfully! You can now log in to your dashboard.");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
        
      } catch (error) {
        console.error("Email verification error:", error);
        
        if (error.code === "auth/expired-action-code") {
          setStatus("expired");
          setMessage("This verification link has expired. Please request a new one.");
        } else if (error.code === "auth/invalid-action-code") {
          // Code already used — consider verification complete.
          try {
            if (auth.currentUser && typeof auth.currentUser.reload === "function") {
              await auth.currentUser.reload();
            }
          } catch {}
          setStatus("success");
          setMessage("Your email is verified. You can now sign in.");
          setTimeout(() => navigate("/login", { replace: true }), 2500);
          return;
        } else {
          setStatus("error");
          setMessage("Failed to verify your email. Please try again.");
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResendVerification = async () => {
    setBusy(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendVerificationEmail(user);
        setMessage("A new verification email has been sent to your inbox.");
      } else {
        setMessage("Please log in first to resend verification email.");
      }
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      setMessage("Failed to resend verification email. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "verifying":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        );
      case "success":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        );
      case "error":
      case "expired":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "verifying":
        return "var(--primary)";
      case "success":
        return "var(--success)";
      case "error":
      case "expired":
        return "var(--danger)";
      default:
        return "var(--ink-2)";
    }
  };

  return (
    <>
      <style>{`
        :root{
          --bg-1:#0b1020; --bg-2:#0e1326; --ink-1:#e5e7eb; --ink-2:#c7c9d1; --ink-dim:#9aa0ab;
          --primary:#7c8cff; --primary-2:#9a7cff; --surface:#0f152b; --surface-2:#141b34; --border:#24304f;
          --success:#22c55e; --danger:#ef4444; --warning:#f59e0b; --shadow:0 10px 30px rgba(0,0,0,.35);
        }

        .screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(1200px 600px at -10% -10%, #1e2a5a 0%, transparent 60%),
            radial-gradient(1000px 600px at 110% 110%, #442a6b 0%, transparent 60%),
            linear-gradient(180deg, var(--bg-1), var(--bg-2));
          color: var(--ink-1);
          padding: 2rem;
        }

        .card {
          width: 100%;
          max-width: 500px;
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          border: 1px solid var(--border);
          border-radius: 20px;
          box-shadow: var(--shadow);
          padding: 3rem 2rem;
          text-align: center;
        }

        .icon {
          margin: 0 auto 1.5rem;
          color: var(--primary);
          animation: ${status === "verifying" ? "spin 2s linear infinite" : "none"};
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .message {
          color: var(--ink-2);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .btn {
          border: 0;
          cursor: pointer;
          border-radius: 12px;
          padding: 0.95rem 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
          color: white;
          transition: 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          text-decoration: none;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px rgba(124,140,255,.35);
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--ink-1);
          margin-left: 1rem;
        }

        .btn-outline:hover {
          border-color: rgba(124,140,255,.6);
          background: rgba(124,140,255,.06);
        }

        .back-home {
          background: transparent;
          border: 0;
          color: var(--ink-2);
          text-decoration: underline;
          cursor: pointer;
          margin-top: 1rem;
          font-size: 0.9rem;
        }
      `}</style>

      <main className="screen">
        <div className="card">
          <div className="icon" style={{ color: getStatusColor() }}>
            {getStatusIcon()}
          </div>
          
          <h1 className="title">
            {status === "verifying" && "Verifying your email..."}
            {status === "success" && "Email verified!"}
            {status === "error" && "Verification failed"}
            {status === "expired" && "Link expired"}
          </h1>
          
          <p className="message">{message}</p>
          
          {status === "success" && (
            <div>
              <p style={{ color: "var(--ink-dim)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Redirecting to login page in 3 seconds...
              </p>
              <button 
                className="btn" 
                onClick={() => navigate("/login", { replace: true })}
              >
                Go to Login
              </button>
            </div>
          )}
          
          {(status === "error" || status === "expired") && (
            <div>
              <button 
                className="btn" 
                onClick={handleResendVerification}
                disabled={busy}
              >
                {busy ? "Sending..." : "Resend verification email"}
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => navigate("/login", { replace: true })}
              >
                Back to Login
              </button>
            </div>
          )}
          
          <div style={{ textAlign: "center" }}>
            <button onClick={() => navigate("/")} className="back-home">
              ← Back to Home
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
