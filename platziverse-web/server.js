'use strict'

const debug = require('debug')('platziverse:web')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const chalk = require('chalk')
const path = require('path')
const asyncify = require('express-asyncify')
const PlatziverAgent = require('platziverse-agent')
const proxy = require('./proxy')


const { pipe } = require('./utils')

const port = process.env.PORT || 8080
const app = asyncify(express())
const server = http.createServer(app)
const io = socketio(server)
const agent = new PlatziverAgent()

app.use(express.static(path.join(__dirname, 'public')))
app.use('/', proxy)
app.use((err, req, res, next) => {
  debug(`Error: ${err.message}`)

  if (err.message.match(/not found/)) {
    return res.status(404).send({ error: err.message })
  }
  res.status(500).send({ error: err.message })
})

// Socket.io /Websockets

io.on('connect', socket => {
  debug(`Connected ${socket.id}`)

  pipe(agent, socket)
})

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

server.listen(port, () => {
  console.log(`${chalk.green('[platziverse-web]')} server listening on port ${port}`)
  agent.connect()
})
