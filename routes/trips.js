const express = require('express')
const router = express.Router()
const { body, param, validationResult } = require('express-validator')
const Promise = require('bluebird')
const moment = require('moment')
const { Sequelize, Op } = require('sequelize')
const geolib = require('geolib')
const IwataConfig = require('../config/iwata')
const Pagination = require('../helpers/pagination')
const Meta = require('../helpers/meta')
const TokenHelper = require('../helpers/token')

const Models = require('../models/index')
const Trip = Models.trip
const TripGeotag = Models.trip_geotag
const User = Models.user
const Contact = Models.contact
const VisitationPlan = Models.visitation_plan

// Middleware
const isValidMethod = require('../middleware/isValidMethod')
const isValidAppVersion = require('../middleware/isValidAppVersion')
const isAuthenticated = require('../middleware/isAuthenticated')

/* GET trips listing. */
router.post('/start', isValidMethod('POST'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  let isDriver = await TokenHelper.hasRoles(req, ['driver'], true)
  if (authenticatedUser) {
    try {
      const existingTrip = await Trip.findOne({
        where: {
          user_id: authenticatedUser.id,
          status: 'started',
          started_at: {
            [Op.gt]: moment().format('YYYY-MM-DD 00:00:00'),
            [Op.lt]: moment().format('YYYY-MM-DD 23:59:59')
          }
        }
      })

      if (existingTrip) {
        return res.status(400).json({
          meta: Meta.response('exist', 400, [{
            param: '',
            message: res.__('exist.trip'),
            value: ''
          }])
        })
      } else {
        try {
          let type = 'visitation'
          if (isDriver) {
            type = 'delivery'
          }
          let newTrip = await Trip.create({
            user_id: authenticatedUser.id,
            started_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            status: 'started',
            type: type
          })

          if (newTrip) {
            return res.json({
              data: newTrip,
              meta: Meta.response('success', 200, [{
                param: '',
                message: res.__('success.creating_data'),
                value: ''
              }])
            })
          } else {
            return res.status(400).json({
              meta: Meta.response('failed', 400, [{
                param: '',
                message: res.__('failed.creating_data'),
                value: ''
              }])
            })
          }
        } catch (error) {
          console.error(error)
          return res.status(400).json({
            meta: Meta.response('failed', 400, [{
              param: '',
              message: res.__('failed.creating_data'),
              value: ''
            }])
          })
        }
      }
    } catch (error) {
      console.error(error)
      return res.status(400).json({
        meta: Meta.response('error', 400, [{
          param: '',
          message: res.__('error.request_not_allowed'),
          value: ''
        }])
      })
    }
  } else {
    return res.status(400).json({
      meta: Meta.response('not_found', 400, [{
        param: '',
        message: res.__('not_found.user'),
        value: ''
      }])
    })
  }
})

router.put('/:trip_id/finish', isValidMethod('PUT'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)
  await param('trip_id').notEmpty().trim().escape().custom(async (value) => {
    const existedTrip = await Trip.findOne({
      where: {
        id: value,
        user_id: authenticatedUser.id
      }
    })

    if (existedTrip) {
      return true
    } else {
      throw new Error('Trip not found')
    }
  }).run(req)
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    if (authenticatedUser) {
      try {
        let userTrip = await Trip.findOne({
          where: {
            id: req.params.trip_id,
            user_id: authenticatedUser.id
          },
          attributes: {
            exclude: ['created_at', 'deleted_at']
          }
        })

        if (userTrip) {
          let finishedAt = moment().format('YYYY-MM-DD HH:mm:ss')
          try {
            let updateTrip = await Trip.update({
              finished_at: finishedAt,
              status: 'finished'
            }, {
              where: {
                id: req.params.trip_id,
                status: 'started'
              }
            })

            if (updateTrip) {
              return res.json({
                meta: Meta.response('success', 200, [{
                  param: '',
                  message: res.__('success.updating_data'),
                  value: ''
                }])
              })
            } else {
              return res.status(400).json({
                meta: Meta.response('failed', 400, [{
                  param: '',
                  message: res.__('failed.updating_data'),
                  value: ''
                }])
              })
            }
          } catch (error) {
            console.error(error)
            return res.status(400).json({
              meta: Meta.response('failed', 400, [{
                param: '',
                message: res.__('failed.updating_data'),
                value: ''
              }])
            })
          }
        } else {
          return res.status(400).json({
            meta: Meta.response('failed', 400, [{
              param: '',
              message: res.__('failed.updating_data'),
              value: ''
            }])
          })
        }
      } catch (error) {
        console.error(error)
        return res.status(400).json({
          meta: Meta.response('error', 400, [{
            param: '',
            message: res.__('error.request_not_allowed'),
            value: ''
          }])
        })
      }
    } else {
      return res.status(400).json({
        meta: Meta.response('not_found', 400, [{
          param: '',
          message: res.__('not_found.user'),
          value: ''
        }])
      })
    }
  }
})

