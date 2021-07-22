'use strict'
const Promise = require('bluebird')

module.exports = {
  weeklyTarget: () => {
    const CronJob = require('cron').CronJob
    const Models = require('../models/index')
    // const IwataConfig = require('../config/iwata')
    const { Op } = require('sequelize')
    const SalesTarget = Models.sales_target
    const TargetDay = Models.target_day
    const moment = require('moment')

    let job = new CronJob({
      cronTime: '* * * * *', // 0 23 * * *
      onTick: async () => {
        let salesTargets = await SalesTarget.findAll({
          where: {
            is_weekly: 1,
            finished_at: {
              [Op.lt]: moment().startOf('week').format('YYYY-MM-DD HH:mm:ss')
            }
          },
          include: [
            {
              model: TargetDay,
              required: true
            }
          ]
        })

        if (salesTargets.length > 0) {
          let startedAt = moment().startOf('week').format('YYYY-MM-DD HH:mm:ss')
          let finishedAt = moment().endOf('week').format('YYYY-MM-DD HH:mm:ss')
          await Promise.map(salesTargets, async (salesTarget) => {
            let existedTarget = await SalesTarget.findOne({
              where: {
                user_id: salesTarget.user_id,
                finished_at: {
                  [Op.gte]: startedAt
                }
              }
            })

            let baseTarget = await SalesTarget.findOne({
              where: {
                user_id: salesTarget.user_id,
                is_weekly: 1,
                finished_at: {
                  [Op.lte]: startedAt
                },
                is_has_holiday: 0
              },
              include: [
                {
                  model: TargetDay,
                  required: true
                }
              ],
              order: [
                ['finished_at', 'desc']
              ]
            })

            if (!existedTarget && baseTarget) {
              let result = await SalesTarget.findOrCreate({
                where: {
                  user_id: salesTarget.user_id,
                  is_weekly: 1,
                  started_at: {
                    [Op.gte]: startedAt
                  },
                  finished_at: {
                    [Op.lte]: finishedAt
                  }
                },
                defaults: {
                  user_id: salesTarget.user_id,
                  started_at: startedAt,
                  finished_at: finishedAt,
                  is_weekly: 1
                }
              })

              if (result[0]) {
                let mappedTargetDays = await Promise.map(baseTarget.target_days, (target) => {
                  return {
                    day: target.day,
                    total_visitation: target.total_visitation,
                    total_new_order: target.total_new_order,
                    total_repeat_order: target.total_repeat_order,
                    total_omzet_new_order: target.total_omzet_new_order,
                    total_omzet_repeat_order: target.total_omzet_repeat_order,
                    sales_target_id: result[0].id,
                    is_holiday: target.is_holiday
                  }
                })

                await TargetDay.bulkCreate(mappedTargetDays)
              }
              console.log(startedAt)
              console.log(finishedAt)
            }
          })
        }
      },
      start: false,
      timeZone: 'Asia/Jakarta'
    })

    job.start()
    return function (req, res, next) {
      next()
    }
  }
}
