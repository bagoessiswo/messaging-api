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
    const Media = Models.media

    const job = new CronJob({
      cronTime: '*/2 * * * *',
      onTick: async () => {
        try {
          const messageNotifs = await MessageNotification.findAll({
            where: {
              scheduled_at: {
                [Op.lte]: moment().format('YYYY-MM-DD HH:mm:ss')
              },
              status: 'pending'
            }
          })

          if (messageNotifs.length > 0) {
            await Promise.map(messageNotifs, async message => {
              // await WAService.sendMessage(message.id).then(result => {
              //   console.log(result)
              // }).catch(error => {
              //   console.log(error)
              // })
              let media = null
              if (message.media !== null && message.media !== '') {
                const detailMedia = await Media.findOne({
                  where: {
                    [Op.or]: [
                      {
                        id: message.media

                      },
                      {
                        src: message.media
                      }
                    ]
                  }
                })

                if (detailMedia) {
                  await imageToBase64(detailMedia.src.original_url)
                    .then(async base64Image => {
                      media = {
                        format: detailMedia.format,
                        image: base64Image
                      }
                    })
                }
              }
              await Axios({
                url: `${process.env.APP_URL}/v1/whatsapp/${message.id}/send`,
                method: 'post',
                data: {
                  mobile_phone: message.to,
                  text: message.message,
                  media: media
                }
              }).then(function (response) {
                if (response.status === 200 || response.status === 201) {
                  console.log(response.data)
                } else {
                  console.log(response.data)
                }
              }).catch(function (error) {
                console.log(error)
              })
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
