'use strict'
const TokenHelper = require('../helpers/token')
const Meta = require('../helpers/meta')
const moment = require('moment')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const Models = require('../models/index')
const UserToken = Models.user_token

module.exports = async (req, res, next) => {
  let jwtPayload = TokenHelper.decode(req)
  if (jwtPayload) {
    try {
      let userToken = await UserToken.findOne({
        where: {
          user_id: jwtPayload.id,
          jti: jwtPayload.jti,
          expires_at: {
            [Op.gt]: moment().format('YYYY-MM-DD HH:mm:ss')
          },
          revoked: 0
        }
      })

      if (userToken) {
        next()
      } else {
        return res.status(401).json({
          meta: Meta.response('unauthorized', 401, [{
            param: '',
            message: res.__('error.unauthorized'),
            value: ''
          }])
        })
      }
    } catch (error) {
      console.error(error)
      return res.status(401).json({
        meta: Meta.response('unauthorized', 401, [{
          param: '',
          message: res.__('error.unauthorized'),
          value: ''
        }])
      })
    }
  } else {
    return res.status(401).json({
      meta: Meta.response('unauthorized', 401, [{
        param: '',
        message: res.__('error.unauthorized'),
        value: ''
      }])
    })
  }
}
