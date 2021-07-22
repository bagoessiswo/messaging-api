const express = require('express')
const router = express.Router()
const Promise = require('bluebird')
const { param, validationResult } = require('express-validator')
const { Sequelize, Op } = require('sequelize')
const IwataConfig = require('../config/iwata')
const Pagination = require('../helpers/pagination')
const Meta = require('../helpers/meta')
const TokenHelper = require('../helpers/token')

const Models = require('../models/index')
const City = Models.city
const UserSubdistrict = Models.user_subdistrict
const Subdistrict = Models.subdistrict

// Middleware
const isValidMethod = require('../middleware/isValidMethod')
const isValidAppVersion = require('../middleware/isValidAppVersion')
const isAuthenticated = require('../middleware/isAuthenticated')

router.get('/', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let limit = req.query.limit || IwataConfig.data.limit_pagination
  let page = req.query.page || 1
  let sort = []

  let conditions = {}

  if (typeof req.query.sort !== 'undefined' && req.query.sort !== '') {
    sort.push(Sequelize.literal(req.query.sort))
  } else {
    sort.push(Sequelize.literal('name asc'))
  }

  let authenticatedUser = await TokenHelper.getUser(req, res, next)
  let isOutsourcedUser = await TokenHelper.hasRoles(req, ['outsource'], true)

  let userArea = await UserSubdistrict.findAll({
    where: {
      status: 'active',
      user_id: authenticatedUser.id
    },
    include: [
      {
        model: Subdistrict,
        required: true
      }
    ]
  })

  if (typeof req.query.province_id !== 'undefined' && req.query.province_id !== '') {
    conditions.province_id = req.query.province_id
  }

  if (isOutsourcedUser && userArea.length > 0) {
    let cityIds = await Promise.map(userArea, (area) => {
      return area.subdistrict.city_id
    })
    conditions.id = {
      [Op.in]: cityIds
    }
  }

  if (authenticatedUser) {
    try {
      let cities = await City.findAndCountAll({
        where: {
          status: 'active',
          ...conditions
        },
        attributes: {
          exclude: ['created_at', 'deleted_at']
        },
        distinct: true,
        order: [sort],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * limit
      })

      if (cities) {
        return res.json({
          data: cities.rows,
          pagination: Pagination.make(cities.count, cities.rows.length, limit, page, req._parsedOriginalUrl.query, req.originalUrl),
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

router.get('/:city_id', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  let isOutsourcedUser = await TokenHelper.hasRoles(req, ['outsource'], true)

  let userArea = await UserSubdistrict.findAll({
    where: {
      status: 'active',
      user_id: authenticatedUser.id
    },
    include: [
      {
        model: Subdistrict,
        required: true
      }
    ]
  })

  await param('city_id').notEmpty().trim().escape().custom(async (value) => {
    if (isOutsourcedUser && userArea.length > 0) {
      let city = userArea.filter(area => {
        return parseInt(value) === area.subdistrict.city_id
      })
      if (city.length <= 0) {
        throw new Error('City not found')
      }
    }
    const existedCity = await City.findOne({
      where: {
        id: value,
        status: 'active'
      }
    })

    if (existedCity) {
      return true
    } else {
      throw new Error('City not found')
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
        let city = await City.findOne({
          where: {
            id: req.params.city_id,
            status: 'active'
          }
        })

        if (city) {
          return res.json({
            data: city,
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
