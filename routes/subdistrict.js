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
const Subdistrict = Models.subdistrict
const Contact = Models.contact
const UserSubdistrict = Models.user_subdistrict

// Middleware
const isValidMethod = require('../middleware/isValidMethod')
const isValidAppVersion = require('../middleware/isValidAppVersion')
const isAuthenticated = require('../middleware/isAuthenticated')

router.get('/', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let limit = req.query.limit || IwataConfig.data.limit_pagination
  let page = req.query.page || 1
  let paginations = {}
  if (parseInt(limit) !== 0 && limit !== '') {
    paginations = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * limit
    }
  }
  let sort = []

  let conditions = {}
  // let contactConditions = {}
  let totalGeo = ''
  let contactRequired = false

  if (typeof req.query.sort !== 'undefined' && req.query.sort !== '') {
    sort.push(Sequelize.literal(req.query.sort))
  } else {
    sort.push(Sequelize.literal('total_contacts desc, '))
    sort.push(Sequelize.literal('name asc'))
  }

  if (typeof req.query.province_id !== 'undefined' && req.query.province_id !== '') {
    conditions.province_id = req.query.province_id
  }

  if (typeof req.query.city_id !== 'undefined' && req.query.city_id !== '') {
    conditions.city_id = req.query.city_id
  }

  if (typeof req.query.is_has_contact !== 'undefined' && req.query.is_has_contact !== '' && parseInt(req.query.is_has_contact) === 1) {
    contactRequired = true
  }

  if (typeof req.query.is_has_geo !== 'undefined' && req.query.is_has_geo !== '' && parseInt(req.query.is_has_geo) === 1) {
    // contactConditions = {
    //   latitude: {
    //     [Op.not]: null
    //   },
    //   longitude: {
    //     [Op.not]: null
    //   }
    // }
    totalGeo = ' AND c.longitude IS NOT NULL AND c.latitude IS NOT NULL'
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
    let subdistrictIds = await Promise.map(userArea, (area) => {
      return area.subdistrict_id
    })
    conditions.id = {
      [Op.in]: subdistrictIds
    }
  }

  if (authenticatedUser) {
    try {
      let subdistricts = await Subdistrict.findAndCountAll({
        where: {
          status: 'active',
          ...conditions
        },
        attributes: {
          include: [
            [Sequelize.literal(`(SELECT COUNT(c.id) FROM contacts c WHERE c.status = 'active' AND c.subdistrict_id=\`subdistrict\`.\`id\` ${totalGeo})`), 'total_contacts']
          ],
          exclude: ['created_at', 'deleted_at']
        },
        include: [
          {
            model: Contact,
            attributes: ['id'],
            required: contactRequired
          }
        ],
        distinct: true,
        order: [sort],
        ...paginations
      })

      if (subdistricts) {
        return Promise.map(subdistricts.rows, async (subdistrict) => {
          return subdistrict
        }).then((mappedSubdistricts) => {
          return res.json({
            data: mappedSubdistricts,
            pagination: Pagination.make(subdistricts.count, mappedSubdistricts.length, limit, page, req._parsedOriginalUrl.query, req.originalUrl),
            meta: Meta.response('success', 200, [
              {
                param: '',
                message: req.__('success.showing_data'),
                value: ''
              }])
          })
        }).catch((error) => {
          console.error(error)
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

router.get('/:subdistrict_id', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  await param('subdistrict_id').notEmpty().trim().escape().custom(async (value) => {
    const existedSubdistrict = await Subdistrict.findOne({
      where: {
        id: value,
        status: 'active'
      }
    })

    if (existedSubdistrict) {
      return true
    } else {
      throw new Error('Subdistrict not found')
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
        let subdistrict = await Subdistrict.findOne({
          where: {
            id: req.params.subdistrict_id,
            status: 'active'
          }
        })

        if (subdistrict) {
          return res.json({
            data: subdistrict,
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
