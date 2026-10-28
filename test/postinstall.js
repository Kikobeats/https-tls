'use strict'

const { spawnSync } = require('child_process')
const fs = require('fs')
const { mkdtemp, readFile, rm, writeFile } = require('fs/promises')
const os = require('os')
const path = require('path')

const test = require('ava').default

const { install } = require('../scripts/postinstall')

const SCRIPT = path.join(__dirname, '../scripts/postinstall.js')
const SHIPPED = path.join(__dirname, '../src/headers-order.json')
const ORIGINAL = 'original\n'
const REFUSED = 'http://127.0.0.1:1/headers-order.json'

const temporaryDirectory = () =>
  mkdtemp(path.join(os.tmpdir(), 'headers-order-install-'))

const runCli = (args, stubSource) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'headers-order-install-cli-')
  )
  const stub = path.join(directory, 'stub.js')
  fs.writeFileSync(stub, `'use strict'\n${stubSource}\n`)
  const before = fs.readFileSync(SHIPPED)
  try {
    const result = spawnSync(process.execPath, ['--require', stub, SCRIPT, ...args], {
      encoding: 'utf8',
      timeout: 10000
    })
    return {
      result,
      unchanged: before.equals(fs.readFileSync(SHIPPED))
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

test('a failed refresh keeps the bundled file', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = path.join(directory, 'headers-order.json')
  await writeFile(destination, ORIGINAL)

  await install({ destination, url: REFUSED })

  t.is(await readFile(destination, 'utf8'), ORIGINAL)
})

test('a strict refresh failure is an error', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = path.join(directory, 'headers-order.json')
  await writeFile(destination, ORIGINAL)

  await t.throwsAsync(install({ destination, strict: true, url: REFUSED }))
  t.is(await readFile(destination, 'utf8'), ORIGINAL)
})

test('install exits 0 when the download fails', t => {
  const { result, unchanged } = runCli(
    [],
    "global.fetch = async () => { throw new TypeError('fetch failed') }"
  )

  t.is(result.status, 0)
  t.true(result.stderr.includes('using the bundled one'))
  t.true(result.stderr.includes('fetch failed'))
  t.true(unchanged)
})

test('install exits 1 when the download fails and strict is set', t => {
  const { result, unchanged } = runCli(
    ['--strict'],
    "global.fetch = async () => { throw new TypeError('fetch failed') }"
  )

  t.is(result.status, 1)
  t.true(result.stderr.includes('fetch failed'))
  t.false(result.stderr.includes('using the bundled one'))
  t.true(unchanged)
})
