'use strict'

const fs = require('fs/promises')
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
  const browsers = [
    ...new Set([...REQUIRED_BROWSERS, ...Object.keys(headersOrder ?? {})])
  ]
  const invalid = browsers.filter(
    browser => !isHeaderList(headersOrder?.[browser])
  )
  if (invalid.length > 0) {
    throw new TypeError(`Unexpected headers order for: ${invalid.join(', ')}`)
  }
  return headersOrder
}

const writeAtomically = async (destination, content, io = fs) => {
  const temporary = `${destination}.${process.pid}.tmp`
  try {
    await io.writeFile(temporary, content)
    await io.rename(temporary, destination)
  } catch (error) {
    // A cleanup failure must not replace the write or rename error.
    await io.rm(temporary, { force: true }).catch(() => {})
    throw error
  }
}

const main = async ({ destination = DESTINATION, url = SOURCE_URL } = {}) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  const headersOrder = assertHeadersOrder(await response.json())
  await writeAtomically(destination, JSON.stringify(headersOrder, null, 2))
}

if (require.main === module) {
  main().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}

module.exports = { assertHeadersOrder, main, writeAtomically }
