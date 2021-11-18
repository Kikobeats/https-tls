'use strict'

const getUserAgent = require('./src/user-agent')
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

  const userAgent = getUserAgent(options.headers)
  options.https = tls(userAgent, https)
}