router.put('/:trip_id/cancel', isValidMethod('PUT'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)
  await param('trip_id').notEmpty().trim().escape().custom(async (value) => {
    const existedTrip = await Trip.findOne({
      where: {
        id: value,
        user_id: authenticatedUser.id
      }
    })

    if (existedTrip) {
      return true
    } else {
      throw new Error('Trip not found')
    }
  }).run(req)

  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    if (authenticatedUser) {
      try {
        try {
          let updateTrip = await Trip.update({
            cancelled_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            status: 'cancelled'
          }, {
            where: {
              id: req.params.trip_id,
              status: 'started'
            }
          })

          if (updateTrip) {
            return res.json({
              meta: Meta.response('success', 200, [{
                param: '',
                message: res.__('success.updating_data'),
                value: ''
              }])
            })
          } else {
            return res.status(400).json({
              meta: Meta.response('failed', 400, [{
                param: '',
                message: res.__('failed.updating_data'),
                value: ''
              }])
            })
          }
        } catch (error) {
          console.error(error)
          return res.status(400).json({
            meta: Meta.response('failed', 400, [{
              param: '',
              message: res.__('failed.updating_data'),
              value: ''
            }])
          })
        }
      } catch (error) {
        console.error(error)
        return res.status(400).json({
          meta: Meta.response('error', 400, [{
            param: '',
            message: res.__('error.request_not_allowed'),
            value: ''
          }])
        })
      }
    } else {
      return res.status(400).json({
        meta: Meta.response('not_found', 400, [{
          param: '',
          message: res.__('not_found.user'),
          value: ''
        }])
      })
    }
  }
})

router.post('/geotag', isValidMethod('POST'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  await body('trip_id').notEmpty().trim().escape().custom(async (value) => {
    const existedTrip = await Trip.findOne({
      where: {
        id: value,
        user_id: authenticatedUser.id
      }
    })

    if (existedTrip) {
      return true
    } else {
      throw new Error('Trip not found')
    }
  }).run(req)
  await body('device_id').notEmpty().trim().escape().run(req)
  await body('geo_location').notEmpty().run(req)
  await body('geo_location.*.latitude').notEmpty().run(req)
  await body('geo_location.*.longitude').notEmpty().run(req)
  await body('geo_location.*.geo_time').notEmpty().run(req)
  await body('geo_location.*.visitation_plan_id').trim().escape().custom(async (value) => {
    if (value !== '' && value !== undefined) {
      const existedVisitationPlan = await VisitationPlan.findOne({
        where: {
          id: value,
          user_id: authenticatedUser.id
        }
      })

      if (existedVisitationPlan) {
        return true
      } else {
        throw new Error('Visitation plan not found')
      }
    } else {
      return true
    }
  }).run(req)

  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    if (authenticatedUser) {
      try {
        const newBulkGeoData = []
        return Promise.map(req.body.geo_location, async (geo) => {
          let geotag = {
            user_id: authenticatedUser.id,
            trip_id: req.body.trip_id,
            device_id: req.body.device_id,
            visitation_plan_id: geo.visitation_plan_id,
            latitude: geo.latitude,
            longitude: geo.longitude,
            geo_time: geo.geo_time
          }

          if (geo.visitation_plan_id === '' || geo.visitation_plan_id === undefined) {
            delete geotag.visitation_plan_id
          }

          let existGeo = await TripGeotag.findOne({
            where: {
              ...geotag
            }
          })

          if (!existGeo) {
            console.log('belum ada')
            newBulkGeoData.push(geotag)
          } else {
            console.log('kembar')
          }

          return geotag
        }).then(async (bulkGeoData) => {
          return TripGeotag.bulkCreate(newBulkGeoData).then(() => {
            return res.json({
              meta: Meta.response('success', 200, [{
                param: '',
                message: res.__('success.creating_data'),
                value: ''
              }])
            })
          }).catch((error) => {
            console.error(error)
            return res.status(400).json({
              meta: Meta.response('failed', 400, [{
                param: '',
                message: res.__('failed.creating_data'),
                value: ''
              }])
            })
          })
        })
      } catch (error) {
        console.error(error)
        return res.status(400).json({
          meta: Meta.response('error', 400, [{
            param: '',
            message: res.__('error.request_not_allowed'),
            value: ''
          }])
        })
      }
    } else {
      return res.status(400).json({
        meta: Meta.response('not_found', 400, [{
          param: '',
          message: res.__('not_found.user'),
          value: ''
        }])
      })
    }
  }
})

