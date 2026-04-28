import { useState, useEffect } from 'react';
import { Key, Save, Check, FileText, Settings as SettingsIcon, X, Plus, RefreshCw } from 'lucide-react';

export default function Onboarding() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [savingConfig, setSavingConfig] = useState(false);
  const [savedConfig, setSavedConfig] = useState(false);

  const [resumeText, setResumeText] = useState('');
  const [cvSaved, setCvSaved] = useState(false);
  const [savingCv, setSavingCv] = useState(false);

  const [companies, setCompanies] = useState<{name: string; careers_url?: string; api?: string}[]>([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyUrl, setNewCompanyUrl] = useState('');

  const [keywords, setKeywords] = useState<string[]>([]);
  const [negativeKeywords, setNegativeKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [savingPortals, setSavingPortals] = useState(false);
  const [savedPortals, setSavedPortals] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.GEMINI_API_KEY || data.apiKey) setApiKey(data.GEMINI_API_KEY || data.apiKey);
        if (data.GEMINI_MODEL || data.model) setModel(data.GEMINI_MODEL || data.model);
        if (data.resume) setResumeText(data.resume);
        if (data.resume) setResumeText(data.resume);
      }).catch(console.error);

    fetchStructuredPortals();
  }, []);

  const fetchStructuredPortals = () => {
    fetch('http://localhost:3001/api/portals/structured')
      .then(res => res.json())
      .then(data => {
        if (data.companies) setCompanies(data.companies);
        if (data.positive) setKeywords(data.positive);
        if (data.negative) setNegativeKeywords(data.negative);
      }).catch(console.error);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true); setSavedConfig(false);
    try {
      await fetch('http://localhost:3001/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ GEMINI_API_KEY: apiKey, GEMINI_MODEL: model })
      });
      setSavedConfig(true); setTimeout(() => setSavedConfig(false), 3000);
    } finally { setSavingConfig(false); }
  };

  const handleSaveCV = async () => {
    if (!resumeText) return;
    setSavingCv(true); setCvSaved(false);
    try {
      await fetch('http://localhost:3001/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: resumeText })
      });
      setCvSaved(true); setTimeout(() => setCvSaved(false), 3000);
    } finally { setSavingCv(false); }
  };

  const handleSavePortals = async () => {
    setSavingPortals(true); setSavedPortals(false);
    try {
      await fetch('http://localhost:3001/api/portals/structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies, positive: keywords, negative: negativeKeywords })
      });
      setSavedPortals(true); setTimeout(() => setSavedPortals(false), 3000);
    } finally { setSavingPortals(false); }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (k: string) => {
    setKeywords(keywords.filter(kw => kw !== k));
  };

  const handleAddCompany = () => {
    if (newCompanyName.trim() && newCompanyUrl.trim()) {
      let isApi = newCompanyUrl.includes('api');
      setCompanies([...companies, {
        name: newCompanyName.trim(),
        [isApi ? 'api' : 'careers_url']: newCompanyUrl.trim()
      }]);
      setNewCompanyName('');
      setNewCompanyUrl('');
    }
  };

  const handleRemoveCompany = (name: string) => {
    setCompanies(companies.filter(c => c.name !== name));
  };

  const handleResetPortals = async () => {
    if (!confirm('Are you sure you want to reset target companies and keywords to the system default template?')) return;
    setResetting(true);
    try {
      await fetch('http://localhost:3001/api/portals/reset', { method: 'POST' });
      fetchStructuredPortals();
    } finally { setResetting(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Onboarding & Configuration</h1>
        <p>Set up your API keys, Resume (CV), and target roles.</p>
      </div>

      <div className="grid-3" style={{gridTemplateColumns: '1fr', maxWidth: '800px'}}>
        <div className="card glass">
          <h3 style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Key size={20} style={{color: 'var(--accent)'}}/> 
            Step 1: AI Provider Settings
          </h3>
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px'}}>
            Career-ops requires a Google Gemini API Key to run evaluations. If you hit a <b>429 Rate Limit</b> on the free tier, switch to a different model below!
          </p>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div>
              <label style={{fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px'}}>API Key</label>
              <input 
                type="password" className="input-field" placeholder="AIzaSy..." 
                value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div>
              <label style={{fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px'}}>Gemini Model</label>
              <select className="input-field" value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="gemini-2.0-flash">gemini-2.0-flash (Default, Free Tier Recommended)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fast, Free)</option>
                <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Faster, Free)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Expensive, Not Recommended)</option>
              </select>
            </div>
          </div>
          <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '24px'}}>
            <button className="btn" onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? 'Saving...' : savedConfig ? <><Check size={18} /> Saved!</> : <><Save size={18} /> Save Settings</>}
            </button>
          </div>
        </div>

        <div className="card glass">
          <h3 style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <FileText size={20} style={{color: 'var(--accent)'}}/> 
            Step 2: Upload Resume (CV)
          </h3>
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px'}}>
            Paste your resume below. The system works best with <b>Markdown</b>, but you can also paste Plain Text. (If you use LaTeX, simply paste the code and the agent will parse it).
          </p>
          
          <textarea 
            className="input-field" placeholder="# John Doe\n\n## Experience..." 
            value={resumeText} onChange={(e) => setResumeText(e.target.value)}
            style={{height: '250px', fontFamily: 'monospace'}}
          />
          <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '24px'}}>
            <button className="btn" onClick={handleSaveCV} disabled={savingCv || !resumeText}>
              {savingCv ? 'Saving...' : cvSaved ? <><Check size={18} /> Saved!</> : <><Save size={18} /> Save Resume</>}
            </button>
          </div>
        </div>

        <div className="card glass">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>
              <SettingsIcon size={20} style={{color: 'var(--accent)'}}/> 
              Step 3: Target Roles & Companies
            </h3>
            <button className="btn btn-secondary" onClick={handleResetPortals} disabled={resetting} style={{padding: '6px 12px', fontSize: '0.8rem'}}>
              <RefreshCw size={14} /> Reset Defaults
            </button>
          </div>
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px'}}>
            What job titles are you looking for? The scanner uses these keywords to filter thousands of jobs automatically so that you only see roles you care about.
          </p>
          
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', background: 'var(--input-bg)', padding: '12px', borderRadius: '8px'}}>
            {keywords.length === 0 ? <span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No target roles set. Add some below!</span> : null}
            {keywords.map((kw, idx) => (
              <span key={idx} style={{background: 'var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px'}}>
                {kw}
                <X size={14} style={{cursor: 'pointer', color: 'var(--text-muted)'}} onClick={() => handleRemoveKeyword(kw)} />
              </span>
            ))}
          </div>

          <div style={{display: 'flex', gap: '8px', marginBottom: '32px'}}>
            <input 
              type="text" className="input-field" placeholder="Add target role (e.g., Software Engineer)" 
              value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            />
            <button className="btn btn-secondary" onClick={handleAddKeyword}>
              <Plus size={18} /> Add
            </button>
          </div>

          <h4 style={{marginBottom: '12px', color: 'var(--text-main)'}}>Target Companies</h4>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px'}}>
            {companies.length === 0 ? <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No companies set. Add some below!</p> : null}
            {companies.map((c, idx) => (
              <div key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input-bg)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                <div>
                  <div style={{fontWeight: '600'}}>{c.name}</div>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{c.careers_url || c.api}</div>
                </div>
                <button className="btn btn-secondary" style={{padding: '6px', borderRadius: '50%'}} onClick={() => handleRemoveCompany(c.name)}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <input type="text" className="input-field" placeholder="Company Name" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} />
              <input type="text" className="input-field" placeholder="Careers URL or API endpoint" value={newCompanyUrl} onChange={(e) => setNewCompanyUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCompany()} />
            </div>
            <button className="btn btn-secondary" style={{height: '42px'}} onClick={handleAddCompany}>
              <Plus size={18} /> Add
            </button>
          </div>

          <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '32px'}}>
            <button className="btn" onClick={handleSavePortals} disabled={savingPortals}>
              {savingPortals ? 'Saving...' : savedPortals ? <><Check size={18} /> Saved!</> : <><Save size={18} /> Save Config</>}
            </button>
          </div>
        </div>


      </div>
    </div>
  );
}
