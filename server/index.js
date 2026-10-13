import cors from 'cors'
import express from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = 3001
const root = path.dirname(fileURLToPath(import.meta.url))
const notesFile = path.join(root, '../data/notes.json')
const eventsFile = path.join(root, '../data/events.json')
const usersFile = path.join(root, '../data/users.json')
const sessions = new Set()

app.use(cors())
app.use(express.json())

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function writeJson(file, value) {
  await fs.writeFile(file, JSON.stringify(value, null, 2))
}

function requireAuth(request, response, next) {
  const token = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : ''
  if (!sessions.has(token)) return response.status(401).json({ error: 'Please sign in first.' })
  next()
}

app.post('/api/login', async (request, response) => {
  const { username, password } = request.body || {}
  try {
    const users = await readJson(usersFile)
    const user = users.find((entry) => entry.username.toLowerCase() === String(username).toLowerCase() && entry.password === password)
    if (!user) return response.status(401).json({ error: 'Invalid username or password.' })
    const token = crypto.randomUUID()
    sessions.add(token)
    response.json({ token, username: user.username })
  } catch {
    response.status(500).json({ error: 'Could not read user data.' })
  }
})

app.post('/api/logout', (request, response) => {
  if (request.headers.authorization?.startsWith('Bearer ')) sessions.delete(request.headers.authorization.slice(7))
  response.json({ loggedOut: true })
})

app.get('/api/notes', requireAuth, async (_request, response) => {
  try {
    response.json(await readJson(notesFile))
  } catch {
    response.status(500).json({ error: 'Could not read notes.' })
  }
})

app.post('/api/notes', requireAuth, async (request, response) => {
  try {
    const notes = await readJson(notesFile)
    const note = { id: Date.now(), title: String(request.body?.title || 'Untitled note'), body: String(request.body?.body || '') }
    notes.push(note)
    await writeJson(notesFile, notes)
    response.status(201).json(note)
  } catch {
    response.status(500).json({ error: 'Could not save notes.' })
  }
})

app.put('/api/notes/:id', requireAuth, async (request, response) => {
  try {
    const notes = await readJson(notesFile)
    const id = Number(request.params.id)
    const index = notes.findIndex((note) => note.id === id)
    if (index < 0) return response.status(404).json({ error: 'Note not found.' })
    notes[index] = { ...notes[index], title: String(request.body?.title || ''), body: String(request.body?.body || '') }
    await writeJson(notesFile, notes)
    response.json(notes[index])
  } catch {
    response.status(500).json({ error: 'Could not update note.' })
  }
})

app.delete('/api/notes/:id', requireAuth, async (request, response) => {
  try {
    const notes = await readJson(notesFile)
    const next = notes.filter((note) => note.id !== Number(request.params.id))
    if (next.length === notes.length) return response.status(404).json({ error: 'Note not found.' })
    await writeJson(notesFile, next)
    response.json({ deleted: true })
  } catch {
    response.status(500).json({ error: 'Could not delete note.' })
  }
})

app.get('/api/events', requireAuth, async (_request, response) => {
  try { response.json(await readJson(eventsFile)) } catch { response.status(500).json({ error: 'Could not read events.' }) }
})

app.post('/api/events', requireAuth, async (request, response) => {
  try {
    const events = await readJson(eventsFile)
    const event = { id: Date.now(), date: String(request.body?.date || ''), title: String(request.body?.title || 'Untitled event') }
    if (!event.date) return response.status(400).json({ error: 'Event date is required.' })
    events.push(event)
    await writeJson(eventsFile, events)
    response.status(201).json(event)
  } catch { response.status(500).json({ error: 'Could not save event.' }) }
})

app.delete('/api/events/:id', requireAuth, async (request, response) => {
  try {
    const events = await readJson(eventsFile)
    await writeJson(eventsFile, events.filter((event) => event.id !== Number(request.params.id)))
    response.json({ deleted: true })
  } catch { response.status(500).json({ error: 'Could not delete event.' }) }
})

app.use(express.static(path.join(root, '../dist')))
app.use((request, response, next) => {
  if (request.method === 'GET' && request.accepts('html')) return response.sendFile(path.join(root, '../dist/index.html'))
  next()
})

app.listen(port, () => console.log(`WebOS backend running at http://localhost:${port}`))