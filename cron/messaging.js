'use strict'
const Promise = require('bluebird')

module.exports = {
  sendQueue: () => {
    const CronJob = require('cron').CronJob
    const Models = require('../models/index')
    // const IwataConfig = require('../config/iwata')
    const moment = require('moment')
    const { Op } = require('sequelize')
    const MessageNotification = Models.message_notification

    const job = new CronJob({
      cronTime: '* * * * *',
      onTick: async (req) => {
        const messageNotifs = await MessageNotification.findAll({
          where: {
            scheduled_at: {
              [Op.lte]: moment.utc().format('YYYY-MM-DD HH:mm:ss')
            },
            status: 'pending'
          }
        })

        if (messageNotifs.length > 0) {
          const WA = req.app.locals.whatsappClient
          await Promise.map(messageNotifs, async message => {
            await WA.on('ready', async () => {
              // Getting chatId from the number.
              // we have to delete "+" from the beginning and add "@c.us" at the end of the number.
              const chatId = `${message.to}@c.us`
              // Your message.
              const text = message.message

              // Sending message.
              await WA.sendMessage(chatId, text).then(async message => {
                await MessageNotification.update({
                  status: 'success'
                }, {
                  where: {
                    id: message.id
                  }
                })
              }).catch(async error => {
                console.log(error)
                await MessageNotification.update({
                  status: 'failed'
                }, {
                  where: {
                    id: message.id
                  }
                })
              })
            })
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
