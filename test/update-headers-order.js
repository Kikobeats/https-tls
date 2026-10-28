'use strict'

const { spawnSync } = require('child_process')
const fs = require('fs')
const { mkdir, mkdtemp, readFile, readdir, rm, writeFile } = require('fs/promises')
const http = require('http')
const os = require('os')
const path = require('path')
const { gzipSync } = require('zlib')

const test = require('ava').default

const {
  assertHeadersOrder,
  main,
  writeAtomically
} = require('../scripts/update-headers-order')

const SCRIPT = path.join(__dirname, '../scripts/update-headers-order.js')
const SHIPPED = path.join(__dirname, '../src/headers-order.json')
const SOURCE_URL =
  'https://raw.githubusercontent.com/apify/fingerprint-suite/master/packages/header-generator/src/data_files/headers-order.json'
const ORIGINAL = 'original\n'

const shipped = require('../src/headers-order.json')

const validOrder = {
  chrome: ['Host', ':method'],
  firefox: ['Host'],
  safari: ['Accept'],
  edge: ['Host']
}

const temporaryDirectory = () =>
  mkdtemp(path.join(os.tmpdir(), 'headers-order-'))

const listen = handler =>
  new Promise((resolve, reject) => {
    const server = http.createServer(handler)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({
        server,
        url: `http://127.0.0.1:${port}`
      })
    })
    server.on('error', reject)
  })

const closeServer = server =>
  new Promise(resolve => {
    server.closeAllConnections?.()
    server.close(() => resolve())
  })

const withServer = async (handler, run) => {
  const { server, url } = await listen(handler)
  try {
    return await run(url)
  } finally {
    await closeServer(server)
  }
}

const destinationIn = async directory => {
  const destination = path.join(directory, 'headers-order.json')
  await writeFile(destination, ORIGINAL)
  return destination
}

const temporaryNames = async directory =>
  (await readdir(directory)).filter(name => name.endsWith('.tmp'))

test('the shipped header order is a valid payload', t => {
  t.is(assertHeadersOrder(shipped), shipped)
  t.true(Object.keys(shipped).includes('edge'))
})

test('a payload with only the required browsers is valid', t => {
  const headersOrder = {
    chrome: ['Host'],
    firefox: ['Host'],
    safari: ['Accept']
  }
  t.is(assertHeadersOrder(headersOrder), headersOrder)
})

test('an extra browser with a header list is valid', t => {
  t.is(assertHeadersOrder(validOrder), validOrder)
})

test('empty and unusual header names are strings, so they stay valid', t => {
  const headersOrder = {
    chrome: ['', ' ', 'Host\r\nX-Injected: 1', ':method'],
    firefox: ['Host'],
    safari: ['Accept']
  }
  t.is(assertHeadersOrder(headersOrder), headersOrder)
})

test('a differently cased browser name does not satisfy the required key', t => {
  const error = t.throws(
    () =>
      assertHeadersOrder({
        Chrome: ['Host'],
        firefox: ['Host'],
        safari: ['Accept']
      }),
    { instanceOf: TypeError }
  )
  t.is(error.message, 'Unexpected headers order for: chrome')
})

const invalidOrders = [
  ['missing chrome', { firefox: ['Host'], safari: ['Accept'] }, 'chrome'],
  ['missing firefox', { chrome: ['Host'], safari: ['Accept'] }, 'firefox'],
  ['missing safari', { chrome: ['Host'], firefox: ['Host'] }, 'safari'],
  [
    'an empty list for a required browser',
    { chrome: [], firefox: ['Host'], safari: ['Accept'] },
    'chrome'
  ],
  [
    'an empty list for an extra browser',
    { ...validOrder, edge: [] },
    'edge'
  ],
  [
    'a number in a required list',
    { ...validOrder, chrome: ['Host', 1] },
    'chrome'
  ],
  [
    'null in a required list',
    { ...validOrder, firefox: ['Host', null] },
    'firefox'
  ],
  [
    'an object in a required list',
    { ...validOrder, safari: ['Accept', {}] },
    'safari'
  ],
  [
    'a boolean in a required list',
    { ...validOrder, edge: [true] },
    'edge'
  ],
  [
    'a nested list',
    { ...validOrder, chrome: ['Host', ['Accept']] },
    'chrome'
  ],
  [
    'a string where a list is required',
    { ...validOrder, chrome: 'Host' },
    'chrome'
  ],
  [
    'a number where a list is required',
    { ...validOrder, edge: 1 },
    'edge'
  ],
  ['null', null, 'chrome, firefox, safari'],
  ['undefined', undefined, 'chrome, firefox, safari'],
  ['an empty object', {}, 'chrome, firefox, safari'],
  ['a number', 1, 'chrome, firefox, safari'],
  ['a boolean', false, 'chrome, firefox, safari'],
  ['an empty string', '', 'chrome, firefox, safari'],
  ['a string', 'ab', 'chrome, firefox, safari, 0, 1'],
  ['an array', ['Host'], 'chrome, firefox, safari, 0']
]

