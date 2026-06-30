import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { FileUp, UserCheck, Phone, Mail, Award, Calendar, Wallet } from 'lucide-react';

const Profile = () => {
  const { user, fetchCurrentUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('phone', phone);

    if (profilePic) formData.append('profile_picture', profilePic);
    if (resume) formData.append('resume', resume);

    try {
      await axios.put(`/api/employees/${user.employee_id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Profile updated successfully!');
      await fetchCurrentUser();
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="My Profile" />

      {message && (
        <div className="glass-panel animate-fade-in" style={{
          padding: '16px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--accent-success)',
          color: '#a7f3d0',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'start' }}>
        {/* Left Side: Avatar Card */}
        <div className="glass-panel animate-fade-in" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-tertiary)',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            overflow: 'hidden',
            border: '2px solid var(--border-color)'
          }}>
            {user?.profile_picture_url ? (
              <img src={user.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.first_name?.charAt(0) || 'U'
            )}
          </div>

          <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
            {user?.first_name} {user?.last_name}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {user?.position} — {user?.department}
          </p>
          <span className={`badge badge-${(user?.role || 'Employee').toLowerCase().replace(' ', '-')}`} style={{ marginTop: '12px' }}>
            {user?.role}
          </span>

          <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
              <Mail size={16} color="var(--text-secondary)" />
              <span style={{ color: 'var(--text-primary)' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
              <Phone size={16} color="var(--text-secondary)" />
              <span style={{ color: 'var(--text-primary)' }}>{user?.phone || 'No phone listed'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Editable Settings Form */}
        <div className="glass-panel animate-fade-in" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>
            Personal Details & Files
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" 
                className="form-input" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '20px 0' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Update Profile Picture</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  id="profilePicProfile"
                  style={{ display: 'none' }}
                  onChange={e => setProfilePic(e.target.files[0])} 
                />
                <label htmlFor="profilePicProfile" className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer' }}>
                  <FileUp size={16} />
                  {profilePic ? profilePic.name.substring(0, 15) + '...' : 'Upload Image'}
                </label>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Update Resume / CV</label>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  id="resumeProfile"
                  style={{ display: 'none' }}
                  onChange={e => setResume(e.target.files[0])} 
                />
                <label htmlFor="resumeProfile" className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer' }}>
                  <FileUp size={16} />
                  {resume ? resume.name.substring(0, 15) + '...' : 'Upload PDF'}
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
