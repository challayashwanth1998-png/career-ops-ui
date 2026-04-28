import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle, Clock } from 'lucide-react';
import { fetchApplications, type Application } from '../utils/parser';

export default function Dashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications().then(data => {
      setApps(data);
      setLoading(false);
    });
  }, []);

  const pending = apps.filter(a => a.status.toLowerCase().includes('pending') || a.status.toLowerCase().includes('evaluar')).length;
  const evaluated = apps.filter(a => a.status.toLowerCase().includes('evaluada')).length;
  const submitted = apps.filter(a => a.status.toLowerCase().includes('applied') || a.status.toLowerCase().includes('aplicado')).length;

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Dashboard</h1>
        <p>Overview of your job search pipeline.</p>
      </div>

      <div className="grid-3">
        <div className="card glass">
          <div className="stat-label">Pending Reviews</div>
          <div className="stat-value" style={{color: 'var(--accent)'}}>{loading ? '-' : pending}</div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.875rem'}}>
            <Clock size={16} /> Needs your attention
          </div>
        </div>
        <div className="card glass">
          <div className="stat-label">Evaluated Offers</div>
          <div className="stat-value">{loading ? '-' : evaluated}</div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.875rem'}}>
            <Briefcase size={16} /> Scored by AI
          </div>
        </div>
        <div className="card glass">
          <div className="stat-label">Applications Submitted</div>
          <div className="stat-value" style={{color: 'var(--success)'}}>{loading ? '-' : submitted}</div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.875rem'}}>
            <CheckCircle size={16} /> Human verified
          </div>
        </div>
      </div>

      <div className="card glass">
        <h3 style={{marginBottom: '16px'}}>Recent Activity</h3>
        {loading ? (
          <p style={{color: 'var(--text-muted)'}}>Loading data...</p>
        ) : apps.length === 0 ? (
          <p style={{color: 'var(--text-muted)'}}>No applications found. Use the Evaluate page to add some!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.slice(0, 5).map(app => (
                <tr key={app.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
