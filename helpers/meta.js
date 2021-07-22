'use strict'
let meta = {}
let http = require('../helpers/http')

meta.response = function (type, code, message) {
  return {type: type, code: code, response_id: http.getResponseId(), messages: message}
}

module.exports = meta
