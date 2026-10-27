'use strict'

const getBrowser = require('./browser')

const HEADERS_ORDER = require('./headers-order.json')

const NO_ORDER = { keys: [], set: new Set() }

const ORDERS = Object.fromEntries(
  Object.entries(HEADERS_ORDER).map(([browser, keys]) => [browser, { keys, set: new Set(keys) }])
)

const getHeader = (key, headers) => {
  const headerKeys = Object.keys(headers)
  for (let i = 0; i < headerKeys.length; i++) {
    if (headerKeys[i].toLowerCase() === key) return headers[headerKeys[i]]
  }
}

const sortHeaders = headers => {
  const userAgent = getHeader('user-agent', headers)
  const { keys, set } = ORDERS[getBrowser(userAgent)] || NO_ORDER
  const orderedHeaders = {}

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key in headers) orderedHeaders[key] = headers[key]
  }

  const headerKeys = Object.keys(headers)
  for (let i = 0; i < headerKeys.length; i++) {
    const key = headerKeys[i]
    if (!set.has(key)) orderedHeaders[key] = headers[key]
  }

  return orderedHeaders
}

module.exports = { getHeader, sortHeaders }
