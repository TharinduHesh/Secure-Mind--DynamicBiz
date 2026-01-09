# SecureMind - Security Awareness Platform

A comprehensive security awareness and training platform with role-based access control, interactive games, incident reporting, and policy management. Built with React and Firebase for real-time collaboration and security compliance.

## 🎥 Demo Video

Watch the full demonstration: [SecureMind Demo Video](https://mysliit-my.sharepoint.com/:v:/g/personal/it23269484_my_sliit_lk/IQBFi3lQPaQ7SJoXiBaZw7h4AVWNSKuvDoABkAiLA3Rg27M?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=7ICbVq)

## 🚀 Features

- **Role-Based Dashboards**: Customized interfaces for Admin, Security, Accounting, Marketing, Developer, and Design teams
- **Interactive Training**: Department-specific security games and quizzes
- **Incident Management**: Report, track, and manage security incidents
- **Policy Management**: Centralized policy distribution and acknowledgment tracking
- **Multi-Factor Authentication**: Enhanced security with MFA setup
- **Real-Time Notifications**: Security facts and alerts pushed to relevant teams
- **Progress Tracking**: Monitor training completion and quiz scores
- **Idle Logout**: Automatic session management for enhanced security

## 📁 Project Structure
```
securemind-firebase/
├─ .env.example
├─ firebase.json
├─ firestore.rules
├─ storage.rules
├─ firestore.indexes.json
├─ .firebaserc
├─ functions/              # Cloud Functions (RBAC, bootstrap)
│  ├─ index.js
│  ├─ package.json
│  └─ tests/
└─ web/                    # React app (Vite)
   ├─ package.json
   ├─ index.html
   └─ src/
      ├─ firebase.js
      ├─ App.jsx
      ├─ main.jsx
      ├─ utils/rbac.js
      ├─ routes/{ProtectedRoute,RoleGate}.jsx
      └─ pages/
         ├─ Home.jsx       # your theme kept
         ├─ Login.jsx
         ├─ Register.jsx   # fixed errors
         ├─ Forgot.jsx     # fixed errors
         └─ dashboards/{Admin,Security,Accounting,Marketing,Developer,Design}.jsx
```

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions, Storage)
- **Styling**: CSS3, Theme Toggle (Light/Dark Mode)
- **Testing**: Jest
- **Security**: RBAC via Custom Claims, MFA, Firestore Security Rules

## 🚦 Local Setup (Step‑by‑Step)
1. **Install tools**
   - Node 20+
   - `npm i -g firebase-tools`
   - `firebase login`

2. **Create Firebase project**
   - In console, create project and a Web App → copy config into `.env` (see `.env.example`).

3. **Initialize service account (for scripts/tests)**
   - In Firebase Console → Project Settings → Service accounts → Generate key → save as `serviceAccount.json` at repo root.

4. **Emulators (recommended)**
   ```bash
   # From repo root
   firebase emulators:start
   ```

5. **Web app**
   ```bash
   cd web
   npm i
   npm run dev
   ```
   Open http://localhost:5173 (or printed URL).

6. **Functions**
   ```bash
   cd functions
   npm i
   npm run serve   # or: firebase emulators:start --only functions,firestore,auth,storage
   ```

7. **RBAC via custom claims**
   - On user creation, `onUserCreate` sets role from `/preapprovals/{uid}` or defaults to `"user"`.
   - Admins can update roles via callable `setRole` (client example):
     ```js
     import { callSetRole } from "../firebase";
     await callSetRole({ uid: "USER_UID", role: "security" });
     ```
   - Firestore/Storage rules enforce `request.auth.token.role`.

8. **Routes (no combined view)**
   - `/dashboard/admin` (admin only)
   - `/dashboard/security`
   - `/dashboard/accounting`
   - `/dashboard/marketing`
   - `/dashboard/developer`
   - `/dashboard/design`

9. **Facts / Broadcasts**
   - Use Cloud Function `publishFact` (HTTP) or write to `facts` collection directly if caller has `admin/security` role.
   - UI stubs are present in the dashboards; wire as needed.

## 📊 Data Migration
You had two sources:
- **JSON store** (`backend/data/*.json`) for `users` & `facts`
- **Mongo models** for `User`, `Employee`, `Fact`, `Preapproval`

### Mapping
| Old Model     | Firestore Collection | Fields Mapping                                                     |
|---------------|----------------------|--------------------------------------------------------------------|
| User          | `users/{uid}`        | `email`, `firstName`, `lastName`, `employeeId`, `role` (claim)     |
| Employee      | `employees/{id}`     | `employeeId`, `email`, `fullName`, `role`, `isActive`, `uid`       |
| Fact          | `facts/{id}`         | `message`, `roles[]`, `priority`, `type`, `createdBy`, `createdAt` |
| Preapproval   | `preapprovals/{uid}` | `role`, `email`, `used`                                            |

> Password hashes are **not** migrated. Users should reset password via Firebase (email link).

### Scripts
- Add your CSV/JSON to `scripts/migrate/legacy-json/*.json` and/or set `MONGO_URI` in `.env`.
- Then run with Node + Admin SDK (use `serviceAccount.json`). See `scripts/migrate/` for examples.

## 🧪 Tests
- **Functions**: `functions/tests/functions.test.js` (Jest). Extend with emulator tests as needed.
- **Web**: Add RTL tests in `web/src/__tests__/` (not included by default).

## 🚀 Deploy
```bash
# Build web
cd web && npm run build && cd ..

# Deploy hosting + rules + functions
firebase deploy --only hosting:web,functions,firestore:rules,storage
```

## 🔐 Security Features

- **Custom Claims RBAC**: Role-based access control enforced at Firebase level
- **Firestore Security Rules**: Database-level access control
- **MFA Support**: Multi-factor authentication for enhanced security
- **Idle Session Timeout**: Automatic logout after inactivity
- **Secure Storage Rules**: File access based on user roles
- **Email Verification**: Required for account activation

## 📝 License

This project is private and proprietary.

## 👥 Contributors

This project was developed by:

- **Tharindu Ranasinghe**
- **Bhanuka Rathnayake**
- **Suhas Bandara**
- **Kavindu Liyanage**

---

**Built with ❤️ for enhanced security awareness and compliance**
