'use strict'

const uniqueRandomArray = require('unique-random-array')
const userAgents = require('top-user-agents')
const test = require('ava').default
const { createSecureContext } = require('tls')

const tls = require('..')
const { UA } = require('./helpers')

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

test('does nothing if user agent is not present', t => {
  const https = tls()
  t.deepEqual(Object.keys(https), [])
})

test('caller options win over the browser profile', t => {
  const https = tls(UA.CHROME, {
    minVersion: 'TLSv1.2',
    ciphers: 'TLS_AES_128_GCM_SHA256',
    rejectUnauthorized: false
  })

  t.is(https.minVersion, 'TLSv1.2')
  t.is(https.ciphers, 'TLS_AES_128_GCM_SHA256')
  t.is(https.rejectUnauthorized, false)
  t.is(https.maxVersion, 'TLSv1.3')
  t.is(https.ecdhCurve, 'X25519:prime256v1:secp384r1')
})

test('unset caller options fall back to the browser profile', t => {
  const https = tls(UA.CHROME, { minVersion: undefined, ciphers: null })

  t.is(https.minVersion, 'TLSv1')
  t.true(https.ciphers.startsWith('TLS_AES_128_GCM_SHA256'))
})

test('does not mutate the caller options', t => {
  const callerOptions = { minVersion: 'TLSv1.2' }

  tls(UA.CHROME, callerOptions)

  t.deepEqual(callerOptions, { minVersion: 'TLSv1.2' })
})

test('a caller secureProtocol is not mixed with the profile versions', t => {
  const https = tls(UA.CHROME, { secureProtocol: 'TLSv1_2_method' })

  t.is(https.secureProtocol, 'TLSv1_2_method')
  t.false('minVersion' in https)
  t.false('maxVersion' in https)
  t.notThrows(() => createSecureContext(https))
})
