# https-tls

![Last version](https://img.shields.io/github/tag/Kikobeats/https-tls.svg?style=flat-square)
[![Coverage Status](https://img.shields.io/coveralls/Kikobeats/https-tls.svg?style=flat-square)](https://coveralls.io/github/Kikobeats/https-tls)
[![NPM Status](https://img.shields.io/npm/dm/https-tls.svg?style=flat-square)](https://www.npmjs.org/package/https-tls)

> Setup HTTPS details related to TLS according to the User Agent provided. Source code from [got-scraping](https://github.com/apify/got-scraping).

## Install

```bash
$ npm install https-tls --save
```

## Usage

```js
'use strict'

const uniqueRandomArray = require('unique-random-array')
const userAgents = require('top-user-agents')
const tls = require('https-tls')

const randomUserAgent = uniqueRandomArray(userAgents)

const userAgent = randomUserAgent()
const https = tls(userAgent)

console.log(https)
// {
//   ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:…',
//   signatureAlgorithms: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256…',
//   ecdhCurve: 'X25519:prime256v1:secp384r1',
//   minVersion: 'TLSv1',
//   maxVersion: 'TLSv1.3'
// }
```

You can also setup it as [got hook](https://github.com/sindresorhus/got/tree/v11.8.3#hooks):

```js
'use strict'

const got = require('got')
const tlsHook = require('https-tls/hook')

const instance = got.extend({
  hooks: {
    beforeRequest: [
      tlsHook
    ]
  }
})
```

## License

**https-tls** © [Kiko Beats](https://kikobeats.com), released under the [MIT](https://github.com/Kikobeats/https-tls/blob/master/LICENSE.md) License.<br>
Authored and maintained by [Kiko Beats](https://kikobeats.com) with help from [contributors](https://github.com/Kikobeats/https-tls/contributors).

> [kikobeats.com](https://kikobeats.com) · GitHub [Kiko Beats](https://github.com/Kikobeats) · Twitter [@Kikobeats](https://twitter.com/Kikobeats)