for (const [title, headersOrder, expected] of invalidOrders) {
  test(`rejects ${title}`, t => {
    const error = t.throws(() => assertHeadersOrder(headersOrder), {
      instanceOf: TypeError
    })
    t.is(error.message, `Unexpected headers order for: ${expected}`)
  })
}

test('a failed rename leaves the destination in place and removes the temporary file', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = path.join(directory, 'headers-order.json')
  await mkdir(destination)
  await writeFile(path.join(destination, 'keep.txt'), 'keep')

  await t.throwsAsync(writeAtomically(destination, 'new'))
  t.is(await readFile(path.join(destination, 'keep.txt'), 'utf8'), 'keep')
  t.deepEqual(await temporaryNames(directory), [])
})

test('a failed write leaves no temporary file', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = path.join(directory, 'missing', 'headers-order.json')

  const error = await t.throwsAsync(writeAtomically(destination, 'new'))
  t.is(error.code, 'ENOENT')
  t.deepEqual(await temporaryNames(directory), [])
})

test('a cleanup failure does not hide the rename error', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const io = {
    writeFile: async () => {},
    rename: async () => {
      throw new Error('rename failed')
    },
    rm: async () => {
      throw new Error('cleanup failed')
    }
  }

  const error = await t.throwsAsync(
    writeAtomically(path.join(directory, 'headers-order.json'), 'new', io)
  )
  t.is(error.message, 'rename failed')
})

test('a cleanup failure does not hide the write error', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const io = {
    writeFile: async () => {
      throw new Error('write failed')
    },
    rename: async () => {},
    rm: async () => {
      throw new Error('cleanup failed')
    }
  }

  const error = await t.throwsAsync(
    writeAtomically(path.join(directory, 'headers-order.json'), 'new', io)
  )
  t.is(error.message, 'write failed')
})

test('a successful write replaces the destination and leaves no temporary file', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = await destinationIn(directory)

  await writeAtomically(destination, 'new')
  t.is(await readFile(destination, 'utf8'), 'new')
  t.deepEqual(await temporaryNames(directory), [])
})

const serveJson = (status, body, headers = {}) => (req, res) => {
  if (req.url === '/redirect') {
    res.writeHead(302, { location: '/final' })
    res.end()
    return
  }
  if (req.url === '/permanent') {
    res.writeHead(301, { location: '/final' })
    res.end()
    return
  }
  res.writeHead(status, headers)
  res.end(body)
}

test('main writes the serialized order and does not append a trailing newline', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = await destinationIn(directory)
  const body = JSON.stringify(validOrder)

  await withServer(serveJson(200, body), async url => {
    await main({ destination, url: `${url}/final` })
  })

  const written = await readFile(destination, 'utf8')
  t.is(written, JSON.stringify(validOrder, null, 2))
  t.false(written.endsWith('\n'))
  t.deepEqual(await temporaryNames(directory), [])
})

test('main persists the same bytes as the committed header order', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = await destinationIn(directory)
  const committed = await readFile(SHIPPED, 'utf8')

  await withServer(serveJson(200, JSON.stringify(shipped)), async url => {
    await main({ destination, url })
  })

  t.is(await readFile(destination, 'utf8'), committed)
})

test('main follows a temporary redirect to the payload', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = await destinationIn(directory)

  await withServer(serveJson(200, JSON.stringify(validOrder)), async url => {
    await main({ destination, url: `${url}/redirect` })
  })

  t.is(await readFile(destination, 'utf8'), JSON.stringify(validOrder, null, 2))
})

test('main follows a permanent redirect to the payload', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = await destinationIn(directory)

  await withServer(serveJson(200, JSON.stringify(validOrder)), async url => {
    await main({ destination, url: `${url}/permanent` })
  })

  t.is(await readFile(destination, 'utf8'), JSON.stringify(validOrder, null, 2))
})

test('main accepts a JSON body with a byte-order mark', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = await destinationIn(directory)
  const body = `\uFEFF${JSON.stringify(validOrder)}`

  await withServer(serveJson(200, body), async url => {
    await main({ destination, url })
  })

  t.is(await readFile(destination, 'utf8'), JSON.stringify(validOrder, null, 2))
})

test('main accepts JSON without a content type', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = await destinationIn(directory)

  await withServer(serveJson(200, JSON.stringify(validOrder), {}), async url => {
    await main({ destination, url })
  })

  t.is(await readFile(destination, 'utf8'), JSON.stringify(validOrder, null, 2))
})

