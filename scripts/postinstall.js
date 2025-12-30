'use strict'

const { writeFile } = require('fs/promises')

const URL =
  'https://raw.githack.com/apify/fingerprint-suite/master/packages/header-generator/src/data_files/headers-order.json'

fetch(URL)
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    return res.json()
  })
  .then(headersOrder =>
    writeFile('src/headers-order.json', JSON.stringify(headersOrder, null, 2))
  )
  .catch(error => console.error(error) || process.exit(1))
