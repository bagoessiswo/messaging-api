'use strict'

const Meta = require('../helpers/meta')

const methods = (methods) => {
  return function (req, res, next) {
    if (methods === undefined) {
      methods = ['GET']
      if (methods.includes(req.header)) {
        next()
      }
    } else {
      if (methods.includes(req.method)) {
        next()
      } else {
        return res.status(405).json({
          meta: Meta.response('method_not_allowed', 405, [
            {
              param: '',
              message: 'Method ' + req.method +
              ' for the "' + req.originalUrl + '" route is not supported',
              value: ''
            }])
        })
      }
    }
  }
}

module.exports = methods
