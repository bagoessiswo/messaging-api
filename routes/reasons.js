const express = require('express')
const router = express.Router()
const { param, validationResult } = require('express-validator')
const { Sequelize, Op } = require('sequelize')
const IwataConfig = require('../config/iwata')
const Pagination = require('../helpers/pagination')
const Meta = require('../helpers/meta')
const TokenHelper = require('../helpers/token')

const Models = require('../models/index')
const Reason = Models.reason

// Middleware
const isValidMethod = require('../middleware/isValidMethod')
const isValidAppVersion = require('../middleware/isValidAppVersion')
const isAuthenticated = require('../middleware/isAuthenticated')

router.get('/', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let limit = req.query.limit || IwataConfig.data.limit_pagination
  let page = req.query.page || 1
  let sort = []

  if (typeof req.query.sort !== 'undefined' && req.query.sort !== '') {
    sort.push(Sequelize.literal(req.query.sort))
  } else {
    sort.push(Sequelize.literal('updated_at desc, name asc'))
  }
  let authenticatedUser = await TokenHelper.getUser(req, res, next)
  let isBillingUser = await TokenHelper.hasRoles(req, ['billing'], true)

  let categoryFilter = {}
  if (isBillingUser) {
    categoryFilter = {
      id: {
        [Op.in]: ['0b48d367-bf96-11eb-8216-0aa66ecb6fa4', '0b48d624-bf96-11eb-8216-0aa66ecb6fa4', 'e6906fb3-b790-11eb-8216-0aa66ecb6fa4', '70984abf-cdc0-11eb-8216-0aa66ecb6fa4']
      }
    }
  }

  if (authenticatedUser) {
    try {
      let reasons = await Reason.findAndCountAll({
        where: {
          ...categoryFilter,
          status: 'active'
        },
        attributes: {
          exclude: ['created_at', 'deleted_at']
        },
        distinct: true,
        order: [sort],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * limit
      })

      if (reasons) {
        return res.json({
          data: reasons.rows,
          pagination: Pagination.make(reasons.count, reasons.rows.length, limit, page, req._parsedOriginalUrl.query, req.originalUrl),
          meta: Meta.response('success', 200, [
            {
              param: '',
              message: req.__('success.showing_data'),
              value: ''
            }])
        })
      } else {
        return res.json({
          data: [],
          pagination: Pagination.make(0, 0, 0, 0, req._parsedOriginalUrl.query, req.originalUrl),
          meta: Meta.response('success', 200, [
            {
              param: '',
              message: req.__('success.showing_data'),
              value: ''
            }])
        })
      }
    } catch (error) {
      console.error(error)
      return res.json({
        data: [],
        pagination: Pagination.make(0, 0, 0, 0, req._parsedOriginalUrl.query, req.originalUrl),
        meta: Meta.response('success', 200, [{
          param: '',
          message: res.__('success.showing_data'),
          value: ''
        }])
      })
    }
  } else {
    return res.json({
      data: [],
      pagination: Pagination.make(0, 0, 0, 0, req._parsedOriginalUrl.query, req.originalUrl),
      meta: Meta.response('success', 200, [{
        param: '',
        message: res.__('success.showing_data'),
        value: ''
      }])
    })
  }
})

router.get('/:reason_id', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  await param('reason_id').notEmpty().trim().escape().custom(async (value) => {
    const existedReason = await Reason.findOne({
      where: {
        id: value,
        status: 'active'
      }
    })

    if (existedReason) {
      return true
    } else {
      throw new Error('Reason not found')
    }
  }).run(req)
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.json({
      data: null,
      meta: Meta.response('success', 200, [{
        param: '',
        message: res.__('success.showing_data'),
        value: ''
      }])
    })
  } else {
    if (authenticatedUser) {
      try {
        let reason = await Reason.findOne({
          where: {
            id: req.params.reason_id,
            status: 'active'
          }
        })

        if (reason) {
          return res.json({
            data: reason,
            meta: Meta.response('success', 200, [
              {
                param: '',
                message: req.__('success.showing_data'),
                value: ''
              }])
          })
        } else {
          return res.json({
            data: null,
            meta: Meta.response('success', 200, [
              {
                param: '',
                message: req.__('success.showing_data'),
                value: ''
              }])
          })
        }
      } catch (error) {
        console.error(error)
        return res.json({
          data: null,
          meta: Meta.response('success', 200, [{
            param: '',
            message: res.__('success.showing_data'),
            value: ''
          }])
        })
      }
    } else {
      return res.json({
        data: null,
        meta: Meta.response('success', 200, [{
          param: '',
          message: res.__('success.showing_data'),
          value: ''
        }])
      })
    }
  }
})

module.exports = router
