'use strict'

const getBrowser = require('./browser')

const HEADERS_ORDER = require('./headers-order.json')

const getHeader = (key, headers) => {
  let result

  for (const [header, value] of Object.entries(headers)) {
    if (header.toLowerCase() === key) {
      result = value
      break
    }
  }

  return result
}

const sortHeaders = headers => {
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

module.exports = { getHeader, sortHeaders }
