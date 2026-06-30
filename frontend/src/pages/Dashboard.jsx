import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { Users, FileText, Briefcase, Calendar, ShieldCheck, UserCheck } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    totalHRs: 0,
    totalDocs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (['Admin', 'HR Manager'].includes(user?.role)) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [empRes, docRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/documents')
      ]);

      const employees = empRes.data;
      const totalEmployees = employees.length;
      const totalHRs = employees.filter(e => e.role === 'HR Manager').length;
      const totalDocs = docRes.data.length;

      setMetrics({ totalEmployees, totalHRs, totalDocs });
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard telemetry...</div>;
  }

  const isElevated = ['Admin', 'HR Manager'].includes(user?.role);

  return (
    <div className="animate-fade-in">
      <Header title="Dashboard" />

      {/* Greeting Banner */}
      <div className="glass-panel" style={{
        padding: '32px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
          {getWelcomeMessage()}, {user?.first_name || 'User'}!
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1.05rem', maxWidth: '600px' }}>
          {isElevated 
            ? 'Manage operations, analyze telemetry metrics, monitor employees and coordinate corporate governance policies.' 
            : 'Access resources, view your profile status, and manage corporate files/documents securely.'
          }
        </p>
      </div>

      {isElevated ? (
        /* Admin/HR Metrics */
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
            <StatCard 
              title="Total Employees" 
              value={metrics.totalEmployees} 
              icon={Users} 
              color="var(--accent-secondary)" 
            />
            <StatCard 
              title="HR Managers" 
              value={metrics.totalHRs} 
              icon={ShieldCheck} 
              color="var(--accent-success)" 
            />
            <StatCard 
              title="Documents Tracked" 
              value={metrics.totalDocs} 
              icon={FileText} 
              color="var(--accent-warning)" 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                System Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                  🔑 <b>RBAC Protocol:</b> Roles verify securely on APIs.
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                  ☁️ <b>Direct S3 Pipeline:</b> File uploads bypass local disk in production.
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                  🚀 <b>PM2 Live Clustering:</b> Automatically monitors CPU/Memory threads.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Employee Summary */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--accent-secondary)" />
              Employment Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Position</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '2px' }}>{user?.position || 'N/A'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Department</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '2px' }}>{user?.department || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} color="var(--accent-success)" />
              Important Dates & Security
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Role Privilege</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '2px' }}>
                  <span className="badge badge-employee">{user?.role}</span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contact Email</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '2px' }}>{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
