const express = require('express')
const router = express.Router()
const { param, validationResult } = require('express-validator')
const { Sequelize } = require('sequelize')
const IwataConfig = require('../config/iwata')
const Pagination = require('../helpers/pagination')
const Meta = require('../helpers/meta')
const TokenHelper = require('../helpers/token')

const Models = require('../models/index')
const TicketType = Models.ticket_type

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
    sort.push(Sequelize.literal('name asc'))
  }
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  if (authenticatedUser) {
    try {
      let ticketTypes = await TicketType.findAndCountAll({
        where: {
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

      if (ticketTypes) {
        return res.json({
          data: ticketTypes.rows,
          pagination: Pagination.make(ticketTypes.count, ticketTypes.rows.length, limit, page, req._parsedOriginalUrl.query, req.originalUrl),
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

router.get('/:ticket_type_id', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  await param('ticket_type_id').notEmpty().trim().escape().custom(async (value) => {
    const existedType = await TicketType.findOne({
      where: {
        id: value,
        status: 'active'
      }
    })

    if (existedType) {
      return true
    } else {
      throw new Error('Condition type not found')
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
        let ticketType = await TicketType.findOne({
          where: {
            id: req.params.ticket_type_id,
            status: 'active'
          }
        })

        if (ticketType) {
          return res.json({
            data: ticketType,
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
