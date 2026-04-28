import { useEffect, useState } from 'react';
import { fetchApplications, type Application } from '../utils/parser';
import { X } from 'lucide-react';

export default function Tracker() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');

  useEffect(() => {
    fetchApplications().then(data => {
      setApps(data);
      setLoading(false);
    });
  }, []);

  const filteredApps = apps.filter(app => 
    app.company.toLowerCase().includes(search.toLowerCase()) || 
    app.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleApply = async (reportPath: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/report-url?path=${encodeURIComponent(reportPath)}`);
      const data = await res.json();
      
      if (data.answers) {
        setModalContent(data.answers);
        setShowModal(true);
      }
      
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert("Could not find job URL in the evaluation report.");
      }
    } catch (err) {
      console.error(err);
      alert("Error finding job URL.");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Application Tracker</h1>
        <p>Manage your evaluated applications and statuses.</p>
      </div>

      <div className="card glass">
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px'}}>
          <div style={{display: 'flex', gap: '12px', width: '300px'}}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search companies or roles..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p style={{color: 'var(--text-muted)'}}>Loading data...</p>
        ) : apps.length === 0 ? (
          <p style={{color: 'var(--text-muted)'}}>No applications found. Run evaluations to populate your tracker.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Company</th>
                <th>Role</th>
                <th>Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(app => (
                <tr key={app.id}>
                  <td>{app.id}</td>
                  <td>{app.date}</td>
                  <td>{app.company}</td>
                  <td>{app.role}</td>
                  <td>{app.score}</td>
                  <td>
                    <span className={`badge ${
                      app.status.toLowerCase().includes('evaluada') ? 'success' : 
                      app.status.toLowerCase().includes('pending') ? 'warning' : 'primary'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{padding: '6px 12px', fontSize: '0.8rem'}}
                      onClick={() => handleApply(app.link)}
                    >
                      Apply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}}>
          <div className="card glass" onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto', position: 'relative'}}>
            <button style={{position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer'}} onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            <h2 style={{marginBottom: '16px'}}>Application Helper</h2>
            <p style={{color: 'var(--text-muted)', marginBottom: '16px'}}>Use these drafted answers and stories while you fill out the application form.</p>
            <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-main)', background: 'var(--input-bg)', padding: '16px', borderRadius: '8px'}}>{modalContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
