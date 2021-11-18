'use strict'

const tls = require('./src')

module.exports = (userAgent, httpsOpts) => ({
  https: tls(userAgent, httpsOpts)
})
