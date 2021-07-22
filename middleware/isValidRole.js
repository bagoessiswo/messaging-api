'use strict'

const Token = require('@token')
const Meta = require('@meta')

module.exports = function (roles, required = false) {
  return function (req, res, next) {
    Token.hasRoles(req, roles, required).then(function (user) {
      if (user) {
        next()
      } else {
        return res.status(401).json({
          meta: Meta.response('unauthorized', 401, [
            {
              param: '',
              message: req.__('error.unauthorized'),
              value: ''
            }])
        })
      }
    }).catch(function (error) {
      console.log(error)
      return res.status(401).json({
        meta: Meta.response('unauthorized', 401, [
          {
            param: '',
            message: req.__('error.unauthorized'),
            value: ''
          }])
      })
    })
  }
}
