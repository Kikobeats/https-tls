'use strict'

const { getHeader } = require('./src/headers')
const tls = require('.')

module.exports = options => {
  const { https } = options

  if (
    https.ciphers ||
    https.signatureAlgorithms ||
    https.minVersion ||
    https.maxVersion
  ) {
    return
  }

  const userAgent = getHeader('user-agent', options.headers)

  options.https = tls(userAgent, https)
}
