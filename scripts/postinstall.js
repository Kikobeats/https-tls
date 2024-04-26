'use strict'

const { writeFile } = require('fs/promises')

fetch('https://raw.githack.com/apify/fingerprint-suite/master/packages/header-generator/src/data_files/headers-order.json')
  .then(res => res.json())
  .then(headersOrder => writeFile('src/headers-order.json', JSON.stringify(headersOrder, null, 2)))
  .catch(error => console.error(error) || process.exit(1))
