'use strict'

const { v4: uuidv4 } = require('uuid')

var responseId = ''
var ipAddress = ''
var userAgent = ''
var http = {}

http.generateId = function (req, res, next) {
  req.id = uuidv4()
  responseId = req.id
  ipAddress = req.ip
  userAgent = req.headers['user-agent']
  next()
}

http.getResponseId = function () {
  return responseId
}

http.getIpAddress = function () {
  return ipAddress
}

http.getUserAgent = function () {
  return userAgent
}

module.exports = http
