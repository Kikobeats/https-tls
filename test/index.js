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
    maxVersion: 'TLSv1.2',
    ciphers: 'TLS_AES_128_GCM_SHA256',
    signatureAlgorithms: 'rsa_pkcs1_sha256',
    ecdhCurve: 'prime256v1',
    rejectUnauthorized: false
  })

  t.is(https.minVersion, 'TLSv1.2')
  t.is(https.maxVersion, 'TLSv1.2')
  t.is(https.ciphers, 'TLS_AES_128_GCM_SHA256')
  t.is(https.signatureAlgorithms, 'rsa_pkcs1_sha256')
  t.is(https.ecdhCurve, 'prime256v1')
  t.is(https.rejectUnauthorized, false)
})

test('null and undefined caller options fall back to the browser profile', t => {
  const profile = tls(UA.CHROME)

  t.deepEqual(
    tls(UA.CHROME, {
      ciphers: null,
      signatureAlgorithms: null,
      ecdhCurve: null,
      minVersion: null,
      maxVersion: null
    }),
    profile
  )

  t.deepEqual(
    tls(UA.CHROME, {
      ciphers: undefined,
      signatureAlgorithms: undefined,
      ecdhCurve: undefined,
      minVersion: undefined,
      maxVersion: undefined
    }),
    profile
  )
})

test('empty string caller options are kept', t => {
  const https = tls(UA.CHROME, {
    ciphers: '',
    signatureAlgorithms: '',
    ecdhCurve: '',
    minVersion: '',
    maxVersion: ''
  })

  t.is(https.ciphers, '')
  t.is(https.signatureAlgorithms, '')
  t.is(https.ecdhCurve, '')
  t.is(https.minVersion, '')
  t.is(https.maxVersion, '')
})

test('does not mutate the caller options', t => {
  const callerOptions = { minVersion: 'TLSv1.2' }

  tls(UA.CHROME, callerOptions)

  t.deepEqual(callerOptions, { minVersion: 'TLSv1.2' })
})

test('a caller secureProtocol is not mixed with the profile versions', t => {
  const https = tls(UA.CHROME, { secureProtocol: 'TLSv1_2_method' })

  t.is(https.secureProtocol, 'TLSv1_2_method')
  t.true(https.ciphers.startsWith('TLS_AES_128_GCM_SHA256'))
  t.false('minVersion' in https)
  t.false('maxVersion' in https)
  t.notThrows(() => createSecureContext(https))
})

test('a null secureProtocol still receives the profile versions', t => {
  const https = tls(UA.CHROME, { secureProtocol: null })

  t.is(https.secureProtocol, null)
  t.is(https.minVersion, 'TLSv1')
  t.is(https.maxVersion, 'TLSv1.3')
  t.notThrows(() => createSecureContext(https))
})

test('an empty secureProtocol does not receive the profile versions', t => {
  const https = tls(UA.CHROME, { secureProtocol: '' })

  t.is(https.secureProtocol, '')
  t.true(https.ciphers.startsWith('TLS_AES_128_GCM_SHA256'))
  t.false('minVersion' in https)
  t.false('maxVersion' in https)
})
