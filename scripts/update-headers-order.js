'use strict'

const { writeFile } = require('fs/promises')
const path = require('path')

const SOURCE_URL =
  'https://raw.githubusercontent.com/apify/fingerprint-suite/master/packages/header-generator/src/data_files/headers-order.json'

const DESTINATION = path.join(__dirname, '../src/headers-order.json')

const REQUIRED_BROWSERS = ['chrome', 'firefox', 'safari']

const isHeaderList = value =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(header => typeof header === 'string')

const assertHeadersOrder = headersOrder => {
  const invalid = REQUIRED_BROWSERS.filter(
    browser => !isHeaderList(headersOrder?.[browser])
  )
  if (invalid.length > 0) {
    throw new TypeError(`Unexpected headers order for: ${invalid.join(', ')}`)
  }
  return headersOrder
}

const main = async () => {
  const response = await fetch(SOURCE_URL)
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${SOURCE_URL}`)
  const headersOrder = assertHeadersOrder(await response.json())
  await writeFile(DESTINATION, JSON.stringify(headersOrder, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
