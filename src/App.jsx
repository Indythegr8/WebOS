import { useEffect, useState } from 'react'
import { api } from './api'
import {
  ArrowLeft,
  CalendarDays,
  Calculator,
  ChevronRight,
  ExternalLink,
  Globe2,
  LockKeyhole,
  LogOut,
  Menu,
  Minus,
  Monitor,
  NotebookPen,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

const apps = [
  { id: 'notes', label: 'Notes', icon: NotebookPen, color: 'coral' },
  { id: 'browser', label: 'Browser', icon: Globe2, color: 'sky' },
  { id: 'calculator', label: 'Calculator', icon: Calculator, color: 'gold' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, color: 'mint' },
]

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [openApps, setOpenApps] = useState([])
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [notesError, setNotesError] = useState('')
  const [now, setNow] = useState(new Date())

  async function loadNotes() {
    setNotesLoading(true)
    setNotesError('')
    try { setNotes(await api.getNotes()) } catch (error) { setNotesError(error.message) } finally { setNotesLoading(false) }
  }

  useEffect(() => { if (loggedIn) loadNotes() }, [loggedIn])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function login(event) {
    event.preventDefault()
    setLoginBusy(true)
    try {
      await api.login('Ishan', password)
      setLoggedIn(true)
      setLoginError('')
    } catch (error) { setLoginError(error.message) } finally { setLoginBusy(false) }
  }

  function toggleApp(id) {
    setOpenApps((current) => current.includes(id) ? current.filter((app) => app !== id) : [...current, id])
  }

  if (!loggedIn) {
    return (
      <main className="login-screen">
        <div className="login-glow glow-one" />
        <div className="login-glow glow-two" />
        <section className="login-card">
          <div className="avatar">I</div>
          <p className="eyebrow">PERSONAL COMPUTER</p>
          <h1>Welcome back, Ishan</h1>
          <p className="login-subtitle">Sign in to continue to your workspace.</p>
          <form onSubmit={login}>
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <LockKeyhole size={16} />
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoFocus />
            </div>
            {loginError && <p className="form-error">{loginError}</p>}
            <button className="primary-button" type="submit" disabled={loginBusy}>{loginBusy ? 'Signing in...' : <>Sign in <ChevronRight size={17} /></>}</button>
          </form>
          <p className="login-footer">WebOS 01.01 · Local session</p>
        </section>
      </main>
    )
  }

  return (
    <main className="desktop">
      <header className="top-bar">
        <div className="brand"><Monitor size={18} /> WebOS</div>
        <p>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} <span>·</span> {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
        <button className="icon-button" title="Sign out" onClick={() => { api.logout(); setLoggedIn(false) }}><LogOut size={17} /></button>
      </header>
      <section className="desktop-content">
        <div className="welcome-copy">
          <p className="eyebrow">GOOD MORNING, ISHAN</p>
          <h1>A quiet place<br /><em>to get things done.</em></h1>
          <p className="desktop-hint">Open an app from the dock to begin.</p>
        </div>
        <div className="desktop-orbit"><Sparkles size={20} /><span>Local<br />workspace</span></div>
      </section>
      {openApps.map((id) => <Window key={id} id={id} notes={notes} setNotes={setNotes} notesLoading={notesLoading} notesError={notesError} retryNotes={loadNotes} now={now} close={() => toggleApp(id)} />)}
      <footer className="dock-wrap">
        <nav className="dock">
          <button className="start-button" title="Start menu"><Menu size={20} /></button>
          <span className="dock-divider" />
          {apps.map(({ id, label, icon: Icon, color }) => (
            <button key={id} className={`dock-app ${openApps.includes(id) ? 'active' : ''}`} onClick={() => toggleApp(id)} title={label}>
              <span className={`app-icon ${color}`}><Icon size={20} /></span>
              <span className="dock-label">{label}</span>
            </button>
          ))}
          <span className="dock-divider" />
          <button className="dock-app" title="Settings"><span className="app-icon slate"><Settings size={20} /></span></button>
        </nav>
      </footer>
    </main>
  )
}

function Window({ id, notes, setNotes, notesLoading, notesError, retryNotes, now, close }) {
  const app = apps.find((item) => item.id === id)
  const Icon = app.icon
  return (
    <section className={`app-window window-${id}`}>
      <header className="window-header"><span><Icon size={16} /> {app.label}</span><div><button title="Minimize"><Minus size={15} /></button><button title="Close" onClick={close}><X size={15} /></button></div></header>
      {id === 'notes' && <Notes notes={notes} setNotes={setNotes} loading={notesLoading} error={notesError} retry={retryNotes} />}
      {id === 'browser' && <Browser />}
      {id === 'calculator' && <CalculatorApp />}
      {id === 'calendar' && <CalendarApp now={now} />}
    </section>
  )
}