router.get('/', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let limit = req.query.limit || IwataConfig.data.limit_pagination
  let page = req.query.page || 1
  let sort = []

  let conditions = {}

  if (req.query.date_start !== undefined && req.query.date_start !== '' && req.query.date_finish !== undefined && req.query.date_finish !== '') {
    conditions.date = {
      [Op.gte]: moment(req.query.started_at).format('YYYY-MM-DD'),
      [Op.lte]: moment(req.query.started_at).format('YYYY-MM-DD')
    }
  }

  if (typeof req.query.sort !== 'undefined' && req.query.sort !== '') {
    sort.push(Sequelize.literal(req.query.sort))
  } else {
    sort.push(Sequelize.literal('created_at desc'))
  }
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  if (authenticatedUser) {
    try {
      let userTrips = await Trip.findAndCountAll({
        where: {
          user_id: authenticatedUser.id,
          ...conditions
        },
        include: [
          {
            model: User,
            attributes: {
              exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
            },
            required: true
          },
          {
            model: TripGeotag,
            where: {
              geo_time: {
                [Op.gte]: Sequelize.literal('`trip`.`started_at`'),
                [Op.lte]: Sequelize.literal('DATE_FORMAT(`trip`.`finished_at`, "%Y-%m-%d 16:15:00")')
                // [Op.lte]: moment().format('YYYY-03-24 15:00:00')
              }
            },
            attributes: {
              exclude: ['created_at', 'updated_at', 'deleted_at']
            },
            required: false
          }
        ],
        attributes: {
          exclude: ['deleted_at']
        },
        distinct: true,
        order: [sort],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * limit
      })

      if (userTrips) {
        return Promise.map(userTrips.rows, (userTrip) => {
          let geoTags = userTrip.trip_geotags.slice().sort((a, b) => b.geo_time - a.geo_time)
          let prevGeo = ''
          let totalDistance = 0

          userTrip.setDataValue('trip_geotags', geoTags)
          return Promise.map(geoTags, (geoTag) => {
            let { latitude, longitude } = geoTag
            if (prevGeo !== '') {
              totalDistance = totalDistance + geolib.getDistance(prevGeo, {
                latitude,
                longitude
              })
            }
            prevGeo = {
              latitude,
              longitude
            }
            return {
              latitude,
              longitude
            }
          }).then((mappedGeo) => {
            // let totalDistance = geolib.getPathLength([
            //   mappedGeo
            // ])
            console.log(mappedGeo)
            userTrip.setDataValue('total_distance', totalDistance)
            return userTrip
          }).catch((error) => {
            console.error(error)
            userTrip.setDataValue('total_distance', 0)
            return userTrip
          })
        }).then((mappedUserTrips) => {
          return res.json({
            data: mappedUserTrips,
            pagination: Pagination.make(userTrips.count, mappedUserTrips.length, limit, page, req._parsedOriginalUrl.query, req.originalUrl),
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

router.get('/:trip_id', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  await param('trip_id').notEmpty().trim().escape().custom(async (value) => {
    const existedTrip = await Trip.findOne({
      where: {
        id: value,
        user_id: authenticatedUser.id
      }
    })

    if (existedTrip) {
      return true
    } else {
      throw new Error('Trip not found')
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
        let userTrip = await Trip.findOne({
          where: {
            id: req.params.trip_id,
            user_id: authenticatedUser.id
          },
          include: [
            {
              model: User,
              attributes: {
                exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
              },
              required: true
            },
            {
              model: TripGeotag,
              attributes: {
                exclude: ['created_at', 'updated_at', 'deleted_at']
              },
              include: [
                {
                  model: VisitationPlan,
                  attributes: {
                    exclude: ['created_at', 'deleted_at']
                  },
                  include: [
                    {
                      model: Contact,
                      required: true
                    }
                  ],
                  required: false
                }
              ],
              required: false
            }
          ],
          attributes: {
            exclude: ['deleted_at']
          }
        })

        if (userTrip) {
          let geoTags = userTrip.trip_geotags.slice().sort((a, b) => b.geo_time - a.geo_time)
          let prevGeo = ''
          let totalDistance = 0
          userTrip.setDataValue('trip_geotags', geoTags)
          return Promise.map(geoTags, (geoTag) => {
            let { latitude, longitude } = geoTag

            if (prevGeo !== '') {
              totalDistance = totalDistance + geolib.getDistance(prevGeo, {
                latitude,
                longitude
              })
            }
            prevGeo = {
              latitude,
              longitude
            }
            return {
              latitude,
              longitude
            }
          }).then((mappedGeo) => {
            userTrip.setDataValue('total_distance', totalDistance)
            return res.json({
              data: userTrip,
              meta: Meta.response('success', 200, [
                {
                  param: '',
                  message: req.__('success.showing_data'),
                  value: ''
                }])
            })
          }).catch((error) => {
            console.error(error)
            userTrip.setDataValue('total_distance', 0)
            return res.json({
              data: userTrip,
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
