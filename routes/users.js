const express = require('express')
const router = express.Router()
const Promise = require('bluebird')
const moment = require('moment')
const { validationResult } = require('express-validator')
const { Op } = require('sequelize')
const Meta = require('../helpers/meta')
const TokenHelper = require('../helpers/token')
const Axios = require('axios')
const Models = require('../models/index')
const User = Models.user
const VisitationPlan = Models.visitation_plan
const VisitationPlanReport = Models.visitation_plan_report
const VisitationPlanReportCategory = Models.visitation_plan_report_category
const SalesTarget = Models.sales_target
const TargetDay = Models.target_day

// Middleware
const isValidMethod = require('../middleware/isValidMethod')
const isValidAppVersion = require('../middleware/isValidAppVersion')
const isAuthenticated = require('../middleware/isAuthenticated')

/* GET users listing. */
router.get('/performance', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)
  let isAdminUser = await TokenHelper.hasRoles(req, ['super-administrator'], true)

  let visitConditions = {}
  let targetConditions = {}
  let userId = authenticatedUser.id
  if (req.query.user_id !== undefined && req.query.user_id !== '' && isAdminUser) {
    userId = req.query.user_id
  }
  console.log(userId)

  if (req.query.date_start !== undefined && req.query.date_start !== '' && req.query.date_finish !== undefined && req.query.date_finish !== '') {
    visitConditions = {
      checkin_at: {
        [Op.gte]: moment(req.query.date_start).format('YYYY-MM-DD 00:00:00')
      },
      checkout_at: {
        [Op.lte]: moment(req.query.date_finish).format('YYYY-MM-DD 23:59:59')
      },
      status: 'checkout'
    }

    targetConditions = {
      [Op.or]: {
        started_at: {
          [Op.gte]: moment(req.query.date_start).format('YYYY-MM-DD 00:00:00')
        },
        finished_at: {
          [Op.lte]: moment(req.query.date_finish).format('YYYY-MM-DD 23:59:59')
        }
      },
      status: 'active'
    }
  } else {
    visitConditions = {
      checkin_at: {
        [Op.gte]: moment().startOf('week').format('YYYY-MM-DD 00:00:00')
      },
      checkout_at: {
        [Op.lte]: moment().endOf('week').format('YYYY-MM-DD 23:59:59')
      },
      status: 'checkout'
    }

    targetConditions = {
      [Op.or]: {
        started_at: {
          [Op.gte]: moment().startOf('week').format('YYYY-MM-DD 00:00:00')
        },
        finished_at: {
          [Op.lte]: moment().endOf('week').format('YYYY-MM-DD 23:59:59')
        }
      },
      status: 'active'
    }
  }

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
        let visitations = await VisitationPlan.findAll({
          where: {
            visitation_plan_type_id: {
              [Op.not]: '17de9c8d-d33a-11eb-8216-0aa66ecb6fa4'
            },
            user_id: userId,
            ...visitConditions
          },
          include: [
            {
              model: User
            },
            {
              model: VisitationPlanReport,
              required: false,
              include: [
                {
                  model: VisitationPlanReportCategory,
                  required: false
                }
              ]
            }
          ],
          order: [
            ['checkin_at', 'asc']
          ]
        })

        if (visitations) {
          let salesTargets = await SalesTarget.findAll({
            where: {
              user_id: userId,
              ...targetConditions
            },
            include: [
              {
                model: TargetDay,
                required: true
              }
            ],
            order: [
              ['started_at', 'asc']
            ]
          })
          let mappedTargets = []
          await Promise.map(salesTargets, async (salesTarget) => {
            let startDate = moment(salesTarget.started_at)
            let finishDate = moment(salesTarget.finished_at)

            while (startDate <= finishDate) {
              let current = startDate.format('d')
              let targetDay = salesTarget.target_days.find(targetDay => parseInt(current) === targetDay.day)
              if (targetDay) {
                mappedTargets.push({
                  date: moment(startDate).format('DD-MM-YYYY'),
                  target: {
                    total_visitation: targetDay.total_visitation,
                    total_new_order: targetDay.total_new_order,
                    total_repeat_order: targetDay.total_repeat_order,
                    total_omzet_new_order: targetDay.total_omzet_new_order,
                    total_omzet_repeat_order: targetDay.total_omzet_repeat_order
                  }
                })
              } else {
                mappedTargets.push({
                  date: moment(startDate).format('DD-MM-YYYY'),
                  target: {
                    total_visitation: 0,
                    total_new_order: 0,
                    total_repeat_order: 0,
                    total_omzet_new_order: 0,
                    total_omzet_repeat_order: 0
                  }
                })
              }
              startDate = startDate.add(1, 'day')
            }
          })

          let oldDate = ''

          let totalVisitation = visitations.length
          let totalTarget = 0

          await Promise.map(visitations, async (visitation, index) => {
            let date = moment.utc(visitation.created_at).format('DD-MM-YYYY')
            if (date !== oldDate && oldDate !== '') {
              let targetDay = mappedTargets.find(targetDay => oldDate === targetDay.date)
              let totalTargetVisitation = 0

              if (targetDay !== undefined && targetDay !== '' && targetDay !== null) {
                totalTargetVisitation = targetDay.target.total_visitation
              }

              totalTarget = totalTarget + totalTargetVisitation
            } else if (date === oldDate && index === visitations.length - 1) {
              let targetDay = mappedTargets.find(targetDay => oldDate === targetDay.date)
              let totalTargetVisitation = 0

              if (targetDay !== undefined && targetDay !== '' && targetDay !== null) {
                totalTargetVisitation = targetDay.target.total_visitation
              }

              totalTarget = totalTarget + totalTargetVisitation
            }
            oldDate = date
          })

          let performance = {
            total_visitation: totalVisitation,
            total_target_visitation: totalTarget
          }
          return res.json({
            data: performance,
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

router.get('/performance/detail', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)
  let isAdminUser = await TokenHelper.hasRoles(req, ['super-administrator'], true)

  let visitConditions = {}
  let targetConditions = {}
  let userId = authenticatedUser.id
  if (req.query.user_id !== undefined && req.query.user_id !== '' && isAdminUser) {
    userId = req.query.user_id
  }
  console.log(userId)

  if (req.query.date_start !== undefined && req.query.date_start !== '' && req.query.date_finish !== undefined && req.query.date_finish !== '') {
    visitConditions = {
      checkin_at: {
        [Op.gte]: moment(req.query.date_start).format('YYYY-MM-DD 00:00:00')
      },
      checkout_at: {
        [Op.lte]: moment(req.query.date_finish).format('YYYY-MM-DD 23:59:59')
      },
      status: 'checkout'
    }

    targetConditions = {
      [Op.or]: {
        started_at: {
          [Op.gte]: moment(req.query.date_start).format('YYYY-MM-DD 00:00:00')
        },
        finished_at: {
          [Op.lte]: moment(req.query.date_finish).format('YYYY-MM-DD 23:59:59')
        }
      },
      status: 'active'
    }
  } else {
    visitConditions = {
      checkin_at: {
        [Op.gte]: moment().startOf('week').format('YYYY-MM-DD 00:00:00')
      },
      checkout_at: {
        [Op.lte]: moment().endOf('week').format('YYYY-MM-DD 23:59:59')
      },
      status: 'checkout'
    }

    targetConditions = {
      [Op.or]: {
        started_at: {
          [Op.gte]: moment().startOf('week').format('YYYY-MM-DD 00:00:00')
        },
        finished_at: {
          [Op.lte]: moment().endOf('week').format('YYYY-MM-DD 23:59:59')
        }
      },
      status: 'active'
    }
  }

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
        let visitations = await VisitationPlan.findAll({
          where: {
            visitation_plan_type_id: {
              [Op.not]: '17de9c8d-d33a-11eb-8216-0aa66ecb6fa4'
            },
            user_id: userId,
            ...visitConditions
          },
          include: [
            {
              model: User
            },
            {
              model: VisitationPlanReport,
              required: false,
              include: [
                {
                  model: VisitationPlanReportCategory,
                  required: false
                }
              ]
            }
          ],
          order: [
            ['checkin_at', 'asc']
          ]
        })

        if (visitations) {
          let salesTargets = await SalesTarget.findAll({
            where: {
              user_id: userId,
              ...targetConditions
            },
            include: [
              {
                model: TargetDay,
                required: true
              }
            ],
            order: [
              ['started_at', 'asc']
            ]
          })
          let mappedTargets = []
          await Promise.map(salesTargets, async (salesTarget) => {
            let startDate = moment(salesTarget.started_at)
            let finishDate = moment(salesTarget.finished_at)

            while (startDate <= finishDate) {
              let current = startDate.format('d')
              let targetDay = salesTarget.target_days.find(targetDay => parseInt(current) === targetDay.day)
              if (targetDay) {
                mappedTargets.push({
                  date: moment(startDate).format('DD-MM-YYYY'),
                  target: {
                    total_visitation: targetDay.total_visitation,
                    total_new_order: targetDay.total_new_order,
                    total_repeat_order: targetDay.total_repeat_order,
                    total_omzet_new_order: targetDay.total_omzet_new_order,
                    total_omzet_repeat_order: targetDay.total_omzet_repeat_order
                  }
                })
              } else {
                mappedTargets.push({
                  date: moment(startDate).format('DD-MM-YYYY'),
                  target: {
                    total_visitation: 0,
                    total_new_order: 0,
                    total_repeat_order: 0,
                    total_omzet_new_order: 0,
                    total_omzet_repeat_order: 0
                  }
                })
              }
              startDate = startDate.add(1, 'day')
            }
          })
          let performances = []
          let oldDate = ''

          let totalVisitation = 0
          let firstCheckin = ''
          let lastCheckout = ''
          await Promise.map(visitations, async (visitation, index) => {
            if (firstCheckin === '') {
              firstCheckin = moment.utc(visitation.checkin_at).format('HH:mm:ss')
            }

            let date = moment.utc(visitation.created_at).format('DD-MM-YYYY')
            if (date !== oldDate && oldDate !== '') {
              let targetDay = mappedTargets.find(targetDay => oldDate === targetDay.date)
              let totalTargetVisitation = 0

              if (targetDay !== undefined && targetDay !== '' && targetDay !== null) {
                totalTargetVisitation = targetDay.target.total_visitation
              }
              performances.push({
                date: oldDate,
                total_visitation: totalVisitation,
                checkin: firstCheckin,
                checkout: lastCheckout,
                total_target_visitation: totalTargetVisitation
              })

              firstCheckin = moment.utc(visitation.checkin_at).format('HH:mm:ss')
              totalVisitation = 0
              totalVisitation++
            } else if (date === oldDate && index === visitations.length - 1) {
              totalVisitation++

              let targetDay = mappedTargets.find(targetDay => oldDate === targetDay.date)
              let totalTargetVisitation = 0

              if (targetDay !== undefined && targetDay !== '' && targetDay !== null) {
                totalTargetVisitation = targetDay.target.total_visitation
              }
              performances.push({
                date: oldDate,
                total_visitation: totalVisitation,
                checkin: firstCheckin,
                checkout: lastCheckout,
                total_target_visitation: totalTargetVisitation
              })
            } else {
              totalVisitation++
            }
            oldDate = date
            lastCheckout = moment.utc(visitation.checkout_at).format('HH:mm:ss')
          })
          return res.json({
            data: performances,
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

router.get('/test', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let directionUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=-7.4071223,112.7705544&destination=-7.3521057,112.7643296&key=${process.env.GOOGLE_API_KEY}`

  return Axios({
    url: directionUrl,
    method: 'get'
  }).then(function (result) {
    console.log(result)
    return res.json(result.data)
  }).catch(function (error) {
    console.log(error)
    return res.json({})
  })
})

module.exports = router