test('main accepts a gzip-encoded JSON body', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = await destinationIn(directory)
  const body = gzipSync(Buffer.from(JSON.stringify(validOrder)))

  await withServer(
    serveJson(200, body, {
      'content-encoding': 'gzip',
      'content-type': 'application/json'
    }),
    async url => {
      await main({ destination, url })
    }
  )

  t.is(await readFile(destination, 'utf8'), JSON.stringify(validOrder, null, 2))
})

const rejectedResponses = [
  ['an HTTP 404', 404, 'missing', /HTTP 404 for /],
  ['an HTTP 500', 500, 'err', /HTTP 500 for /],
  ['an empty 204', 204, '', /Unexpected end of JSON input/],
  ['an empty 200', 200, '', /Unexpected end of JSON input/],
  ['an HTML 200', 200, '<html>', /is not valid JSON/],
  ['null', 200, 'null', /Unexpected headers order for: chrome, firefox, safari/],
  [
    'an invalid browser list',
    200,
    JSON.stringify({ ...validOrder, edge: [] }),
    /Unexpected headers order for: edge/
  ]
]

for (const [title, status, body, message] of rejectedResponses) {
  test(`main leaves the file untouched for ${title}`, async t => {
    const directory = await temporaryDirectory()
    t.teardown(() => rm(directory, { recursive: true, force: true }))
    const destination = await destinationIn(directory)

    await withServer(serveJson(status, body), async url => {
      await t.throwsAsync(main({ destination, url }), { message })
    })

    t.is(await readFile(destination, 'utf8'), ORIGINAL)
    t.deepEqual(await temporaryNames(directory), [])
  })
}

test('main leaves the file untouched when the host refuses the connection', async t => {
  const directory = await temporaryDirectory()
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const destination = await destinationIn(directory)

  await t.throwsAsync(
    main({ destination, url: 'http://127.0.0.1:1/headers-order.json' })
  )
  t.is(await readFile(destination, 'utf8'), ORIGINAL)
})

const cliStub = source => `'use strict'\n${source}\n`

const runCli = stubSource => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'headers-order-cli-'))
  const stub = path.join(directory, 'stub.js')
  fs.writeFileSync(stub, cliStub(stubSource))
  const before = fs.readFileSync(SHIPPED)
  try {
    const result = spawnSync(process.execPath, ['--require', stub, SCRIPT], {
      encoding: 'utf8',
      timeout: 10000
    })
    const after = fs.readFileSync(SHIPPED)
    return {
      result,
      unchanged: before.equals(after),
      temporary: `${SHIPPED}.${result.pid}.tmp`
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

test('running the updater exits 1 when the download fails and does not stage a write', t => {
  const { result, unchanged, temporary } = runCli(
    "global.fetch = async () => { throw new TypeError('fetch failed') }"
  )
  t.is(result.status, 1)
  t.true(result.stderr.includes('fetch failed'))
  t.true(unchanged)
  t.false(fs.existsSync(temporary))
})

test('running the updater exits 1 on an HTTP error', t => {
  const { result, unchanged } = runCli(
    'global.fetch = async () => ({ ok: false, status: 404 })'
  )
  t.is(result.status, 1)
  t.true(result.stderr.includes(`HTTP 404 for ${SOURCE_URL}`))
  t.true(unchanged)
})

test('running the updater writes the default file and exits 0 for a valid payload', t => {
  const payload = JSON.stringify(shipped)
  const { result, unchanged, temporary } = runCli(
    `global.fetch = async () => ({ ok: true, status: 200, json: async () => (${payload}) })`
  )
  t.is(result.status, 0)
  t.is(result.stderr, '')
  t.true(unchanged)
  t.false(fs.existsSync(temporary))
})

test('running the updater exits 1 when the payload is not the expected shape', t => {
  const { result, unchanged } = runCli(
    `global.fetch = async () => ({ ok: true, status: 200, json: async () => (${JSON.stringify({ chrome: [], firefox: ['Host'], safari: ['Accept'] })}) })`
  )
  t.is(result.status, 1)
  t.regex(result.stderr, /Unexpected headers order for: chrome/)
  t.true(unchanged)
})

test('requiring the updater does not fetch', t => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'headers-order-require-')
  )
  const stub = path.join(directory, 'stub.js')
  fs.writeFileSync(
    stub,
    cliStub(
      "global.fetch = async () => { throw new TypeError('fetch failed') }"
    )
  )
  try {
    const result = spawnSync(
      process.execPath,
      ['--require', stub, '-e', `require(${JSON.stringify(SCRIPT)})`],
      { encoding: 'utf8', timeout: 5000 }
    )
    t.is(result.status, 0)
    t.false(result.stderr.includes('fetch failed'))
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
