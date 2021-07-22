'use strict'

const Meta = require('../helpers/meta')
const Token = require('../helpers/token')

module.exports = function (permissions, options) {
  return function (req, res, next) {
    Token.hasPermissions(req, permissions, options).then(function (user) {
      if (user) {
        // next()
        next()
        return true
      } else {
        return res.status(403).json({
          meta: Meta.response('forbidden_access', 403, [
            {
              param: '',
              message: req.__('error.unauthorized'),
              value: ''
            }
          ])
        })
      }
    }).catch(function (error) {
      console.log(error)
      return res.status(403).json({
        meta: Meta.response('forbidden_access', 403, [
          {
            param: '',
            message: req.__('error.unauthorized'),
            value: ''
          }
        ])
      })
    })
  }
}
