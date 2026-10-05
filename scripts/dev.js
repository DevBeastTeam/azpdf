// Dev orchestrator: starts Vite + PHP backend without fighting for port 5000.
// If an azPDF PHP backend is already listening, it is reused instead of respawned.

import { spawn } from 'node:child_process'
import net from 'node:net'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const API_PORT = Number(process.env.API_PORT || 5000)
const API_HOST = '127.0.0.1'
const HEALTH_URL = `http://${API_HOST}:${API_PORT}/api/health`

const COLORS = {
  vite: '\x1b[36m',
  php: '\x1b[35m',
  dev: '\x1b[33m',
  reset: '\x1b[0m',
}

const children = new Set()
let shuttingDown = false

function log(tag, message) {
  const color = COLORS[tag] || COLORS.dev
  const stream = tag === 'vite' ? process.stdout : process.stdout
  stream.write(`${color}[${tag}]${COLORS.reset} ${message}\n`)
}

function pipeWithPrefix(stream, tag) {
  let buffer = ''
  stream.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) log(tag, line)
  })
  stream.on('end', () => {
    if (buffer.trim()) log(tag, buffer)
  })
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: API_HOST, port })
    socket.setTimeout(1000)
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(true))
  })
}

async function probeBackend() {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 1500)
    const res = await fetch(HEALTH_URL, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return false
    const body = await res.json()
    return body?.status === 'ok' && String(body?.message || '').includes('azPDF')
  } catch {
    return false
  }
}

function startVite() {
  const vite = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js')], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  })
  pipeWithPrefix(vite.stdout, 'vite')
  pipeWithPrefix(vite.stderr, 'vite')
  children.add(vite)
  return vite
}

function startPhp() {
  const php = spawn('php', ['-S', `0.0.0.0:${API_PORT}`, 'backend/index.php'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  })
  pipeWithPrefix(php.stdout, 'php')
  pipeWithPrefix(php.stderr, 'php')
  children.add(php)
  return php
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(code), 150).unref()
}

async function main() {
  const reusePhp = await probeBackend()

  if (reusePhp) {
    log('dev', `Reusing PHP backend already running on http://localhost:${API_PORT}`)
  } else if (!(await isPortFree(API_PORT))) {
    log('dev', `Port ${API_PORT} is busy but not an azPDF backend. Free it first:`)
    log('dev', `  lsof -ti tcp:${API_PORT} | xargs -r kill`)
    process.exit(1)
  } else {
    log('dev', `Starting PHP backend on 0.0.0.0:${API_PORT}`)
    const php = startPhp()
    php.on('exit', (code) => {
      if (shuttingDown) return
      log('php', `exited with code ${code}`)
      shutdown(typeof code === 'number' && code !== 0 ? code : 0)
    })
  }

  const vite = startVite()
  vite.on('exit', (code, signal) => {
    if (shuttingDown) return
    log('vite', `exited with ${signal || `code ${code}`}`)
    shutdown(code ?? 0)
  })

  process.on('SIGINT', () => shutdown(0))
  process.on('SIGTERM', () => shutdown(0))
}

main().catch((err) => {
  log('dev', `Failed to start dev environment: ${err.message}`)
  shutdown(1)
})