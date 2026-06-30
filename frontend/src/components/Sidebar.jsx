import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, FileText, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin': return 'badge-admin';
      case 'HR Manager': return 'badge-hr';
      default: return 'badge-employee';
    }
  };

  return (
    <aside className="glass-panel" style={{
      width: '260px',
      height: 'calc(100vh - 40px)',
      margin: '20px',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '8px' }}>
          <span style={{ fontSize: '1.8rem' }}>💼</span>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              TalentSphere
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              HR Management
            </span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink 
            to="/" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'var(--transition-fast)'
            })}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink 
            to="/employees" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'var(--transition-fast)'
            })}
          >
            <Users size={18} />
            Employees
          </NavLink>

          <NavLink 
            to="/documents" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'var(--transition-fast)'
            })}
          >
            <FileText size={18} />
            Documents
          </NavLink>

          <NavLink 
            to="/profile" 
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'var(--transition-fast)'
            })}
          >
            <User size={18} />
            My Profile
          </NavLink>
        </nav>
      </div>

      <div style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            overflow: 'hidden'
          }}>
            {user?.profile_picture_url ? (
              <img src={user.profile_picture_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.first_name?.charAt(0) || 'U'
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.first_name} {user?.last_name}
            </h4>
            <span className={`badge ${getRoleBadge(user?.role)}`} style={{ fontSize: '0.65rem', marginTop: '4px' }}>
              {user?.role}
            </span>
          </div>
        </div>

        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '10px' }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
