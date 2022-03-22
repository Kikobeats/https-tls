'use strict'

const getBrowser = require('./browser')

const HEADERS_ORDER = {
  safari: [
    'cookie',
    'Cookie',
    'Connection',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'upgrade-insecure-requests',
    'Upgrade-Insecure-Requests',
    'accept',
    'Accept',
    'accept-encoding',
    'Accept-Encoding',
    'user-agent',
    'User-Agent',
    'accept-language',
    'Accept-Language',
    'referer',
    'Referer',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-user',
    'sec-fetch-dest',
    'Sec-Fetch-Mode',
    'Sec-Fetch-Dest',
    'Sec-Fetch-Site',
    'Sec-Fetch-User',
    'dnt',
    'DNT',
    'te'
  ],
  chrome: [
    'Connection',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'upgrade-insecure-requests',
    'Upgrade-Insecure-Requests',
    'dnt',
    'DNT',
    'user-agent',
    'User-Agent',
    'accept',
    'Accept',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-user',
    'sec-fetch-dest',
    'Sec-Fetch-Mode',
    'Sec-Fetch-Dest',
    'Sec-Fetch-Site',
    'Sec-Fetch-User',
    'referer',
    'Referer',
    'accept-encoding',
    'Accept-Encoding',
    'accept-language',
    'Accept-Language',
    'te',
    'cookie',
    'Cookie'
  ],
  firefox: [
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'user-agent',
    'User-Agent',
    'accept',
    'Accept',
    'accept-language',
    'Accept-Language',
    'accept-encoding',
    'Accept-Encoding',
    'dnt',
    'DNT',
    'referer',
    'Referer',
    'cookie',
    'Cookie',
    'Connection',
    'upgrade-insecure-requests',
    'Upgrade-Insecure-Requests',
    'te',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-user',
    'sec-fetch-dest',
    'Sec-Fetch-Mode',
    'Sec-Fetch-Dest',
    'Sec-Fetch-Site',
    'Sec-Fetch-User'
  ]
}

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
  const orderedSample = {}

  for (const attribute of order) {
    if (attribute in headers) {
      orderedSample[attribute] = headers[attribute]
    }
  }

  for (const attribute of Object.keys(headers)) {
    if (!order.includes(attribute)) {
      orderedSample[attribute] = headers[attribute]
    }
  }

  return orderedSample
}

module.exports = { getHeader, sortHeaders }
