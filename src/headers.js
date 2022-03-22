'use strict'

const getHeader = (key, headers) => {
  let result

  for (const [header, value] of Object.entries(headers)) {
    if (header.toLowerCase() === key) {
      result = value
      break
    }
  }

  return result
}

module.exports = { getHeader }
