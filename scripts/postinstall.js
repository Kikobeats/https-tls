'use strict'

const { main } = require('./update-headers-order')

const install = async ({ strict = false, ...options } = {}) => {
  try {
    await main(options)
  } catch (error) {
    if (strict) throw error
    console.warn(
      `https-tls: couldn't update headers order, using the bundled one (${error.message})`
    )
  }
}

if (require.main === module) {
  install({ strict: process.argv.includes('--strict') }).catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}

module.exports = { install }
