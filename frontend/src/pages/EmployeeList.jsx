import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { Plus, Search, Trash2, Edit3, X, FileUp } from 'lucide-react';

const EmployeeList = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [salary, setSalary] = useState('');
  const [role, setRole] = useState('Employee');
  const [profilePic, setProfilePic] = useState(null);
  const [resume, setResume] = useState(null);

  const isElevated = ['Admin', 'HR Manager'].includes(user?.role);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setSelectedId(null);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setDepartment('');
    setPosition('');
    setJoiningDate('');
    setSalary('');
    setRole('Employee');
    setProfilePic(null);
    setResume(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditMode(true);
    setSelectedId(emp.id);
    setEmail(emp.email || '');
    setPassword(''); // Leave password blank on edit
    setFirstName(emp.first_name || '');
    setLastName(emp.last_name || '');
    setPhone(emp.phone || '');
    setDepartment(emp.department || '');
    setPosition(emp.position || '');
    setJoiningDate(emp.joining_date ? emp.joining_date.substring(0, 10) : '');
    setSalary(emp.salary || '');
    setRole(emp.role || 'Employee');
    setProfilePic(null);
    setResume(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee? This will delete credentials and records.')) {
      try {
        await axios.delete(`/api/employees/${id}`);
        fetchEmployees();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete employee.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('phone', phone);
    formData.append('department', department);
    formData.append('position', position);
    formData.append('joining_date', joiningDate);
    formData.append('salary', salary);
    
    if (profilePic) formData.append('profile_picture', profilePic);
    if (resume) formData.append('resume', resume);

    if (isElevated) {
      formData.append('email', email);
      formData.append('role', role);
      if (!editMode) {
        formData.append('password', password);
      }
    }

    try {
      if (editMode) {
        await axios.put(`/api/employees/${selectedId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/employees', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing request.');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || 
                          (emp.email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (emp.department || '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div>
      <Header title="Employees" />

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', minWidth: '300px' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search by name, email or department..." 
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.95rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isElevated && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <Plus size={18} />
            Add Employee
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading employees list...</div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Position</th>
                  {isElevated && <th>Salary</th>}
                  <th>Credentials / Role</th>
                  {isElevated && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--bg-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          fontWeight: 600
                        }}>
                          {emp.profile_picture_url ? (
                            <img src={emp.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            emp.first_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.first_name} {emp.last_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department || '—'}</td>
                    <td>{emp.position || '—'}</td>
                    {isElevated && (
                      <td>{emp.salary ? `$${parseFloat(emp.salary).toLocaleString()}` : '—'}</td>
                    )}
                    <td>
                      <span className={`badge badge-${(emp.role || 'Employee').toLowerCase().replace(' ', '-')}`}>
                        {emp.role || 'Employee'}
                      </span>
                    </td>
                    {isElevated && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleOpenEditModal(emp)}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleDelete(emp.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={isElevated ? 6 : 4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Popup */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsModalOpen(false)} 
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>
              {editMode ? 'Edit Employee Profile' : 'Add New Employee'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-input" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-input" required value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" required disabled={editMode} value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                {!editMode && (
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-input" required value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="Employee">Employee</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-input" placeholder="e.g. Engineering" value={department} onChange={e => setDepartment(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input type="text" className="form-input" placeholder="e.g. software Engineer" value={position} onChange={e => setPosition(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Joining Date</label>
                  <input type="date" className="form-input" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary (USD)</label>
                  <input type="number" className="form-input" placeholder="e.g. 85000" value={salary} onChange={e => setSalary(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px', marginBottom: '24px' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Profile Picture</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="profilePicInput"
                    style={{ display: 'none' }}
                    onChange={e => setProfilePic(e.target.files[0])} 
                  />
                  <label htmlFor="profilePicInput" className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer' }}>
                    <FileUp size={16} />
                    {profilePic ? profilePic.name.substring(0, 15) + '...' : 'Upload Image'}
                  </label>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Resume / CV</label>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    id="resumeInput"
                    style={{ display: 'none' }}
                    onChange={e => setResume(e.target.files[0])} 
                  />
                  <label htmlFor="resumeInput" className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer' }}>
                    <FileUp size={16} />
                    {resume ? resume.name.substring(0, 15) + '...' : 'Upload PDF'}
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
