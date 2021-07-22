'use strict'
const Meta = require('@meta')
const QupasConfig = require('@config')
const _ = require('lodash')

module.exports = function (req, res, next) {
  if (typeof req.headers['origin'] === 'undefined') {
    return res.status(400).json({
      meta: Meta.response('request_not_allowed', 400, [
        {
          param: '',
          message: req.__('error.request_not_allowed'),
          value: ''
        }])
    })
  } else if (_.includes(QupasConfig.application.origins, req.headers['origin'])) {
    next()
  } else {
    return res.status(400).json({
      meta: Meta.response('request_not_allowed', 400, [
        {
          param: '',
          message: req.__('error.request_not_allowed'),
          value: ''
        }])
    })
  }
}
