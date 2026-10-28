'use strict'

const uniqueRandomArray = require('unique-random-array')
const userAgents = require('top-user-agents')
const test = require('ava').default

const decorate = require('../hook')
const { UA } = require('./helpers')

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

test('reads a mixed-case user-agent that is not the first header', t => {
  const options = {
    https: {},
    headers: { accept: 'text/html', 'User-Agent': UA.CHROME }
  }

  decorate(options)

  t.is(options.https.minVersion, 'TLSv1')
})

test('keeps a caller ecdhCurve', t => {
  const options = {
    https: { ecdhCurve: 'X25519' },
    headers: { 'user-agent': UA.CHROME }
  }

  decorate(options)

  t.is(options.https.ecdhCurve, 'X25519')
  t.is(options.https.minVersion, 'TLSv1')
})

test('does not decorate when the caller already set a profile field', t => {
  const cases = [
    { ciphers: 'TLS_AES_128_GCM_SHA256' },
    { signatureAlgorithms: 'rsa_pkcs1_sha256' },
    { minVersion: 'TLSv1.2' },
    { maxVersion: 'TLSv1.2' }
  ]

  for (const https of cases) {
    const options = {
      https: { ...https },
      headers: { 'user-agent': UA.CHROME }
    }

    decorate(options)

    t.deepEqual(options.https, https)
  }
})

test('a caller secureProtocol keeps the profile without versions', t => {
  const options = {
    https: { secureProtocol: 'TLSv1_2_method' },
    headers: { 'user-agent': UA.CHROME }
  }

  decorate(options)

  t.is(options.https.secureProtocol, 'TLSv1_2_method')
  t.true(options.https.ciphers.startsWith('TLS_AES_128_GCM_SHA256'))
  t.false('minVersion' in options.https)
  t.false('maxVersion' in options.https)
})
