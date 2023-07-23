'use strict'

const uniqueRandomArray = require('unique-random-array')
const userAgents = require('top-user-agents')
const test = require('ava')

const decorate = require('../hook')

const randomUserAgent = uniqueRandomArray(userAgents)

test('decorate with https details', t => {
  const options = { https: {}, headers: { 'user-agent': randomUserAgent() } }

  decorate(options)

  t.deepEqual(Object.keys(options.https), [
    'ciphers',
    'signatureAlgorithms',
    'ecdhCurve',
    'minVersion',
    'maxVersion'
  ])
})

test('does nothing if user agent is not present', t => {
  const options = { https: {}, headers: {} }

  decorate(options)

  t.deepEqual(Object.keys(options.https), [])
})
