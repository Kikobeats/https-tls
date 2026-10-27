'use strict'

const test = require('ava').default

const { sortHeaders, getHeader } = require('..')

const { UA } = require('./helpers')

const assertHeaders = (t, actual, expected) => {
  t.deepEqual(Object.keys(actual), Object.keys(expected))
  t.deepEqual(actual, expected)
}

test('.getHeader', t => {
  t.is(getHeader('user-agent', { 'user-agent': 'googlebot' }), 'googlebot')
  t.is(getHeader('user-agent', { 'User-Agent': 'googlebot' }), 'googlebot')
  t.is(
    getHeader('user-agent', {
      accept: 'a',
      'User-Agent': 'first',
      'user-agent': 'second'
    }),
    'first'
  )
  t.is(getHeader('user-agent', { accept: 'a', host: 'h' }), undefined)
  t.is(getHeader('User-Agent', { 'user-agent': 'googlebot' }), undefined)
  t.is(getHeader('user-agent', { accept: 'a', 'user-agent': '' }), '')
  t.throws(() => getHeader('user-agent', null), { instanceOf: TypeError })
  t.throws(() => getHeader('user-agent', undefined), { instanceOf: TypeError })
})

test('.sortHeaders', t => {
  assertHeaders(
    t,
    sortHeaders({
      'x-random': 'foo',
      'user-agent': UA.CHROME,
      referer: 'bar',
      accept: 'foo',
      Host: 'foo'
    }),
    {
      Host: 'foo',
      'user-agent': UA.CHROME,
      accept: 'foo',
      referer: 'bar',
      'x-random': 'foo'
    }
  )

  assertHeaders(
    t,
    sortHeaders({
      'x-random': 'foo',
      'user-agent': 'safari',
      referer: 'bar',
      accept: 'foo'
    }),
    {
      referer: 'bar',
      accept: 'foo',
      'user-agent': 'safari',
      'x-random': 'foo'
    }
  )
})

test('sortHeaders orders firefox headers', t => {
  assertHeaders(
    t,
    sortHeaders({
      'x-random': 'foo',
      'User-Agent': UA.FIREFOX,
      accept: 'foo',
      Host: 'foo'
    }),
    {
      Host: 'foo',
      'User-Agent': UA.FIREFOX,
      accept: 'foo',
      'x-random': 'foo'
    }
  )
})

test('sortHeaders keeps insertion order when no browser matches', t => {
  const headers = { 'z-last': '1', accept: 'a', Host: 'h' }
  const sorted = sortHeaders(headers)
  assertHeaders(t, sorted, { 'z-last': '1', accept: 'a', Host: 'h' })
  t.not(sorted, headers)

  assertHeaders(t, sortHeaders({ 'user-agent': '', accept: 'a', host: 'h' }), {
    'user-agent': '',
    accept: 'a',
    host: 'h'
  })
  assertHeaders(t, sortHeaders({}), {})
})

test('sortHeaders ignores an inherited user-agent', t => {
  const headers = Object.create({ 'user-agent': UA.CHROME, accept: 'inherited' })
  headers['x-own'] = 'yes'

  assertHeaders(t, sortHeaders(headers), { 'x-own': 'yes' })
})

test('sortHeaders copies inherited ordered headers and skips inherited extras', t => {
  const headers = Object.create({ accept: 'inherited', 'x-inherited': 'no' })
  headers['user-agent'] = UA.CHROME
  headers['x-own'] = 'yes'

  assertHeaders(t, sortHeaders(headers), {
    'user-agent': UA.CHROME,
    accept: 'inherited',
    'x-own': 'yes'
  })
})

test('sortHeaders keeps a casing that is not in the browser order', t => {
  assertHeaders(
    t,
    sortHeaders({
      host: 'lower',
      'user-agent': UA.CHROME,
      Host: 'upper'
    }),
    {
      Host: 'upper',
      'user-agent': UA.CHROME,
      host: 'lower'
    }
  )
})

test('sortHeaders reads an ordered header once', t => {
  let reads = 0
  const headers = { 'user-agent': UA.CHROME }
  Object.defineProperty(headers, 'accept', {
    enumerable: true,
    get () {
      reads += 1
      return 'foo'
    }
  })
  headers['x-random'] = 'z'

  assertHeaders(t, sortHeaders(headers), {
    'user-agent': UA.CHROME,
    accept: 'foo',
    'x-random': 'z'
  })
  t.is(reads, 1)
})

test('sortHeaders orders a null-prototype map', t => {
  const headers = Object.create(null)
  headers.Host = 'h'
  headers['x-random'] = 'z'
  headers['user-agent'] = UA.CHROME

  const sorted = sortHeaders(headers)
  assertHeaders(t, sorted, {
    Host: 'h',
    'user-agent': UA.CHROME,
    'x-random': 'z'
  })
  t.not(sorted, headers)
})

test('sortHeaders throws on null and undefined', t => {
  t.throws(() => sortHeaders(null), { instanceOf: TypeError })
  t.throws(() => sortHeaders(undefined), { instanceOf: TypeError })
})
