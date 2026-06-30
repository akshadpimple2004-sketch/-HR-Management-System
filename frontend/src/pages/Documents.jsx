import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { FileDown, Trash2, Plus, X, Upload } from 'lucide-react';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('Offer Letter');
  const [employeeId, setEmployeeId] = useState('');
  const [docFile, setDocFile] = useState(null);

  const isElevated = ['Admin', 'HR Manager'].includes(user?.role);

  useEffect(() => {
    fetchDocuments();
    if (isElevated) {
      fetchEmployees();
    }
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees list:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document from server tracking?')) {
      try {
        await axios.delete(`/api/documents/${id}`);
        fetchDocuments();
      } catch (error) {
        alert('Failed to delete document.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docFile) return alert('Please select a file to upload.');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('document_type', docType);
    formData.append('employee_id', isElevated ? employeeId : user.employee_id);
    formData.append('document_file', docFile);

    try {
      await axios.post('/api/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsModalOpen(false);
      setTitle('');
      setEmployeeId('');
      setDocFile(null);
      fetchDocuments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload document.');
    }
  };

  return (
    <div>
      <Header title="Documents" />

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          Upload Document
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading document ledger...</div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Type</th>
                  {isElevated && <th>Assigned Employee</th>}
                  <th>Uploaded At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600 }}>{doc.title}</td>
                    <td>
                      <span className="badge badge-employee" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                        {doc.document_type}
                      </span>
                    </td>
                    {isElevated && (
                      <td>{doc.first_name ? `${doc.first_name} ${doc.last_name}` : 'Corporate General'}</td>
                    )}
                    <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a 
                          href={doc.document_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-secondary" 
                          style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
                        >
                          <FileDown size={16} />
                        </a>
                        {isElevated && (
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={isElevated ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                      No documents stored in ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
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
            maxWidth: '500px',
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
              Upload Corporate Document
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="e.g. Offer Letter Q3" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Document Type</label>
                <select className="form-input" value={docType} onChange={e => setDocType(e.target.value)}>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Resume">Resume</option>
                  <option value="Contract">Contract</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {isElevated && (
                <div className="form-group">
                  <label className="form-label">Assign to Employee</label>
                  <select className="form-input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                    <option value="">Corporate General (No Employee)</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ margin: '24px 0' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Select File</label>
                <input 
                  type="file" 
                  id="documentFileInput"
                  style={{ display: 'none' }}
                  onChange={e => setDocFile(e.target.files[0])} 
                />
                <label htmlFor="documentFileInput" className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer' }}>
                  <Upload size={16} />
                  {docFile ? docFile.name : 'Choose File'}
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Upload Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
