import { useState, useEffect } from 'react';
import { Search, ExternalLink, FileSearch, X } from 'lucide-react';

interface PipelineJob {
  company: string;
  role: string;
  url: string;
  date?: string;
  isNew?: boolean;
}

export default function ScanPortals() {
  const [scanning, setScanning] = useState(false);
  const [pipelineJobs, setPipelineJobs] = useState<PipelineJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [evaluating, setEvaluating] = useState<string | null>(null);

  const fetchPipeline = (oldUrls?: string[]) => {
    setLoading(true);
    fetch('http://localhost:3001/api/pipeline')
      .then(res => res.json())
      .then(data => {
        if (!data.content) {
          setPipelineJobs([]);
          return;
        }
        const lines = data.content.split('\n');
        const jobs: PipelineJob[] = [];
        for (const line of lines) {
          if (line.trim().startsWith('- [ ]')) {
            const parts = line.replace('- [ ]', '').split('|');
            if (parts.length >= 3) {
              const url = parts[0].trim();
              const company = parts[1].trim();
              const role = parts.slice(2).join('|').trim();
              
              let isNew = false;
              if (oldUrls && !oldUrls.includes(url)) {
                isNew = true;
              }
              
              const history = data.history || {};
              let dateStr = history[url];
              let date = 'Unknown';
              if (dateStr) {
                date = new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }

              jobs.push({ url, company, role, date, isNew });
            }
          }
        }
        // Reverse to put newest on top
        setPipelineJobs(jobs.reverse());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  useEffect(() => {
    let interval: any;
    if (scanning) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(p => Math.min(p + (90 - p) * 0.1, 90));
      }, 1000);
    } else {
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 1000);
      return () => clearTimeout(timer);
    }
    return () => clearInterval(interval);
  }, [scanning]);

  const handleScan = async () => {
    setScanning(true);
    const oldUrls = pipelineJobs.map(j => j.url);
    try {
      const res = await fetch('http://localhost:3001/api/scan', { method: 'POST' });
      const data = await res.json();
      setModalTitle("Portal Scan Complete");
      const cleanContent = (data.output || data.error).replace(/\x1b\[[0-9;]*m/g, '');
      setModalContent(cleanContent);
      setShowModal(true);
      fetchPipeline(oldUrls);
    } catch (err) {
      setModalTitle("Error");
      setModalContent("Failed to run scan.");
      setShowModal(true);
    } finally {
      setScanning(false);
    }
  };

  const handleClearJobs = async () => {
    if (!confirm('Are you sure you want to clear all jobs in the pipeline?')) return;
    try {
      await fetch('http://localhost:3001/api/pipeline/clear', { method: 'POST' });
      setPipelineJobs([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEvaluate = async (url: string) => {
    setEvaluating(url);
    try {
      const res = await fetch('http://localhost:3001/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: url })
      });
      const data = await res.json();
      setModalTitle("Evaluation Result");
      const cleanContent = (data.output || data.error || "").replace(/\x1b\[[0-9;]*m/g, '');
      setModalContent(cleanContent);
      setShowModal(true);
    } catch (err) {
      setModalTitle("Error");
      setModalContent("Failed to evaluate job.");
      setShowModal(true);
    } finally {
      setEvaluating(null);
    }
  };

  return (
    <div className="animate-fade-in relative">
      <div className="header">
        <h1>Scan Portals</h1>
        <p>Run the scanner to find new jobs and build your pending pipeline.</p>
      </div>

      <div className="card glass" style={{marginBottom: '32px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h3 style={{marginBottom: '8px'}}>Start a New Scan</h3>
            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>
              This will hit the APIs defined in your target companies and find new active roles based on your keywords.
            </p>
          </div>
          <div style={{display: 'flex', gap: '12px'}}>
            <button className="btn btn-secondary" onClick={handleClearJobs}>
              Clear Jobs
            </button>
            <button className="btn" onClick={handleScan} disabled={scanning}>
              <Search size={18} /> {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {(scanning || progress > 0) && (
          <div style={{width: '100%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', marginTop: '16px'}}>
            <div style={{
              width: `${progress}%`, 
              height: '100%', 
              background: 'var(--accent)', 
              transition: progress === 0 ? 'none' : 'width 1s ease-out'
            }} />
          </div>
        )}
      </div>

      <div className="card glass">
        <h3 style={{marginBottom: '16px'}}>Pending Jobs Pipeline</h3>
        {loading ? (
          <p style={{color: 'var(--text-muted)'}}>Loading pipeline...</p>
        ) : pipelineJobs.length === 0 ? (
          <p style={{color: 'var(--text-muted)'}}>No pending jobs found. Run a scan to find some!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Post Date</th>
                <th>Company</th>
                <th>Role</th>
                <th>Link</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pipelineJobs.map((job, i) => (
                <tr key={i}>
                  <td style={{color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap'}}>{job.date}</td>
                  <td style={{fontWeight: '500'}}>{job.company}</td>
                  <td>
                    {job.role}
                    {job.isNew && (
                      <span className="badge success" style={{marginLeft: '8px'}}>New</span>
                    )}
                  </td>
                  <td>
                    <a href={job.url} target="_blank" rel="noreferrer" style={{color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none'}}>
                      View <ExternalLink size={14} />
                    </a>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{padding: '6px 12px', fontSize: '0.8rem'}} 
                      onClick={() => handleEvaluate(job.url)}
                      disabled={evaluating === job.url}
                    >
                      {evaluating === job.url ? 'Evaluating...' : <><FileSearch size={14} /> Evaluate</>}
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
            <h2 style={{marginBottom: '16px'}}>{modalTitle}</h2>
            <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text)'}}>{modalContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
