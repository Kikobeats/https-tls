'use strict'

const { sortHeaders, getHeader } = require('./headers')
const getBrowser = require('./browser')

const ecdhCurve = {
  firefox: [
    'X25519',
    'prime256v1',
    'secp384r1',
    'secp521r1',
    'ffdhe2048',
    'ffdhe3072'
  ].join(':'),
  chrome: ['X25519', 'prime256v1', 'secp384r1'].join(':'),
  safari: ['X25519', 'prime256v1', 'secp384r1', 'secp521r1'].join(':')
}

const sigalgs = {
  firefox: [
    'ecdsa_secp256r1_sha256',
    'ecdsa_secp384r1_sha384',
    'ecdsa_secp521r1_sha512',
    'rsa_pss_rsae_sha256',
    'rsa_pss_rsae_sha384',
    'rsa_pss_rsae_sha512',
    'rsa_pkcs1_sha256',
    'rsa_pkcs1_sha384',
    'rsa_pkcs1_sha512',
    'ECDSA+SHA1',
    'rsa_pkcs1_sha1'
  ].join(':'),
  chrome: [
    'ecdsa_secp256r1_sha256',
    'rsa_pss_rsae_sha256',
    'rsa_pkcs1_sha256',
    'ecdsa_secp384r1_sha384',
    'rsa_pss_rsae_sha384',
    'rsa_pkcs1_sha384',
    'rsa_pss_rsae_sha512',
    'rsa_pkcs1_sha512'
  ].join(':'),
  safari: [
    'ecdsa_secp256r1_sha256',
    'rsa_pss_rsae_sha256',
    'rsa_pkcs1_sha256',
    'ecdsa_secp384r1_sha384',
    'ECDSA+SHA1',
    'rsa_pss_rsae_sha384',
    'rsa_pkcs1_sha384',
    'rsa_pss_rsae_sha512',
    'rsa_pkcs1_sha512',
    'RSA+SHA1'
  ].join(':')
}

const knownCiphers = {
  chrome: [
    // Chrome v92
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305',
    // Legacy:
    'ECDHE-RSA-AES128-SHA',
    'ECDHE-RSA-AES256-SHA',
    'AES128-GCM-SHA256',
    'AES256-GCM-SHA384',
    'AES128-SHA',
    'AES256-SHA'
  ].join(':'),
  firefox: [
    // Firefox v91
    'TLS_AES_128_GCM_SHA256',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    // Legacy:
    'ECDHE-ECDSA-AES256-SHA',
    'ECDHE-ECDSA-AES128-SHA',
    'ECDHE-RSA-AES128-SHA',
    'ECDHE-RSA-AES256-SHA',
    'AES128-GCM-SHA256',
    'AES256-GCM-SHA384',
    'AES128-SHA',
    'AES256-SHA',
    'DES-CBC3-SHA'
  ].join(':'),
  safari: [
    // Safari v14
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-CHACHA20-POLY1305',
    // Legacy:
    'ECDHE-ECDSA-AES256-SHA384',
    'ECDHE-ECDSA-AES128-SHA256',
    'ECDHE-ECDSA-AES256-SHA',
    'ECDHE-ECDSA-AES128-SHA',
    'ECDHE-RSA-AES256-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA',
    'ECDHE-RSA-AES128-SHA',
    'AES256-GCM-SHA384',
    'AES128-GCM-SHA256',
    'AES256-SHA256',
    'AES128-SHA256',
    'AES256-SHA',
    'AES128-SHA',
    'ECDHE-ECDSA-DES-CBC3-SHA',
    'ECDHE-RSA-DES-CBC3-SHA',
    'DES-CBC3-SHA'
  ].join(':')
}

const minVersion = {
  firefox: 'TLSv1.2',
  chrome: 'TLSv1',
  safari: 'TLSv1.2'
}

const maxVersion = {
  firefox: 'TLSv1.3',
  chrome: 'TLSv1.3',
  safari: 'TLSv1.3'
}

module.exports = (userAgent, httpsOpts) => {
  const https = Object.assign({}, httpsOpts)
  const browser = getBrowser(userAgent)

  if (browser in knownCiphers) {
    https.ciphers = knownCiphers[browser]
    https.signatureAlgorithms = sigalgs[browser]
    https.ecdhCurve = ecdhCurve[browser]
    https.minVersion = minVersion[browser]
    https.maxVersion = maxVersion[browser]
  }

  return https
}

module.exports.getHeader = getHeader
module.exports.getBrowser = getBrowser
module.exports.sortHeaders = sortHeaders
