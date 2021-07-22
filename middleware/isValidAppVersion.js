'use strict'

const Models = require('../models/index')
const ApplicationVersion = Models.application_version
const ApplicationVersionType = Models.application_version_type
const IwataConfig = require('../config/iwata')
const Meta = require('../helpers/meta')

module.exports = function (req, res, next) {
  if (typeof req.headers[IwataConfig.application.header.version] !== 'undefined' && typeof req.headers[IwataConfig.application.header.apps] !== 'undefined') {
    if (req.headers[IwataConfig.application.header.version] === '__logs' && req.headers[IwataConfig.application.header.apps] === 'iwata-logs') {
      next()
    } else {
      return ApplicationVersion.findOne({
        where: {
          name: req.headers[IwataConfig.application.header.version]
        },
        include: [
          {
            required: true,
            model: ApplicationVersionType,
            where: {
              slug: req.headers[IwataConfig.application.header.apps]
            }
          }
        ]
      }).then((applicationVersion) => {
        if (applicationVersion) {
          if (applicationVersion.status === 'active' || applicationVersion.status === 'update_available') {
            next()
          } else if (applicationVersion.status === 'deprecated') {
            return res.status(400).json({
              data: applicationVersion,
              meta: Meta.response('application_deprecated', 400, [
                {
                  param: '',
                  message: req.__('failed.application_deprecated'),
                  value: ''
                }])
            })
          }
        } else {
          return res.status(400).json({
            meta: Meta.response('invalid_app_version', 400, [
              {
                param: '',
                message: req.__('invalid.app_version'),
                value: ''
              }])
          })
        }
      })
    }
  } else {
    // When app-version & app-type doesnt exist or not present
    return res.status(400).json({
      meta: Meta.response('invalid_app_version', 400, [
        {
          param: '',
          message: req.__('invalid.app_version'),
          value: ''
        }])
    })
  }
}
