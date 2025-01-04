'use strict'

import { Bench } from 'tinybench'
import { readFileSync } from 'fs'

import { getHeader } from '../src/headers.js'

const getBrowser = () => 'chrome'

const HEADERS_ORDER = JSON.parse(
  readFileSync('../src/headers-order.json', 'utf8')
)

const headers = await fetch('https://vercel.com').then(res =>
  Object.fromEntries(res.headers)
)

const implementations = {
  'v0 (for loop)': headers => {
    const userAgent = getHeader('user-agent', headers)
    const browser = getBrowser(userAgent)
    const order = HEADERS_ORDER[browser] || []
    const orderedHeaders = {}

    // First, add ordered headers
    for (let i = 0; i < order.length; i++) {
      const key = order[i]
      if (key in headers) orderedHeaders[key] = headers[key]
    }

    // Then, add remaining headers
    const headerKeys = Object.keys(headers)
    for (let i = 0; i < headerKeys.length; i++) {
      const key = headerKeys[i]
      if (!order.includes(key)) orderedHeaders[key] = headers[key]
    }

    return orderedHeaders
  },
  'v1 (set)': headers => {
    const userAgent = getHeader('user-agent', headers)
    const browser = getBrowser(userAgent)
    const order = HEADERS_ORDER[browser] || []
    const orderedHeaders = {}

    // Pre-calculate order as a Set for O(1) lookup
    const orderSet = new Set(order)
    const headerKeys = Object.keys(headers)
    const headersLength = headerKeys.length
    const orderLength = order.length
    let i = 0
    let key

    // Add ordered headers
    for (; i < orderLength; i++) {
      key = order[i]
      if (key in headers) orderedHeaders[key] = headers[key]
    }

    // Add remaining headers
    for (i = 0; i < headersLength; i++) {
      key = headerKeys[i]
      if (!orderSet.has(key)) orderedHeaders[key] = headers[key]
    }

    return orderedHeaders
  }
}

const cases = Object.entries(implementations)

// Verify all implementations produce the same result
const reference = JSON.stringify(
  implementations[Object.keys(implementations)[0]](headers)
)
cases.slice(1).forEach(([name, implementation]) => {
  const result = JSON.stringify(implementation(headers))
  if (result !== reference) {
    throw new Error(`Different output for ${name}: ${result}`)
  }
})

const bench = new Bench({ time: 1000 })

for (const [name, implementation] of cases) {
  bench.add(name, () => implementation(headers))
}

await bench.run()

const results = bench.tasks.map(task => ({
  name: task.name,
  value: task.result.latency.mean
}))

const fastest = results.reduce((prev, current) =>
  prev.value < current.value ? prev : current
)

console.table(bench.table())
console.log(`Fastest implementation: ${fastest.name}`)
