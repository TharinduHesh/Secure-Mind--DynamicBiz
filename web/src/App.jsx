// web/src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Forgot from "./pages/Forgot";
import VerifyEmail from "./pages/VerifyEmail";
import MfaSetup from "./pages/account/MfaSetup";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleGate from "./routes/RoleGate";
import AdminGuard from "./components/AdminGuard";

import Admin from "./pages/dashboards/Admin";
import Security from "./pages/dashboards/Security";
import Accounting from "./pages/dashboards/Accounting";
import Marketing from "./pages/dashboards/Marketing";
import Developer from "./pages/dashboards/Developer";
import Design from "./pages/dashboards/Design";
import User from "./pages/dashboards/User";

import Users from "./pages/admin/Users";
import Policies from "./pages/admin/Policies";
import TrainingQuizzes from "./pages/admin/TrainingQuizzes";
import FactsNotifications from "./pages/admin/FactsNotifications";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/settings";
import Incidents from "./pages/admin/Incidents";

import IncidentReport from "./pages/incidents/IncidentReport";
import MyIncidents from "./pages/incidents/MyIncidents";

import AccountingQuiz from "./pages/path/Quiz";
import AccountingGames from "./pages/games/AccountantGames";
import AccountingProgress from "./pages/path/Progress";
import InvoiceFraud from "./pages/path/InvoiceFraud";
import MarketingQuiz from "./pages/path/Quiz";
import MarketingGames from "./pages/games/MarketingGames";
import MarketingProgress from "./pages/path/Progress";
import DeveloperQuiz from "./pages/path/Quiz";
import DeveloperGames from "./pages/games/DeveloperGames";
import DeveloperProgress from "./pages/path/Progress";
import DesignQuiz from "./pages/path/Quiz";
import DesignGames from "./pages/games/DesignGames";
import DesignProgress from "./pages/path/Progress";
import SecurityQuiz from "./pages/path/Quiz";
import SecurityGames from "./pages/games/SecurityGames";
import SecurityProgress from "./pages/path/Progress";

import UserProfile from "./pages/UserProfile";

import PolicyViewer from "./pages/path/PolicyViewer";
import UserPoliciesList from "./pages/path/UserPoliciesList";

import { auth } from "./firebase";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => setReady(true));
    return () => unsub();
  }, []);

  if (!ready) {
    return (
      <div className="container py-5 text-center text-body-secondary">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading application...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/support" element={<Support />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        path="/account/mfa-setup"
        element={
          <ProtectedRoute>
            <MfaSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/policies"
        element={
          <ProtectedRoute>
            <UserPoliciesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/policies/:policyId"
        element={
          <ProtectedRoute>
            <PolicyViewer />
          </ProtectedRoute>
        }
      />

      <Route
        path="/report-incident"
        element={
          <ProtectedRoute>
            <IncidentReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-incidents"
        element={
          <ProtectedRoute>
            <MyIncidents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleGate role="__any__">
              <Navigate to="/dashboard/user" replace />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute>
            <RoleGate role="admin">
              <Admin />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/security"
        element={
          <ProtectedRoute>
            <RoleGate role="security">
              <Security />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/accounting"
        element={
          <ProtectedRoute>
            <RoleGate role="accounting">
              <Accounting />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/marketing"
        element={
          <ProtectedRoute>
            <RoleGate role="marketing">
              <Marketing />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/developer"
        element={
          <ProtectedRoute>
            <RoleGate role="developer">
              <Developer />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/design"
        element={
          <ProtectedRoute>
            <RoleGate role="design">
              <Design />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user"
        element={
          <ProtectedRoute>
            <User />
          </ProtectedRoute>
        }
      />

      <Route
        path="/accounting"
        element={
          <ProtectedRoute>
            <RoleGate role="accounting">
              <Accounting />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounting/quiz"
        element={
          <ProtectedRoute>
            <RoleGate role="accounting">
              <AccountingQuiz />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounting/games"
        element={
          <ProtectedRoute>
            <RoleGate role="accounting">
              <AccountingGames />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounting/progress"
        element={
          <ProtectedRoute>
            <RoleGate role="accounting">
              <AccountingProgress />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounting/invoice-fraud"
        element={
          <ProtectedRoute>
            <RoleGate role="accounting">
              <InvoiceFraud />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/marketing"
        element={
          <ProtectedRoute>
            <RoleGate role="marketing">
              <Marketing />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/quiz"
        element={
          <ProtectedRoute>
            <RoleGate role="marketing">
              <MarketingQuiz />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/games"
        element={
          <ProtectedRoute>
            <RoleGate role="marketing">
              <MarketingGames />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/progress"
        element={
          <ProtectedRoute>
            <RoleGate role="marketing">
              <MarketingProgress />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/developer"
        element={
          <ProtectedRoute>
            <RoleGate role="developer">
              <Developer />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/quiz"
        element={
          <ProtectedRoute>
            <RoleGate role="developer">
              <DeveloperQuiz />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/games"
        element={
          <ProtectedRoute>
            <RoleGate role="developer">
              <DeveloperGames />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/progress"
        element={
          <ProtectedRoute>
            <RoleGate role="developer">
              <DeveloperProgress />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/design"
        element={
          <ProtectedRoute>
            <RoleGate role="design">
              <Design />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/design/quiz"
        element={
          <ProtectedRoute>
            <RoleGate role="design">
              <DesignQuiz />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/design/games"
        element={
          <ProtectedRoute>
            <RoleGate role="design">
              <DesignGames />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/design/progress"
        element={
          <ProtectedRoute>
            <RoleGate role="design">
              <DesignProgress />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/security"
        element={
          <ProtectedRoute>
            <RoleGate role="security">
              <Security />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/security/quiz"
        element={
          <ProtectedRoute>
            <RoleGate role="security">
              <SecurityQuiz />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/security/games"
        element={
          <ProtectedRoute>
            <RoleGate role="security">
              <SecurityGames />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/security/progress"
        element={
          <ProtectedRoute>
            <RoleGate role="security">
              <SecurityProgress />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminGuard>
            <Admin />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminGuard>
            <Users />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/policies"
        element={
          <AdminGuard>
            <Policies />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/training"
        element={
          <AdminGuard>
            <TrainingQuizzes />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/facts"
        element={
          <AdminGuard>
            <FactsNotifications />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminGuard>
            <Reports />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminGuard>
            <Settings />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/incidents"
        element={
          <AdminGuard>
            <Incidents />
          </AdminGuard>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
