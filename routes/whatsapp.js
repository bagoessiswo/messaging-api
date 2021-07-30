const express = require('express')
const router = express.Router()
const { param, validationResult } = require('express-validator')

const Meta = require('../helpers/meta')
const { Op } = require('sequelize')
const { MessageMedia } = require('whatsapp-web.js')
const imageToBase64 = require('image-to-base64')

const Models = require('../models/index')
const Media = Models.media
const MessageNotification = Models.message_notification

router.post('/:message_id/send', async (req, res, next) => {
  const WA = req.app.locals.whatsappClient

  await param('message_id').notEmpty().trim().escape().custom(async (value) => {
    const existedMsg = await MessageNotification.findOne({
      where: {
        id: value
      }
    })

    if (existedMsg) {
      return true
    } else {
      throw new Error('Message not found')
    }
  }).run(req)
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    const message = await MessageNotification.findOne({
      where: {
        id: req.params.message_id
      }
    })
    try {
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
          await imageToBase64(detailMedia.src.original_url) // Image URL
            .then(async base64Image => {
              // console.log(base64Image) // "iVBORw0KGgoAAAANSwCAIA..."
              const media = new MessageMedia(`image/${detailMedia.format}`, base64Image)
              // chat.sendMessage(media, { caption: 'this is my caption' })
              await WA.on('ready', async () => {
                const chatId = `${message.to}@c.us`
                const text = message.message

                // Sending message.
                await WA.sendMessage(chatId, media, { caption: text }).then(async response => {
                  await MessageNotification.update({
                    status: 'success'
                  }, {
                    where: {
                      id: message.id
                    }
                  })
                  return res.json({
                    data: response,
                    meta: Meta.response('success', 200, [{
                      param: '',
                      message: res.__('failed.creating_data'),
                      value: ''
                    }])
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
                  return res.json({
                    meta: Meta.response('failed', 400, [{
                      param: '',
                      message: res.__('failed.creating_data'),
                      value: ''
                    }])
                  })
                })
              })
            })
            .catch(error => {
              console.log(error)
              return res.json({
                meta: Meta.response('failed', 400, [{
                  param: '',
                  message: res.__('failed.creating_data'),
                  value: ''
                }])
              })
            })
        } else {
          return res.json({
            meta: Meta.response('failed', 400, [{
              param: '',
              message: res.__('failed.creating_data'),
              value: ''
            }])
          })
        }
      } else {
        await WA.on('ready', async () => {
          const chatId = `${message.to}@c.us`
          const text = message.message

          // Sending message.
          await WA.sendMessage(chatId, text).then(async response => {
            await MessageNotification.update({
              status: 'success'
            }, {
              where: {
                id: message.id
              }
            })

            return res.json({
              data: response,
              meta: Meta.response('success', 200, [{
                param: '',
                message: res.__('failed.creating_data'),
                value: ''
              }])
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
            return res.json({
              meta: Meta.response('failed', 400, [{
                param: '',
                message: res.__('failed.creating_data'),
                value: ''
              }])
            })
          })
        })
      }
    } catch (error) {
      console.log(error)
      return res.json({
        meta: Meta.response('failed', 400, [{
          param: '',
          message: res.__('failed.creating_data'),
          value: ''
        }])
      })
    }
  }
})

module.exports = router
