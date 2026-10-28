'use strict'

const { writeFile } = require('fs/promises')

const URL =
  'https://raw.githack.com/apify/fingerprint-suite/master/packages/header-generator/src/data_files/headers-order.json'

const isStrict = process.argv.includes('--strict')

fetch(URL)
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    return res.json()
  })
  .then(headersOrder =>
    writeFile('src/headers-order.json', JSON.stringify(headersOrder, null, 2))
  )
  .catch(error => {
    if (isStrict) {
      console.error(error)
      process.exit(1)
    }
    console.warn(
      `https-tls: couldn't update headers order, using the bundled one (${error.message})`
    )
  })
