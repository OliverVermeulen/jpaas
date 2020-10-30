'use strict'

const express = require('express')
const quotes = require('./quotes')
const fs = require('fs')
const exec = require('child-process-promise').exec;

async function getVersion() {
  let version = await fs.promises.readFile(`${__dirname}/../VERSION.txt`, 'utf8')
  return version.trim()
}

const app = express()

let running = true
let host = ''

app.use('/', (req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.route('/health').get((req, res) => {
  res.status(running ? 200 : 500).send(running ? 'ok' : 'not ok')
})
app.route('/version').get(async (req, res) => {
  let version = await getVersion()
  res.send(version)
})

app.use('/', async (req, res) => {
  let version = await getVersion()
  let quote = quotes[Math.floor(Math.random() * quotes.length)]
  let {trim} = req.query

  if (trim) {
    quote = `${quote.slice(0, trim)}...`
  }

  res.json({ host, quote, version })
})

process.on('SIGINT', shutdown)

getHostInfo()
.then(hostInfo => {
  host = hostInfo
  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`jpaas service started on port ${port}`))
})

function shutdown() {
  running = false
  console.log('exiting...')
  setTimeout(() => {
    console.log('donesies...')
    process.exit()
  }, 1000)
}

async function getHostInfo() {
  let child = exec('hostname')
  let resp = await child
  return resp.stdout.trim()
}