function Notes({ notes, setNotes, loading, error, retry }) {
  const [selected, setSelected] = useState(notes[0]?.id)
  const [saveState, setSaveState] = useState('')
  const current = notes.find((note) => note.id === selected) || notes[0]
  useEffect(() => {
    if (!selected && notes[0]) setSelected(notes[0].id)
  }, [notes, selected])

  function updateNote(field, value) {
    setNotes(notes.map((note) => note.id === current.id ? { ...note, [field]: value } : note))
  }
  async function saveNote() {
    if (!current) return
    setSaveState('Saving...')
    try { await api.saveNote(current); setSaveState('Saved') } catch (error) { setSaveState(error.message) }
  }
  async function addNote() {
    try {
      const note = await api.createNote({ title: 'Untitled note', body: '' })
      setNotes([...notes, note]); setSelected(note.id)
    } catch (error) { setSaveState(error.message) }
  }
  async function deleteNote() {
    if (!current) return
    try { await api.deleteNote(current.id); const next = notes.filter((note) => note.id !== current.id); setNotes(next); setSelected(next[0]?.id) } catch (error) { setSaveState(error.message) }
  }
  if (loading) return <div className="app-state">Loading notes...</div>
  if (error) return <div className="app-state"><p>{error}</p><button className="small-action" onClick={retry}>Retry</button></div>
  return <div className="notes-app"><aside><div className="notes-sidebar-heading"><span>My notes</span><div><button title="New note" onClick={addNote}><Plus size={15} /></button><button title="Delete note" onClick={deleteNote} disabled={!current}><Trash2 size={14} /></button></div></div>{notes.map((note) => <button className={note.id === current?.id ? 'selected' : ''} key={note.id} onClick={() => setSelected(note.id)}>{note.title || 'Untitled note'}</button>)}</aside><article>{current ? <><div className="note-status">{saveState}</div><input className="note-title" value={current.title} onChange={(event) => updateNote('title', event.target.value)} onBlur={saveNote} /><textarea value={current.body} onChange={(event) => updateNote('body', event.target.value)} onBlur={saveNote} /></> : <p className="empty-note">Create a note to get started.</p>}</article></div>
}

function Browser() {
  const [address, setAddress] = useState('https://example.com')
  const [url, setUrl] = useState('https://example.com')
  function navigate(event) {
    event.preventDefault()
    const next = address.startsWith('http') ? address : `https://${address}`
    setAddress(next)
    setUrl(next)
  }
  return <div className="browser-app"><form className="browser-toolbar" onSubmit={navigate}><button type="button" title="Back"><ArrowLeft size={15} /></button><div className="address"><LockKeyhole size={13} /><input value={address} onChange={(event) => setAddress(event.target.value)} aria-label="Web address" /></div><button className="go-button" type="submit">Go</button><button type="button" title="Open in system browser" onClick={() => window.open(url, '_blank')}><ExternalLink size={15} /></button></form><div className="browser-frame"><iframe title="WebOS browser" src={url} /></div><div className="browser-notice"><Globe2 size={14} /> Some websites block embedding. Use <button onClick={() => window.open(url, '_blank')}>Open in your browser</button> for those pages.</div></div>
}

function CalculatorApp() {
  const [value, setValue] = useState('0')
  const buttons = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+']
  function calculate(expression) {
    const tokens = expression.match(/\d+(?:\.\d+)?|[+\-*/]/g)
    if (!tokens || tokens.join('') !== expression || /[+\-*/]$/.test(expression)) throw new Error('Invalid expression')
    const values = []
    const operators = []
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 }
    const apply = () => { const operator = operators.pop(); const right = values.pop(); const left = values.pop(); if (operator === '/' && right === 0) throw new Error('Cannot divide by zero'); values.push({ '+': left + right, '-': left - right, '*': left * right, '/': left / right }[operator]) }
    tokens.forEach((token) => { if (!Number.isNaN(Number(token))) values.push(Number(token)); else { while (operators.length && precedence[operators.at(-1)] >= precedence[token]) apply(); operators.push(token) } })
    while (operators.length) apply()
    if (values.length !== 1 || !Number.isFinite(values[0])) throw new Error('Invalid expression')
    return String(values[0])
  }
  function press(button) { if (button === '=') { try { setValue(calculate(value)) } catch { setValue('Error') } } else setValue(value === '0' || value === 'Error' ? button : value + button) }
  return <div className="calculator-app"><div className="calc-display">{value}</div><div className="calc-grid"><button className="clear" onClick={() => setValue('0')}>Clear</button>{buttons.map((button) => <button key={button} onClick={() => press(button)} className={['/', '*', '-', '+', '='].includes(button) ? 'operator' : ''}>{button}</button>)}</div></div>
}

function CalendarApp({ now }) {
  const [events, setEvents] = useState([])
  const [eventTitle, setEventTitle] = useState('')
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  useEffect(() => { api.getEvents().then(setEvents).catch(() => {}) }, [])
  async function addEvent(event) {
    event.preventDefault()
    if (!eventTitle.trim()) return
    try { const created = await api.createEvent({ date: now.toISOString().slice(0, 10), title: eventTitle.trim() }); setEvents([...events, created]); setEventTitle('') } catch { }
  }
  async function removeEvent(id) { await api.deleteEvent(id).catch(() => {}); setEvents(events.filter((event) => event.id !== id)) }
  return <div className="calendar-app"><div className="calendar-heading"><div><p className="eyebrow">MONTH VIEW</p><h2>{now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2></div><CalendarDays size={24} /></div><div className="weekdays">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="calendar-grid">{Array.from({ length: firstDay }).map((_, index) => <span key={`empty-${index}`} />)}{Array.from({ length: days }, (_, index) => index + 1).map((day) => <span key={day} className={day === now.getDate() ? 'today' : ''}>{day}</span>)}</div><form className="event-form" onSubmit={addEvent}><input value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder="Add an event for today" /><button type="submit"><Plus size={14} /></button></form>{events.filter((event) => event.date === now.toISOString().slice(0, 10)).map((event) => <div className="event-row" key={event.id}><span>{event.title}</span><button onClick={() => removeEvent(event.id)}><X size={13} /></button></div>)}</div>
}

export default App