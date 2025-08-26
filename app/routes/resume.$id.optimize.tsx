// Due to scope, this update adds design controls, sections reorder, and undo/redo.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import Navbar from '~/components/Navbar';
import { useAuth } from '~/contexts/AuthContext';

interface ResumeDoc {
  id: string;
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
  feedback: any;
  originalFile?: string | null;
}

const FONTS = [
  { id: 'system', name: 'System (Inter/UI Sans)' , css: 'ui-sans-serif,system-ui' },
  { id: 'serif', name: 'Serif', css: 'Georgia, Cambria, Times New Roman, serif' },
  { id: 'mono', name: 'Monospace', css: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
];

function renderTemplateHTML(template: string, content: string, size: 'a4'|'letter', fontCss: string, branding: boolean) {
  const pageCss = size==='a4' ? 'A4' : 'Letter';
  const base = `@page{size:${pageCss};margin:1in} body{font-family:${fontCss};line-height:1.5}`;
  const safe = content.replace(/</g, '&lt;');
  const footer = branding ? `<div style='margin-top:16px;color:#9ca3af;font-size:12px'>Generated with Resumind</div>` : '';
  if (template === 'double') {
    return `<style>${base} .wrap{display:grid;grid-template-columns:2fr 1fr;gap:24px} .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px} h1{font-size:22px;margin:0 0 8px} h2{font-size:14px;color:#374151;margin:16px 0 8px}</style><div class='wrap'><div class='card'><h1>ATS Resume</h1><div>${safe}${footer}</div></div><div class='card'><h2>Keywords</h2><div style='color:#6b7280;font-size:12px'>Ensure job‑relevant keywords appear naturally.</div></div></div>`;
  }
  if (template === 'ivy') {
    return `<style>${base} .wrap{max-width:820px;margin:auto} .hdr{border-left:6px solid #2563eb;padding-left:12px} .sec{margin:18px 0} .sec h2{letter-spacing:.06em;color:#374151;font-size:13px}</style><div class='wrap'><div class='hdr'><h1 style='margin:0'>ATS Resume</h1><div style='color:#6b7280'>Tailored for ${size.toUpperCase()}</div></div><div class='sec'><h2>Profile</h2><div>${safe}</div></div>${footer}</div>`;
  }
  if (template === 'modern') {
    return `<style>${base} .wrap{display:flex;gap:20px} .left{flex:1;background:#f9fafb;border-radius:12px;padding:16px} .right{width:260px;background:#111827;color:#e5e7eb;border-radius:12px;padding:16px} h1{font-size:20px;margin:0 0 12px}</style><div class='wrap'><div class='left'><h1>ATS Resume</h1><div>${safe}${footer}</div></div><div class='right'><div style='font-weight:600;margin-bottom:8px'>Highlights</div><div style='font-size:12px;opacity:.9'>Keep skills concise and scannable.</div></div></div>`;
  }
  if (template === 'polished') {
    return `<style>${base} .wrap{max-width:820px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;padding:20px} .title{font-size:22px;margin:0 0 10px} .muted{color:#6b7280}</style><div class='wrap'><div class='title'>ATS Resume</div><div class='muted'>Formatted template: Polished</div><div>${safe}</div>${footer}</div>`;
  }
  if (template === 'classic') {
    return `<style>${base} .wrap{max-width:820px;margin:auto} h1{font-size:24px;margin:0 0 6px} .hr{height:1px;background:#e5e7eb;margin:10px 0} pre{white-space:pre-wrap}</style><div class='wrap'><h1>ATS Resume</h1><div class='hr'></div><pre>${safe}</pre>${footer}</div>`;
  }
  if (template === 'compact') {
    return `<style>${base} .wrap{max-width:820px;margin:auto} .card{border:1px solid #e5e7eb;border-radius:10px;padding:12px} h1{font-size:18px;margin:0 0 6px}</style><div class='wrap'><div class='card'><h1>ATS Resume (Compact)</h1><div>${safe}</div>${footer}</div></div>`;
  }
  // elegant default
  return `<style>${base} .wrap{max-width:820px;margin:auto} .sep{height:3px;background:#dbeafe;border-radius:99px;margin:12px 0} h1{font-size:22px;margin:0 0 8px}</style><div class='wrap'><h1>ATS Resume</h1><div class='sep'></div><div>${safe}</div>${footer}</div>`;
}

// Helper: split resume text into sections based on common headers
function splitSections(text: string) {
  const headerRe = /^(summary|profile|skills|experience|work experience|projects|education|achievements|certifications)\b/i;
  const lines = (text || '').split(/\n/);
  const sections: { title: string; body: string }[] = [];
  let currentTitle = 'Summary';
  let currentBody: string[] = [];
  for (const line of lines) {
    if (headerRe.test(line.trim())) {
      if (currentBody.length) sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
      currentTitle = line.trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentBody.length) sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
  return sections;
}

// Helper: join sections back into single string
function joinSections(sections: { title: string; body: string }[]) {
  return (sections || []).map(s => `${s.title}\n${s.body}`.trim()).join('\n\n');
}

export default function OptimizeResume() {
  const { id } = useParams();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<ResumeDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'original' | 'ats'>('ats');
  const [template, setTemplate] = useState<string>('elegant');
  const [docSize, setDocSize] = useState<'a4' | 'letter'>('a4');
  const [font, setFont] = useState<string>(FONTS[0].css);
  const [branding, setBranding] = useState<boolean>(true);
  const [improved, setImproved] = useState<string>('');
  const [edited, setEdited] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [sections, setSections] = useState<{ title: string; body: string }[]>([]);
  const [jd, setJd] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [redo, setRedo] = useState<string[]>([]);

  const pushHistory = (val: string) => setHistory(prev => [...prev.slice(-19), val]);
  const undo = () => {
    setHistory(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setRedo(r => [edited, ...r].slice(0, 20));
      setEdited(last);
      return prev.slice(0, -1);
    });
  };
  const redoAction = () => {
    setRedo(prev => {
      if (!prev.length) return prev;
      const first = prev[0];
      pushHistory(edited);
      setEdited(first);
      return prev.slice(1);
    });
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    (async () => {
      try {
        const res = await fetch(`/api/resume/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setDoc(data);
        setJd(data.jobDescription || '');
        setEdited(data.resumeText || '');
        // init sections
        const parts = splitSections(data.resumeText || '');
        setSections(parts);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally { setLoading(false); }
    })();
  }, [id, isAuthenticated, token, navigate]);

  const liveScore = useMemo(() => doc?.feedback?.overallScore ?? 0, [doc]);

  const analyze = async () => {
    setReanalyzing(true);
    try {
      const fd = new FormData();
      fd.append('resumeId', id as string);
      fd.append('jobDescription', jd);
      const resp = await fetch('/api/resume/reanalyze', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j.error || 'Analyze failed');
      setDoc(prev => prev ? { ...prev, jobDescription: jd, feedback: j.feedback } : prev);
    } catch (e) {
      console.error(e);
    } finally { setReanalyzing(false); }
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    setSections(prev => {
      const next = [...prev];
      const j = idx + dir; if (j<0 || j>=next.length) return prev;
      const tmp = next[idx]; next[idx]=next[j]; next[j]=tmp; return next;
    });
  };

  useEffect(() => {
    if (mode==='ats') setEdited(joinSections(sections));
  }, [sections, mode]);

  if (loading) {
    return (<main className="bg-[url('/images/bg-main.svg')] bg-cover"><Navbar /><div className="main-section">Loading…</div></main>);
  }
  if (error || !doc) {
    return (<main className="bg-[url('/images/bg-main.svg')] bg-cover"><Navbar /><div className="main-section">{error || 'Not found'}</div></main>);
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <div className="main-section">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-[200px_260px_1fr] gap-6">
          {/* Tools rail */}
          <aside className="bg-white rounded-xl border p-3 h-fit space-y-3 text-sm">
            <div className="font-semibold">ATS Tools</div>
            <button className="white-button w-full py-2" onClick={()=>setSections(prev=>[{title:'New Section',body:'Describe here...'},...prev])}>Add section</button>
            <button className="white-button w-full py-2" onClick={()=>setMode('ats')}>Rearrange</button>
            <div>
              <div className="text-xs text-gray-500 mb-1">Templates</div>
              <select value={template} onChange={(e)=>setTemplate(e.target.value)} className="w-full border rounded px-2 py-1">
                <option value="elegant">Elegant</option>
                <option value="double">Double column</option>
                <option value="ivy">Ivy League</option>
                <option value="modern">Modern</option>
                <option value="polished">Polished</option>
                <option value="classic">Classic</option>
                <option value="compact">Compact</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Design & Font</div>
              <select value={font} onChange={(e)=>setFont(e.target.value)} className="w-full border rounded px-2 py-1">
                {FONTS.map(f=>(<option key={f.id} value={f.css}>{f.name}</option>))}
              </select>
            </div>
            <div className="flex gap-2">
              <button className="white-button w-full py-2" onClick={undo}>Undo</button>
              <button className="white-button w-full py-2" onClick={redoAction}>Redo</button>
            </div>
            <button className="white-button w-full py-2" onClick={analyze}>Checker</button>
            <button className="white-button w-full py-2" onClick={()=>window.print()}>Download</button>
            <button className="white-button w-full py-2" onClick={()=>{navigator.clipboard.writeText(window.location.href)}}>Share</button>
            <div className="flex items-center justify-between text-xs"><span>Branding</span><input type="checkbox" checked={branding} onChange={(e)=>setBranding(e.target.checked)} /></div>
          </aside>

          {/* ATS check panel */}
          <aside className="bg-white rounded-xl border p-4 h-fit">
            <div className="text-sm font-semibold text-gray-800">ATS Check</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{liveScore}/100</div>
            <div className="mt-4 text-xs text-gray-600">Job Description</div>
            <textarea value={jd} onChange={(e)=>setJd(e.target.value)} rows={5} className="w-full mt-1 p-2 border rounded" placeholder="Paste the job description here" />
            <button onClick={analyze} disabled={reanalyzing} className="mt-2 primary-button w-full">{reanalyzing?'Analyzing…':'Analyze'}</button>
            {/* Sections reorder */}
            <div className="mt-4 text-sm font-medium">Resume Sections</div>
            <div className="mt-2 space-y-2">
              {sections.map((s,i)=> (
                <div key={i} className="flex items-center justify-between border rounded px-2 py-1 text-xs">
                  <span className="truncate max-w-[140px]">{s.title}</span>
                  <div className="flex gap-1">
                    <button className="white-button px-2 py-1" onClick={()=>moveSection(i,-1)}>↑</button>
                    <button className="white-button px-2 py-1" onClick={()=>moveSection(i,1)}>↓</button>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Canvas */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className={`px-3 py-2 rounded-lg cursor-pointer ${mode==='original'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`} onClick={()=>setMode('original')}>Original</div>
              <div className={`px-3 py-2 rounded-lg cursor-pointer ${mode==='ats'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`} onClick={()=>setMode('ats')}>ATS‑friendly</div>
              <div className="ml-auto flex items-center gap-2 text-xs">
                <button className={`px-2 py-1 rounded border ${docSize==='a4'?'border-blue-600 text-blue-700 bg-blue-50':'border-gray-200'}`} onClick={()=>setDocSize('a4')}>A4</button>
                <button className={`px-2 py-1 rounded border ${docSize==='letter'?'border-blue-600 text-blue-700 bg-blue-50':'border-gray-200'}`} onClick={()=>setDocSize('letter')}>US Letter</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-2 border-b bg-gray-50 text-sm font-medium">Uploaded Preview</div>
                {doc.originalFile ? (
                  <div className="h-[720px] bg-gray-100"><embed src={doc.originalFile} type="application/pdf" className="w-full h-full" /></div>
                ) : (
                  <div className="p-4 h-[720px] overflow-auto whitespace-pre-wrap text-sm text-gray-800">{doc.resumeText}</div>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-2 border-b bg-gray-50 text-sm font-medium">ATS‑friendly (editable/preview)</div>
                <div className="h-[720px]">
                  {mode==='ats' && showPreview ? (
                    <div className="p-0 h-full overflow-auto bg-white" dangerouslySetInnerHTML={{ __html: renderTemplateHTML(template, edited || improved || doc.resumeText, docSize, font, branding) }} />
                  ) : mode==='ats' ? (
                    <textarea ref={editRef} className="w-full p-4 h-full resize-none outline-none text-sm" value={edited} onChange={(e)=>{pushHistory(edited); setEdited(e.target.value);}} placeholder="Edit the ATS version here" />
                  ) : (
                    <div className="p-4 h-full overflow-auto whitespace-pre-wrap text-sm text-gray-800">{doc.resumeText}</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
