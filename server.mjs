import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const ROOT = process.env.CAREER_OPS_ROOT || process.cwd();
const nodeBin = process.env.ELECTRON_RUN_AS_NODE ? process.execPath : 'node';

dotenv.config({ path: path.join(ROOT, '.env') });

app.post('/api/onboarding', (req, res) => {
  const { apiKey, model, resume, targetCompanies } = req.body;
  if (apiKey) {
    const envPath = path.join(ROOT, '.env');
    let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
    if (envContent.includes('GEMINI_API_KEY=')) envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${apiKey}`);
    else envContent += `\nGEMINI_API_KEY=${apiKey}`;
    if (model) {
      if (envContent.includes('GEMINI_MODEL=')) envContent = envContent.replace(/GEMINI_MODEL=.*/, `GEMINI_MODEL=${model}`);
      else envContent += `\nGEMINI_MODEL=${model}`;
    }
    writeFileSync(envPath, envContent.trim() + '\n');
  }
  if (resume) writeFileSync(path.join(ROOT, 'cv.md'), resume);
  if (targetCompanies) writeFileSync(path.join(ROOT, 'portals.yml'), targetCompanies);
  res.json({ success: true });
});

app.get('/api/config', (req, res) => {
  const envPath = path.join(ROOT, '.env');
  const cvPath = path.join(ROOT, 'cv.md');
  const portalsPath = path.join(ROOT, 'portals.yml');
  let apiKey = '', model = 'gemini-2.0-flash', resume = '', portals = '';
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    const keyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
    const modelMatch = envContent.match(/GEMINI_MODEL=(.*)/);
    if (keyMatch) apiKey = keyMatch[1];
    if (modelMatch) model = modelMatch[1];
  }
  if (existsSync(cvPath)) resume = readFileSync(cvPath, 'utf8');
  if (existsSync(portalsPath)) portals = readFileSync(portalsPath, 'utf8');
  res.json({ apiKey, model, resume, portals });
});
app.post('/api/cv', (req, res) => {
  const { latex } = req.body;
  if (!latex) return res.status(400).json({ error: 'No LaTeX content provided' });
  
  let md = latex
    .replace(/\\documentclass(?:\[[^\]]*\])?{[^}]*}/g, '')
    .replace(/\\usepackage(?:\[[^\]]*\])?{[^}]*}/g, '')
    .replace(/\\begin{document}/g, '')
    .replace(/\\end{document}/g, '')
    .replace(/\\section\*?{([^}]*)}/g, '\n## $1\n')
    .replace(/\\subsection\*?{([^}]*)}/g, '\n### $1\n')
    .replace(/\\textbf{([^}]*)}/g, '**$1**')
    .replace(/\\textit{([^}]*)}/g, '*$1*')
    .replace(/\\href{([^}]*)}{([^}]*)}/g, '[$2]($1)')
    .replace(/\\begin{itemize}/g, '\n')
    .replace(/\\end{itemize}/g, '\n')
    .replace(/\\item\s/g, '\n- ')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\n{3,}/g, '\n\n'); 

  try {
    writeFileSync(path.join(ROOT, 'cv.md'), md.trim());
    res.json({ success: true, markdown: md.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write cv.md', details: err.message });
  }
});

app.post('/api/evaluate', async (req, res) => {
  let { jd } = req.body;
  if (!jd) return res.status(400).json({ error: 'No Job Description provided' });
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({ error: 'GEMINI_API_KEY is not configured. Please go to Settings to add your key.' });
  }

  if (jd.trim().startsWith('http')) {
    try {
      const response = await fetch(jd.trim());
      jd = await response.text();
      jd = jd.replace(/<[^>]*>?/gm, ' ');
    } catch (e) {
      return res.status(400).json({ error: 'Could not fetch URL automatically. Please paste the job description text instead.' });
    }
  }
  
  const tmpPath = path.join(ROOT, 'tmp-jd.txt');
  try {
    writeFileSync(tmpPath, jd);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to write temporary file', details: err.message });
  }
  
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  exec(`"${nodeBin}" "${path.join(__dirname, 'gemini-eval.mjs')}" --file tmp-jd.txt --model ${modelName}`, { cwd: ROOT, env: process.env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(200).json({ error: stderr || stdout || error.message });
    }
    res.json({ output: stdout });
  });
});

app.get('/api/tracker', (req, res) => {
  const trackerPath = path.join(ROOT, 'data', 'applications.md');
  if (!existsSync(trackerPath)) return res.json({ data: [] });
  try {
    const content = readFileSync(trackerPath, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read tracker data' });
  }
});

app.post('/api/scan', (req, res) => {
  exec(`"${nodeBin}" "${path.join(__dirname, 'scan.mjs')}"`, { cwd: ROOT, env: process.env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: error.message, stderr, output: stdout });
    }
    res.json({ output: stdout });
  });
});

app.get('/api/portals/structured', (req, res) => {
  try {
    const content = readFileSync(path.join(ROOT, 'portals.yml'), 'utf8');
    const data = yaml.load(content);
    res.json({ companies: data.companies || [], positive: data.positive || [], negative: data.negative || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse portals.yml' });
  }
});

app.post('/api/portals/structured', (req, res) => {
  try {
    const newYaml = yaml.dump(req.body);
    writeFileSync(path.join(ROOT, 'portals.yml'), newYaml);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save portals.yml' });
  }
});

app.post('/api/portals/reset', (req, res) => {
  try {
    const tpl = readFileSync(path.join(ROOT, 'templates', 'portals.example.yml'));
    writeFileSync(path.join(ROOT, 'portals.yml'), tpl);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset' });
  }
});

app.get('/api/pipeline', (req, res) => {
  const pipelinePath = path.join(ROOT, 'data', 'pipeline.md');
  const historyPath = path.join(ROOT, 'data', 'scan-history.tsv');
  
  if (!existsSync(pipelinePath)) return res.json({ content: '', history: {} });
  
  const content = readFileSync(pipelinePath, 'utf8');
  let history = {};
  if (existsSync(historyPath)) {
    const lines = readFileSync(historyPath, 'utf8').split('\n');
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      if (parts.length >= 2) {
        history[parts[0]] = parts[1]; // url -> first_seen
      }
    }
  }
  
  res.json({ content, history });
});

app.post('/api/pipeline/clear', (req, res) => {
  const pipelinePath = path.join(ROOT, 'data', 'pipeline.md');
  const scanHistoryPath = path.join(ROOT, 'data', 'scan-history.tsv');
  try {
    if (existsSync(pipelinePath)) writeFileSync(pipelinePath, '');
    if (existsSync(scanHistoryPath)) writeFileSync(scanHistoryPath, 'url\tfirst_seen\tportal\ttitle\tcompany\tstatus\n');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear pipeline' });
  }
});

app.get('/api/report-url', (req, res) => {
  const { path: reportPathQuery } = req.query;
  if (!reportPathQuery) return res.json({ url: '' });
  
  const filename = path.basename(reportPathQuery);
  const fullPath = path.join(ROOT, 'reports', filename);
  
  if (existsSync(fullPath)) {
    const content = readFileSync(fullPath, 'utf8');
    const match = content.match(/\*\*URL:\*\*\s*(https?:\/\/[^\s]+)/);
    let answers = '';
    const answersMatch = content.match(/## H\).*?([\s\S]*?)(?:---|\n## )/i);
    if (answersMatch && answersMatch[1].trim().length > 10) {
      answers = answersMatch[1].trim();
    } else {
      // Fallback to section F if H doesn't exist
      const fMatch = content.match(/## F\).*?([\s\S]*?)(?:---|\n## )/i);
      if (fMatch) answers = fMatch[1].trim();
    }
    
    if (match) {
      return res.json({ url: match[1], answers });
    } else {
      return res.json({ url: '', answers });
    }
  }
  res.json({ url: '', answers: '' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Career-Ops Backend running on http://localhost:${PORT}`);
});
