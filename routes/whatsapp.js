const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')

const Meta = require('../helpers/meta')

router.post('/send-message', async (req, res, next) => {
  const WA = req.app.locals.whatsappClient

  if (req.body.mobile_phone !== undefined && req.body.mobile_phone !== '') {
    let mobilePhone = ((req.body.mobile_phone.replace(/-|,/g, '')).replace(/\+| |,/g, ''))
    if (parseInt(mobilePhone.charAt(0)) === 0) {
      mobilePhone = '62' + mobilePhone.slice(1)
    }
    req.body.mobile_phone = mobilePhone
  }
  await body('mobile_phone').trim().run(req)
  await body('text').notEmpty().run(req)

  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    try {
      await WA.on('ready', async () => {
        // Getting chatId from the number.
        // we have to delete "+" from the beginning and add "@c.us" at the end of the number.
        const chatId = `${req.body.mobile_phone}@c.us`
        // Your message.
        const text = req.body.text

        // Sending message.
        await WA.sendMessage(chatId, text).then(message => {
          return res.json({
            data: message,
            meta: Meta.response('success', 200, [{
              param: '',
              message: res.__('success.creating_data'),
              value: ''
            }])
          })
        })
      })
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

router.post('/logout', async (req, res, next) => {
  const WA = req.app.locals.whatsappClient

  try {
    await WA.on('ready', async () => {
      await WA.logout().then(message => {
        return res.json({
          meta: Meta.response('success', 200, [{
            param: '',
            message: res.__('success.creating_data'),
            value: ''
          }])
        })
      })
    })
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
})

module.exports = router
