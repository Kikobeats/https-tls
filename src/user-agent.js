'use strict'

module.exports = (headers = {}) => {
  let userAgent

  for (const [header, value] of Object.entries(headers)) {
    if (header.toLowerCase() === 'user-agent') {
      userAgent = value
      break
    }
  }

  return userAgent
}
