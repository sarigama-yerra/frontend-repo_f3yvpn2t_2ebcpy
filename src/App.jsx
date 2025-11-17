import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || ''

function Section({ title, children, actions }) {
  return (
    <div className="bg-white/70 backdrop-blur rounded-xl shadow p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  )
}

export default function App() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState([])
  const [email, setEmail] = useState('ramy@azzam.health')
  const [cv, setCv] = useState(``)
  const [skills, setSkills] = useState('Digital health, AI governance, Telemedicine, ISO42001, Python, R, SQL, Program management')
  const [titles, setTitles] = useState('Chief Medical Officer, Medical Director, Digital Health, AI in healthcare')
  const [locations, setLocations] = useState('Dubai, UAE, Abu Dhabi, United Arab Emirates, Remote')

  const fetchProfile = async () => {
    try {
      const r = await fetch(`${API}/profile?email=${encodeURIComponent(email)}`)
      if (!r.ok) throw new Error('not found')
      const d = await r.json()
      setProfile(d)
      setCv(d.cv_text || '')
      setSkills((d.skills || []).join(', '))
      setTitles((d.target_titles || []).join(', '))
      setLocations((d.locations || []).join(', '))
    } catch (e) {
      setProfile(null)
    }
  }

  const saveProfile = async () => {
    setLoading(true)
    try {
      const payload = {
        full_name: 'Ramy Azzam',
        email,
        phone: '+971562963157',
        cv_text: cv,
        linkedin: 'https://linkedin.com/in/dr-ramy-azzam',
        website: 'https://azzam.health',
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        target_titles: titles.split(',').map(s => s.trim()).filter(Boolean),
        locations: locations.split(',').map(s => s.trim()).filter(Boolean),
        remote_ok: true,
      }
      const r = await fetch(`${API}/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await r.json()
      setProfile(d)
    } finally {
      setLoading(false)
    }
  }

  const ingestIndeed = async () => {
    setLoading(true)
    try {
      await fetch(`${API}/ingest/indeed?email=${encodeURIComponent(email)}`, { method: 'POST' })
    } finally {
      setLoading(false)
    }
  }

  const runMatch = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/match`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, top_n: 50 }) })
      const d = await r.json()
      setJobs(d.jobs || [])
    } finally {
      setLoading(false)
    }
  }

  const loadTop = async () => {
    const r = await fetch(`${API}/jobs?min_score=1&limit=50`)
    const d = await r.json()
    setJobs(d.jobs || [])
  }

  const apply = async (job_id) => {
    const r = await fetch(`${API}/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_id }) })
    const d = await r.json()
    alert(`${d.message} via ${d.channel} (${d.status})`)
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-cyan-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Auto Apply Dashboard</h1>
          <p className="text-gray-600">Set your profile, ingest jobs from UAE-focused sources, match, and queue applications.</p>
        </div>

        <Section
          title="Your Profile"
          actions={<button onClick={saveProfile} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded px-3 py-2"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Locations</label>
              <input value={locations} onChange={e=>setLocations(e.target.value)} className="mt-1 w-full border rounded px-3 py-2"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Target titles</label>
              <input value={titles} onChange={e=>setTitles(e.target.value)} className="mt-1 w-full border rounded px-3 py-2"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Skills</label>
              <input value={skills} onChange={e=>setSkills(e.target.value)} className="mt-1 w-full border rounded px-3 py-2"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700">CV Text</label>
              <textarea value={cv} onChange={e=>setCv(e.target.value)} rows={8} className="mt-1 w-full border rounded px-3 py-2"/>
            </div>
          </div>
        </Section>

        <Section
          title="Ingest Jobs"
          actions={
            <div className="space-x-2">
              <button onClick={ingestIndeed} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Ingest Indeed UAE</button>
              <button onClick={runMatch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Match</button>
              <button onClick={loadTop} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800">Load Top</button>
            </div>
          }
        >
          <p className="text-sm text-gray-600">We fetch UAE-focused roles from Indeed via RSS for your titles and locations, then score them against your skills and CV text.</p>
        </Section>

        <Section title="Top Matches">
          {jobs.length === 0 && (
            <p className="text-gray-600">No jobs yet. Ingest and match to see results.</p>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {jobs.map(j => (
              <div key={j._id} className="p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 pr-2">{j.title}</h3>
                  <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded">Score {j.matched_score ?? 0}</span>
                </div>
                <p className="text-sm text-gray-600">{j.company || 'Unknown'} • {j.location || 'UAE/Remote'}</p>
                <p className="text-xs text-gray-500 line-clamp-3 mt-2" dangerouslySetInnerHTML={{__html: j.description || ''}} />
                <div className="mt-3 flex items-center gap-2">
                  <a href={j.url} target="_blank" className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">View</a>
                  <button onClick={() => apply(j._id)} className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">Auto-Apply</button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {loading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white px-4 py-2 rounded shadow">Working...</div>
          </div>
        )}
      </div>
    </div>
  )
}
