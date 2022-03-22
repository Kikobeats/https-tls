'use strict'

const uniqueRandomArray = require('unique-random-array')
const userAgents = require('top-user-agents')
const test = require('ava')

const tls = require('..')

const randomUserAgent = uniqueRandomArray(userAgents)

test('get https details based on user agent', t => {
  const userAgent = randomUserAgent()
  const https = tls(userAgent)

  t.deepEqual(Object.keys(https), [
    'ciphers',
    'signatureAlgorithms',
    'ecdhCurve',
    'minVersion',
    'maxVersion'
  ])
})

test('does nothing if user agent is not presnet', t => {
  const https = tls()
  t.deepEqual(Object.keys(https), [])
})
