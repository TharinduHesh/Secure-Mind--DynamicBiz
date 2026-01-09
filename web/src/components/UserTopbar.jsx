// web/src/components/UserTopbar.jsx
import React, { useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function UserTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const roleSegments = ['accounting', 'marketing', 'design', 'developer', 'security'];
  const pathParts = location.pathname.split('/').filter(Boolean);
  // Only treat the path as a role path if the FIRST segment is a known role.
  const firstSegment = pathParts[0] || null;
  const detectedSegment = firstSegment && roleSegments.includes(firstSegment) ? firstSegment : null;
  const storedSegment = sessionStorage.getItem('lastRoleSegment');
  // basePath is always based on the stored/detected role so Dashboard link returns to last role
  const currentSegment = detectedSegment || storedSegment || 'accounting';
  const basePath = `/${currentSegment}`;
  // Role-specific nav should only render when the current URL's first segment is a role
  const isRoleRoute = !!detectedSegment;
  const isAccountingPath = detectedSegment === 'accounting';
  const isMarketingPath = detectedSegment === 'marketing';
  const isDesignPath = detectedSegment === 'design';
  const isDeveloperPath = detectedSegment === 'developer';
  const isSecurityPath = detectedSegment === 'security';
  // Policies path check should only use startsWith (not includes) to avoid false positives
  const isPoliciesPath = location.pathname.startsWith('/policies');
  const isProfilePath = location.pathname.startsWith('/profile') || location.pathname === '/change-password';

  // Remember last visited role segment so Dashboard link returns to the correct role from non-role pages (e.g., /policies)
  useEffect(() => {
    if (detectedSegment && detectedSegment !== storedSegment) {
      try { sessionStorage.setItem('lastRoleSegment', detectedSegment); } catch (_) { /* ignore */ }
    }
  }, [detectedSegment, storedSegment]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById('profileDropdown');
      const dropdownMenu = dropdown?.nextElementSibling;
      if (dropdown && dropdownMenu && !dropdown.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.remove('show');
        dropdown.setAttribute('aria-expanded', 'false');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('authUser');
      sessionStorage.clear();
      // Clear any other stored data
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  const confirmSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      handleSignOut();
    }
  };

  // Handle profile button click - ensure dropdown works
  const handleProfileButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Close all other dropdowns first
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
    document.querySelectorAll('[aria-expanded="true"]').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
    
    // Toggle this dropdown
    const dropdown = e.currentTarget.nextElementSibling;
    const button = e.currentTarget;
    
    if (dropdown) {
      const isOpen = dropdown.classList.contains('show');
      if (!isOpen) {
        dropdown.classList.add('show');
        button.setAttribute('aria-expanded', 'true');
      } else {
        dropdown.classList.remove('show');
        button.setAttribute('aria-expanded', 'false');
      }
    } else {
      // no-op if dropdown not found
    }
  };

  return (
    <nav className="navbar navbar-expand-lg sticky-top border-bottom user-navbar">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold d-flex align-items-center" to={basePath}>
          <img src="/src/img/Logo/SecureMind.png" alt="SecureMind" className="me-2 brand-image" />
          <span className="brand-text">SecureMind Training</span>
        </Link>
        
        {/* Mobile Toggle */}
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#userNavbar"
          aria-controls="userNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        {/* Collapsible Content */}
        <div className="collapse navbar-collapse" id="userNavbar">
          {/* Navigation Links */}
          <ul className="navbar-nav me-auto">
            {/* Always show Dashboard (route depends on current role path) */}
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                to={basePath}
                end
              >
                <i className="bi bi-house me-1"></i>
                Dashboard
              </NavLink>
            </li>

            {/* Role-specific links (Games, Progress) for current base path */}
            {isRoleRoute && (
              <>
                <li className="nav-item">
                  <NavLink 
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    to={`${basePath}/games`}
                  >
                    <i className="bi bi-controller me-1"></i>
                    {isAccountingPath ? 'Security Games' : 'Games'}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink 
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    to={`${basePath}/progress`}
                  >
                    <i className="bi bi-graph-up me-1"></i>
                    Progress
                  </NavLink>
                </li>
                {isAccountingPath && (
                  <li className="nav-item">
                    <NavLink 
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/accounting/invoice-fraud"
                    >
                      <i className="bi bi-file-text me-1"></i>
                      Invoice Detective
                    </NavLink>
                  </li>
                )}
              </>
            )}

            {/* Policies link - show always with proper routing */}
            <li className="nav-item">
              <Link 
                className={`nav-link ${isPoliciesPath ? 'active' : ''}`}
                to="/policies"
              >
                <i className="bi bi-shield-check me-1"></i>
                Policies
              </Link>
            </li>
          </ul>
          
          {/* Right Side - Theme Toggle, Profile, and Logout */}
          <div className="navbar-nav ms-auto">
            <div className="d-flex align-items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Profile Dropdown */}
              <div className="dropdown">
                <button 
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-1 profile-btn"
                  type="button"
                  id="profileDropdown"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="true"
                  aria-expanded="false"
                  onClick={handleProfileButtonClick}
                >
                  <i className="bi bi-person-circle"></i>
                  <span className="d-none d-sm-inline">Profile</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                  <li>
                    <button 
                      className={`dropdown-item ${isProfilePath ? 'active' : ''}`} 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Navigating to profile...');
                        navigate('/profile');
                      }}
                    >
                      <i className="bi bi-person-gear me-2"></i>
                      Edit Profile
                    </button>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Navigating to change password...');
                        navigate('/profile');
                      }}
                    >
                      <i className="bi bi-key me-2"></i>
                      Change Password
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button 
                      className="dropdown-item text-danger"
                      onClick={(e) => {
                        e.preventDefault();
                        confirmSignOut();
                      }}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Sign Out
                    </button>
                  </li>
                </ul>
              </div>
              
              {/* Quick Logout Button (for larger screens) */}
              <button 
                className="btn btn-danger logout-btn d-none d-lg-flex align-items-center gap-1"
                onClick={confirmSignOut}
                title="Sign out of your account"
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .user-navbar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0,0,0,0.1);
          min-height: 70px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .brand-icon {
          font-size: 1.5rem;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
        }

        .brand-image {
          width: 28px;
          height: 28px;
          object-fit: contain;
          border-radius: 6px;
        }

        .navbar-brand {
          font-weight: 700;
          color: var(--bs-primary) !important;
          transition: all 0.3s ease;
          font-size: 1.25rem;
          text-decoration: none;
        }

        .navbar-brand:hover {
          transform: translateY(-1px);
          color: var(--bs-primary) !important;
        }

        .brand-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-link {
          font-weight: 500;
          transition: all 0.3s ease;
          border-radius: 8px;
          margin: 0 0.25rem;
          padding: 0.5rem 0.75rem !important;
          position: relative;
          color: var(--bs-secondary);
          text-decoration: none;
        }

        .nav-link:hover {
          background: rgba(var(--bs-primary-rgb), 0.1);
          transform: translateY(-1px);
          color: var(--bs-primary);
        }

        .nav-link.active {
          background: var(--bs-primary);
          color: white !important;
          font-weight: 600;
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          background: var(--bs-primary);
          border-radius: 50%;
        }

        .dropdown-menu {
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          padding: 0.5rem 0;
          min-width: 200px;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95);
          display: none;
        }

        .dropdown-menu.show {
          display: block !important;
        }

        .dropdown-item {
          padding: 0.75rem 1.25rem;
          transition: all 0.2s ease;
          border-radius: 0;
          display: flex;
          align-items: center;
          font-weight: 500;
          text-decoration: none;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          color: var(--bs-dark);
        }

        .dropdown-item:hover {
          background: rgba(var(--bs-primary-rgb), 0.1);
          color: var(--bs-primary);
          transform: translateX(4px);
        }

        .dropdown-item.active {
          background: rgba(var(--bs-primary-rgb), 0.1);
          color: var(--bs-primary);
          font-weight: 600;
        }

        .dropdown-item.text-danger {
          color: #dc3545 !important;
        }

        .dropdown-item.text-danger:hover {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545 !important;
        }

        .profile-btn {
          border-radius: 20px;
          padding: 0.5rem 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          border: 2px solid rgba(var(--bs-secondary-rgb), 0.3);
        }

        .profile-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-color: var(--bs-primary);
          color: var(--bs-primary) !important;
        }

        .logout-btn {
          border-radius: 20px;
          padding: 0.5rem 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
        }

        .logout-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
          background-color: #c82333 !important;
        }

        .navbar-toggler {
          border: none;
          padding: 0.25rem 0.5rem;
        }

        .navbar-toggler:focus {
          box-shadow: none;
        }

        .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2833, 37, 41, 0.75%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
        }

        /* Dark theme support */
        [data-bs-theme="dark"] .user-navbar {
          background: rgba(33, 37, 41, 0.95);
          border-bottom-color: rgba(255, 255, 255, 0.1);
        }

        [data-bs-theme="dark"] .navbar-brand {
          color: white !important;
        }

        [data-bs-theme="dark"] .brand-text {
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        [data-bs-theme="dark"] .nav-link {
          color: #e2e8f0;
        }

        [data-bs-theme="dark"] .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #60a5fa;
        }

        [data-bs-theme="dark"] .dropdown-menu {
          background: rgba(45, 55, 72, 0.95);
          border-color: #4a5568;
          display: none;
        }

        [data-bs-theme="dark"] .dropdown-menu.show {
          display: block !important;
        }

        [data-bs-theme="dark"] .dropdown-item {
          color: #e2e8f0;
        }

        [data-bs-theme="dark"] .dropdown-item:hover {
          background: rgba(96, 165, 250, 0.2);
          color: #60a5fa;
        }

        [data-bs-theme="dark"] .dropdown-item.active {
          background: rgba(96, 165, 250, 0.2);
          color: #60a5fa;
        }

        [data-bs-theme="dark"] .dropdown-item.text-danger {
          color: #f87171 !important;
        }

        [data-bs-theme="dark"] .dropdown-item.text-danger:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171 !important;
        }

        [data-bs-theme="dark"] .profile-btn {
          border-color: rgba(255, 255, 255, 0.3);
          color: #e2e8f0;
        }

        [data-bs-theme="dark"] .profile-btn:hover {
          border-color: #60a5fa;
          color: #60a5fa !important;
        }

        [data-bs-theme="dark"] .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.75%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
        }

        /* Mobile responsiveness */
        @media (max-width: 991px) {
          .navbar-nav {
            padding-top: 1rem;
          }
          
          .nav-link {
            margin: 0.25rem 0;
            text-align: left;
          }
          
          .navbar-nav.ms-auto {
            margin-top: 1rem !important;
            padding-top: 1rem;
            border-top: 1px solid rgba(0,0,0,0.1);
          }
          
          [data-bs-theme="dark"] .navbar-nav.ms-auto {
            border-top-color: rgba(255, 255, 255, 0.1);
          }

          .profile-btn {
            justify-content: center;
            width: 100%;
            margin-bottom: 0.5rem;
          }

          .logout-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 576px) {
          .brand-text {
            display: none;
          }
          
          .navbar-brand {
            font-size: 1.1rem;
          }
        }

        /* Smooth transitions */
        .navbar-collapse {
          transition: all 0.3s ease;
        }

        /* Focus styles for accessibility */
        .nav-link:focus,
        .dropdown-item:focus,
        .profile-btn:focus,
        .logout-btn:focus {
          outline: 2px solid var(--bs-primary);
          outline-offset: 2px;
        }

        [data-bs-theme="dark"] .nav-link:focus,
        [data-bs-theme="dark"] .dropdown-item:focus,
        [data-bs-theme="dark"] .profile-btn:focus {
          outline-color: #60a5fa;
        }
      `}</style>
    </nav>
  );
}