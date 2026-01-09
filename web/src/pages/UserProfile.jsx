// web/src/pages/UserProfile.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  updateProfile, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import UserTopbar from "../components/UserTopbar";

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    employeeName: '',
    role: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const db = useMemo(() => getFirestore(), []);

  // Auth state monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        navigate('/login');
        setLoading(false);
        return;
      }

      // Fetch user profile data
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setUserProfile(profileData);
          setProfileForm({
            displayName: currentUser.displayName || profileData.displayName || '',
            email: currentUser.email || '',
            phone: profileData.phone || '',
            employeeName: profileData.employeeName || '',
            role: profileData.role || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setErrors(prev => ({ ...prev, general: 'Failed to load profile data' }));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, db]);

  const clearMessages = () => {
    setErrors({});
    setSuccess('');
  };

  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileForm.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (profileForm.phone && !/^\+?[\d\s-()]+$/.test(profileForm.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    return newErrors;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    return newErrors;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    
    const formErrors = validateProfileForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profileForm.displayName.trim()
      });

      // Update Firestore user document
      await updateDoc(doc(db, "users", user.uid), {
        displayName: profileForm.displayName.trim(),
        phone: profileForm.phone.trim(),
        employeeName: profileForm.employeeName.trim(),
        updatedAt: serverTimestamp()
      });

      setSuccess('Profile updated successfully!');
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        displayName: profileForm.displayName.trim(),
        phone: profileForm.phone.trim(),
        employeeName: profileForm.employeeName.trim()
      }));

    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    
    const formErrors = validatePasswordForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setChangingPassword(true);
    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordForm.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordForm.newPassword);
      
      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ newPassword: 'Password is too weak' });
      } else {
        setErrors({ general: error.message || 'Failed to change password' });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleProfileInputChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <>
        <UserTopbar />
        <div className="container my-4 d-flex justify-content-center align-items-center" style={{minHeight: '50vh'}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading profile...</span>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <UserTopbar />
      <div className="container my-4" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">Profile Settings</h1>
            <p className="text-muted mb-0">Manage your account information and security</p>
          </div>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/accounting')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="alert alert-success border-0 shadow-sm mb-4" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {success}
          </div>
        )}

        {errors.general && (
          <div className="alert alert-danger border-0 shadow-sm mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errors.general}
          </div>
        )}

        <div className="row g-4">
          {/* Profile Information */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                  <i className="bi bi-person-gear me-2 text-primary"></i>
                  Profile Information
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleProfileSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Display Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.displayName ? 'is-invalid' : ''}`}
                        value={profileForm.displayName}
                        onChange={(e) => handleProfileInputChange('displayName', e.target.value)}
                        placeholder="Your display name"
                      />
                      {errors.displayName && (
                        <div className="invalid-feedback">{errors.displayName}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={profileForm.email}
                        disabled
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                      <small className="form-text text-muted">
                        Email cannot be changed from this page
                      </small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        value={profileForm.phone}
                        onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                      {errors.phone && (
                        <div className="invalid-feedback">{errors.phone}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Employee Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileForm.employeeName}
                        onChange={(e) => handleProfileInputChange('employeeName', e.target.value)}
                        placeholder="Full legal name"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Role
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileForm.role}
                        disabled
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                      <small className="form-text text-muted">
                        Role is managed by administrators
                      </small>
                    </div>

                    <div className="col-12">
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg me-2"></i>
                            Save Profile
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                  <i className="bi bi-key me-2 text-primary"></i>
                  Change Password
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handlePasswordSubmit}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Current Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                        value={passwordForm.currentPassword}
                        onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                        placeholder="Enter your current password"
                      />
                      {errors.currentPassword && (
                        <div className="invalid-feedback">{errors.currentPassword}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        New Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                        placeholder="Enter new password"
                      />
                      {errors.newPassword && (
                        <div className="invalid-feedback">{errors.newPassword}</div>
                      )}
                      <small className="form-text text-muted">
                        Must be at least 6 characters long
                      </small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Confirm New Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                      />
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>

                    <div className="col-12">
                      <button 
                        type="submit" 
                        className="btn btn-danger"
                        disabled={changingPassword}
                      >
                        {changingPassword ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Changing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-key me-2"></i>
                            Change Password
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .card {
            border-radius: 16px;
            transition: all 0.3s ease;
          }

          .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
          }

          .form-control {
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            padding: 12px 16px;
            transition: all 0.2s ease;
          }

          .form-control:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-control:disabled {
            background-color: #f8f9fa !important;
            opacity: 0.7;
          }

          .btn {
            border-radius: 8px;
            padding: 12px 24px;
            font-weight: 600;
            transition: all 0.2s ease;
          }

          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .alert {
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
          }

          .form-label {
            margin-bottom: 8px;
            color: #374151;
          }

          .text-danger {
            color: #dc2626 !important;
          }

          .invalid-feedback {
            display: block;
            color: #dc2626;
            font-size: 0.875rem;
            margin-top: 4px;
          }

          .is-invalid {
            border-color: #dc2626 !important;
          }

          /* Dark theme support */
          [data-bs-theme="dark"] .card {
            background-color: #2d3748;
            border-color: #4a5568;
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .card-header {
            background-color: #4a5568 !important;
            border-bottom: 1px solid #718096 !important;
            color: #e2e8f0 !important;
          }

          [data-bs-theme="dark"] .form-control {
            background-color: #4a5568;
            border-color: #718096;
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .form-control:focus {
            background-color: #2d3748;
            border-color: #60a5fa;
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .form-control:disabled {
            background-color: #374151 !important;
            color: #9ca3af !important;
          }

          [data-bs-theme="dark"] .form-label {
            color: #e2e8f0;
          }

          [data-bs-theme="dark"] .text-muted {
            color: #a0aec0 !important;
          }

          [data-bs-theme="dark"] .alert-success {
            background-color: #14532d;
            border-color: #16a34a;
            color: #bbf7d0;
          }

          [data-bs-theme="dark"] .alert-danger {
            background-color: #7f1d1d;
            border-color: #dc2626;
            color: #fecaca;
          }

          @media (max-width: 768px) {
            .container {
              max-width: 100% !important;
              padding: 0 1rem;
            }
            
            .card-body {
              padding: 1.5rem !important;
            }
            
            .btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </>
  );
}