'use strict'

const { writeFileSync } = require('fs')
const { join } = require('path')

const tls = require('..')
const HEADERS_ORDER = require('../src/headers-order.json')
const HEADER_SETS = require('./fixtures/headers.json')
const USER_AGENTS = require('./fixtures/user-agents.json')

const { sortHeaders, getBrowser } = tls

const RUNS = 7
const SORT_CALLS = 60000
const BROWSER_PASSES = 50000
const TLS_PASSES = 20000

const EXPECTED_BROWSERS = { chrome: 77, firefox: 4, safari: 19 }
const CHROME_MIN_VERSION = 'TLSv1'

const median = values => {
  const sorted = values.slice().sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const now = () => process.hrtime.bigint()

const elapsed = started => Number(now() - started) / 1e6

const expectedOrder = (browser, headers) => {
  const order = HEADERS_ORDER[browser]
  const known = [...new Set(order)].filter(key => key in headers)
  const rest = Object.keys(headers).filter(key => !order.includes(key))
  return known.concat(rest).join('\n')
}

const sortCase = browser => {
  const headers = HEADER_SETS[browser]
  const expected = expectedOrder(browser, headers)
  return {
    name: `sortHeaders ${browser}`,
    extra: `${SORT_CALLS} calls on ${Object.keys(headers).length} headers`,
    run: () => {
      let sorted
      for (let call = 0; call < SORT_CALLS; call++) sorted = sortHeaders(headers)
      return Object.keys(sorted).join('\n') === expected
    }
  }
}

const browserCase = {
  name: 'getBrowser top 100 user agents',
  extra: `${BROWSER_PASSES} passes x ${USER_AGENTS.length} user agents`,
  run: () => {
    const counts = { chrome: 0, firefox: 0, safari: 0 }
    for (let pass = 0; pass < BROWSER_PASSES; pass++) {
      for (const userAgent of USER_AGENTS) counts[getBrowser(userAgent)]++
    }
    return Object.keys(EXPECTED_BROWSERS).every(
      browser => counts[browser] === EXPECTED_BROWSERS[browser] * BROWSER_PASSES
    )
  }
}

const tlsCase = {
  name: 'tls options top 100 user agents',
  extra: `${TLS_PASSES} passes x ${USER_AGENTS.length} user agents`,
  run: () => {
    let configured = 0
    let chrome = 0
    for (let pass = 0; pass < TLS_PASSES; pass++) {
      for (const userAgent of USER_AGENTS) {
        const https = tls(userAgent)
        if (typeof https.ciphers === 'string' && https.signatureAlgorithms) {
          configured++
        }
        if (https.minVersion === CHROME_MIN_VERSION) chrome++
      }
    }
    return (
      configured === USER_AGENTS.length * TLS_PASSES &&
      chrome === EXPECTED_BROWSERS.chrome * TLS_PASSES
    )
  }
}

const CASES = [
  sortCase('chrome'),
  sortCase('firefox'),
  sortCase('safari'),
  browserCase,
  tlsCase
]

const fmt = value => value.toFixed(1)

const report = slot => {
  const med = slot.walls.length ? median(slot.walls) : Number.NaN
  const min = slot.walls.length ? Math.min(...slot.walls) : Number.NaN
  const max = slot.walls.length ? Math.max(...slot.walls) : Number.NaN
  const extra = `${slot.entry.extra}, errors ${slot.errors}, runs ${RUNS}`
  console.log(
    `${slot.entry.name}  median ${fmt(med)}ms  range ${fmt(min)}-${fmt(max)}  ${extra}`
  )
  return {
    name: slot.entry.name,
    unit: 'ms',
    value: Number(med.toFixed(1)),
    range: `${fmt(min)}-${fmt(max)}`,
    extra
  }
}

const takeSample = (slot, run) => {
  try {
    const started = now()
    const ok = slot.entry.run()
    const wall = elapsed(started)
    if (!ok) {
      console.error(`${slot.entry.name} run ${run} produced unexpected output`)
      slot.errors++
      return
    }
    slot.walls.push(wall)
  } catch (error) {
    console.error(error)
    slot.errors++
  }
}

const main = () => {
  const slots = CASES.map(entry => {
    entry.run()
    return { entry, walls: [], errors: 0 }
  })
  for (let run = 0; run < RUNS; run++) {
    for (const slot of slots) takeSample(slot, run)
  }
  const results = slots.map(report)
  writeFileSync(
    join(__dirname, '..', 'benchmark-output.json'),
    JSON.stringify(results, null, 2) + '\n'
  )
  const errors = slots.reduce((total, slot) => total + slot.errors, 0)
  if (errors > 0 || results.some(result => !Number.isFinite(result.value))) {
    process.exitCode = 1
  }
}

main()
