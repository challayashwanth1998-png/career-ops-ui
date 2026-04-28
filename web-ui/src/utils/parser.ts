export interface Application {
  id: string;
  date: string;
  company: string;
  role: string;
  score: string;
  status: string;
  link: string;
}

export async function fetchApplications(): Promise<Application[]> {
  try {
    const res = await fetch('http://localhost:3001/api/tracker');
    const data = await res.json();
    
    if (!data.content) return [];
    
    const lines = data.content.split('\n');
    const apps: Application[] = [];
    
    let isTable = false;
    for (const line of lines) {
      if (line.trim().startsWith('|') && line.includes('Company')) {
        isTable = true;
        continue;
      }
      if (isTable && line.includes('---')) continue;
      
      if (isTable && line.trim().startsWith('|')) {
        const cols = line.split('|').map((c: string) => c.trim()).filter(Boolean);
        if (cols.length >= 6) {
          let reportPath = cols[7] || '';
          if (reportPath.includes('](')) {
            reportPath = reportPath.replace(/.*\]\((.*)\).*/, '$1');
          }
          
          apps.push({
            id: cols[0],
            date: cols[1],
            company: cols[2],
            role: cols[3],
            score: cols[4],
            status: cols[5],
            link: reportPath
          });
        }
      }
    }
    
    return apps.reverse(); // newest first
  } catch (err) {
    console.error(err);
    return [];
  }
}
