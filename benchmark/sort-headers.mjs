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
  v0: headers => {
    const userAgent = getHeader('user-agent', headers)
    const browser = getBrowser(userAgent)
    const order = HEADERS_ORDER[browser] || []
    const orderedHeaders = {}

    // Pre-calculate order as a Set for O(1) lookup
    const orderSet = new Set(order)
    const headerKeys = Object.keys(headers)

    // Single loop approach
    let i = 0
    const orderLength = order.length

    // Add ordered headers first
    for (; i < orderLength; i++) {
      const key = order[i]
      if (key in headers) {
        orderedHeaders[key] = headers[key]
      }
    }

    // Add remaining unordered headers
    const headersLength = headerKeys.length
    for (i = 0; i < headersLength; i++) {
      const key = headerKeys[i]
      if (!orderSet.has(key)) {
        orderedHeaders[key] = headers[key]
      }
    }

    return orderedHeaders
  },
  v1: headers => {
    const userAgent = getHeader('user-agent', headers)
    const browser = getBrowser(userAgent)
    const order = HEADERS_ORDER[browser] || []
    const orderedHeaders = {}

    // Cache length and use local variables
    const orderLength = order.length
    let key
    let i = 0

    // Add ordered headers first
    for (; i < orderLength; i++) {
      key = order[i]
      if (key in headers) {
        orderedHeaders[key] = headers[key]
      }
    }

    // Add remaining headers
    const headerKeys = Object.keys(headers)
    const headersLength = headerKeys.length
    const orderSet = new Set(order) // Use Set for O(1) lookup

    for (i = 0; i < headersLength; i++) {
      key = headerKeys[i]
      if (!orderSet.has(key)) {
        orderedHeaders[key] = headers[key]
      }
    }

    return orderedHeaders
  },
  v2: headers => {
    const userAgent = getHeader('user-agent', headers)
    const browser = getBrowser(userAgent)
    const order = HEADERS_ORDER[browser] || []
    const orderedHeaders = {}

    // Create lookup object instead of using includes
    const orderLookup = {}
    let i = 0
    const orderLength = order.length

    for (; i < orderLength; i++) {
      orderLookup[order[i]] = true
    }

    // Add ordered headers first
    for (i = 0; i < orderLength; i++) {
      const key = order[i]
      if (key in headers) {
        orderedHeaders[key] = headers[key]
      }
    }

    // Add remaining headers
    const headerKeys = Object.keys(headers)
    const headersLength = headerKeys.length

    for (i = 0; i < headersLength; i++) {
      const key = headerKeys[i]
      if (!orderLookup[key]) {
        orderedHeaders[key] = headers[key]
      }
    }

    return orderedHeaders
  },
  v3: headers => {
    const userAgent = getHeader('user-agent', headers)
    const browser = getBrowser(userAgent)
    const order = HEADERS_ORDER[browser] || []
    const orderedHeaders = {}

    const orderLength = order.length
    for (let i = 0; i < orderLength; i++) {
      const attribute = order[i]
      if (attribute in headers) {
        orderedHeaders[attribute] = headers[attribute]
      }
    }

    const headerKeys = Object.keys(headers)
    const headersLength = headerKeys.length
    const orderSet = new Set(order) // Use Set for O(1) lookup
    for (let i = 0; i < headersLength; i++) {
      const attribute = headerKeys[i]
      if (!orderSet.has(attribute)) {
        orderedHeaders[attribute] = headers[attribute]
      }
    }

    return orderedHeaders
  },
  v4: headers => {
    const userAgent = getHeader('user-agent', headers)
    const browser = getBrowser(userAgent)
    const order = HEADERS_ORDER[browser] || []
    const orderedHeaders = {}

    for (const attribute of order) {
      if (attribute in headers) {
        orderedHeaders[attribute] = headers[attribute]
      }
    }

    for (const attribute of Object.keys(headers)) {
      if (!order.includes(attribute)) {
        orderedHeaders[attribute] = headers[attribute]
      }
    }

    return orderedHeaders
  },
  v5: headers => {
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
