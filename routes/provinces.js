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
const Province = Models.province
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

  if (isOutsourcedUser && userArea.length > 0) {
    let provinceIds = await Promise.map(userArea, (area) => {
      return area.subdistrict.province_id
    })
    conditions.id = {
      [Op.in]: provinceIds
    }
  }

  if (authenticatedUser) {
    try {
      let provinces = await Province.findAndCountAll({
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

      if (provinces) {
        return res.json({
          data: provinces.rows,
          pagination: Pagination.make(provinces.count, provinces.rows.length, limit, page, req._parsedOriginalUrl.query, req.originalUrl),
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

router.get('/:province_id', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
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

  await param('province_id').notEmpty().trim().escape().custom(async (value) => {
    if (isOutsourcedUser && userArea.length > 0) {
      let province = userArea.filter(area => {
        return parseInt(value) === area.subdistrict.province_id
      })
      if (province.length < 0) {
        throw new Error('Province not found')
      }
    }

    const existedProvince = await Province.findOne({
      where: {
        id: value,
        status: 'active'
      }
    })

    if (existedProvince) {
      return true
    } else {
      throw new Error('Province not found')
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
        let province = await Province.findOne({
          where: {
            id: req.params.province_id,
            status: 'active'
          }
        })

        if (province) {
          return res.json({
            data: province,
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
