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
}

module.exports = { getHeader, sortHeaders }
