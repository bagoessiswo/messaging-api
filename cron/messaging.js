'use strict'
const Promise = require('bluebird')

module.exports = {
  sendQueue: () => {
    const CronJob = require('cron').CronJob
    const Models = require('../models/index')
    const moment = require('moment')
    const { Op } = require('sequelize')
    // const WAService = require('../services/whatsapp')
    const MessageNotification = Models.message_notification
    const Axios = require('axios')
    const imageToBase64 = require('image-to-base64')
    // const Media = Models.media

    const job = new CronJob({
      cronTime: '* * * * *',
      onTick: async () => {
        try {
          const messageNotifs = await MessageNotification.findAll({
            where: {
              scheduled_at: {
                [Op.lte]: moment().format('YYYY-MM-DD HH:mm:ss')
              },
              status: 'pending',
            }
          })

          if (messageNotifs.length > 0) {
            await Promise.map(messageNotifs, async message => {
              let media = null
              //if (message.media !== null && message.media !== '') {
              //  await imageToBase64(message.media)
              //    .then(async base64Image => {
              //      media = {
              //        format: 'jpg',
              //        image: base64Image
              //      }
              //    })
              //}
              if (message.to.length > 4) {
                await Axios({
                  url: `${process.env.APP_URL}/v1/whatsapp/${message.id}/send`,
                  method: 'post',
                  data: {
                    mobile_phone: message.to,
                    text: message.message,
                    media: media,
                    robot: message.robot
                  }
                }).then(function (response) {
                  if (response.status === 200 || response.status === 201) {
                    console.log(response.status)
                  } else {
                    console.log(response.status)
                  }
                }).catch(function (error) {
                  console.log(error)
                })
              }
              return message
            })
          }
        } catch (error) {
          console.log(error)
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
