require('dotenv').config()

const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const logger = require('morgan')
const cors = require('cors')
const http = require('./helpers/http')
const helmet = require('helmet')
const i18n = require('i18n')
const qrcode = require('qrcode-terminal')
const app = express()

const { param, body, validationResult } = require('express-validator')

const Meta = require('./helpers/meta')
const { MessageMedia } = require('whatsapp-web.js')

const Models = require('./models/index')
const MessageNotification = Models.message_notification
const JobstreetApplicant = Models.jobstreet_applicant
let INTERVIEW_LINK = 'https://task.iwata.id/interview'
const fs = require('fs')

const { Client, LocalAuth } = require('whatsapp-web.js')
const SESSION_FILE_PATH2 = './.wwebjs_auth2'
const SESSION_FILE_PATH = './.wwebjs_auth'
function connectWA (robot = 1, forceNewSession = false) {
  let client = null

  if (robot === 1) {
    client = new Client({
      authStrategy: new LocalAuth({
        clientId: "client-one",
        qrTimeoutMs: 0,
        dataPath: SESSION_FILE_PATH
      })
    })
  }

 // if (robot === 2) {
 //   client = new Client({
 //     authStrategy: new LocalAuth({
 //       clientId: "client-two",
 //       qrTimeoutMs: 0,
 //       dataPath: SESSION_FILE_PATH2
 //     })
 //   })
 // }
  client.initialize()
  client.on('qr', (qr) => {
    console.log('QR Robot '+robot)
    qrcode.generate(qr, { small: true })
  })
  client.on('authenticated', (session) => {
    console.log('Connected')
  })
  client.on('ready', () => {
    console.log('WWebJS v', require('whatsapp-web.js').version)
    console.log('Client '+robot+' is ready!')
  })

  client.on('change_state', state => {
    console.log('CHANGE STATE', state)
  })

  client.on('disconnected', (reason) => {
    console.log('Client '+robot+' was logged out', reason)
  })

  client.on('message', async msg => {
    const chatInfo = await msg.getChat();
    if(msg.body === 'bersedia' || msg.body === 'Bersedia') {
      let mobilePhone = ((chatInfo.id.user.replace(/-|,/g, '')).replace(/\+| |,/g, ''))
      //if (parseInt(mobilePhone.charAt(0)) === 6 && parseInt(mobilePhone.charAt(1) === 2)) {
      // 	console.log('ok')
      //  mobilePhone = '0' + mobilePhone.slice(2)
      //}
      mobilePhone = '0' + mobilePhone.slice(2)
      // console.log(mobilePhone)
      if (robot === 2 || robot === 1) {
        await JobstreetApplicant.update({
          is_responded: 1
        }, {
          where: {
            mobile_phone: mobilePhone
          }
        })
      }
    }

    if(msg.body === '!info') {
      console.log(chatInfo)
      await client.sendMessage(msg.from, 'info: ' + msg.from);
    }

  })

  client.on('change_battery', (batteryInfo) => {
    // Battery percentage for attached device has changed
    const { battery, plugged } = batteryInfo;
    console.log(`Battery: ${battery}% - Charging? ${plugged}`);
  });
  // client.on('auth_failure', (reason) => {
  //   sessionData = null
  //   try {
  //     // Destroy actual browser
  //     client.destroy()

  //     // delete session path
  //     fs.rmdirSync(SESSION_FILE_PATH, { recursive: true })

  //     // Send command to restart the instance
  //     setTimeout(() => {
  //       connectWA()
  //     }, 3000)
  //   } catch (error) {
  //     console.error('Error on session finished. %s', error)
  //   }
  // })

  return client
}

const client = connectWA()
//const client2 = connectWA(2)

// app.locals.whatsappClient = client

const corsOptions = {
  methods: ['PUT, GET, POST, DELETE, PATCH'],
  allowedHeaders: ['Access-Control-Allow-Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials, Accept-Language, X-Iwata-App, X-Iwata-App-Version'],
  credentials: true,
  preflightContinue: false
}

app.use(http.generateId)
app.use(cors(corsOptions))

app.use(helmet())
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(logger('dev'))
// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use(bodyParser.json({
  extend: false,
  limit: '100mb'
}))
app.use(bodyParser.urlencoded({
  extended: true
}))

i18n.configure({
  // setup some locales - other locales default to en silently
  locales: ['en', 'id'],

  // set default Locale
  defaultLocale: 'en',

  // sets a custom cookie name to parse locale settings from
  cookie: 'locale',
  objectNotation: true,

  // where to store json files - defaults to './locales'
  directory: path.join(__dirname, 'locales')
})

// Init i18n package
app.use(i18n.init)

// Routing
const v1 = {
  index: require('./routes/index'),
  test: require('./routes/test'),
  whatsapp: require('./routes/whatsapp')
}

const cronRouter = require('./routes/cron/index')

// app.post('/v1/test/send-message', async (req, res) => {
//   const WA = client

//   if (req.body.mobile_phone !== undefined && req.body.mobile_phone !== '') {
//     let mobilePhone = ((req.body.mobile_phone.replace(/-|,/g, '')).replace(/\+| |,/g, ''))
//     if (parseInt(mobilePhone.charAt(0)) === 0) {
//       mobilePhone = '62' + mobilePhone.slice(1)
//     }
//     req.body.mobile_phone = mobilePhone
//   }
//   await body('mobile_phone').trim().run(req)
//   await body('text').notEmpty().run(req)

//   const result = validationResult(req)
//   if (!result.isEmpty()) {
//     return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
//   } else {
//     try {
//       WA.on('ready', () => {
//         // Getting chatId from the number.
//         // we have to delete "+" from the beginning and add "@c.us" at the end of the number.
//         const chatId = `${req.body.mobile_phone}@c.us`
//         // Your message.
//         const text = req.body.text
//         console.log('Ready to send')
//         // Sending message.
//         WA.sendMessage(chatId, text).then(message => {
//           return res.json({
//             data: message,
//             meta: Meta.response('success', 200, [{
//               param: '',
//               message: res.__('success.creating_data'),
//               value: ''
//             }])
//           })
//         })
//       })
//     } catch (error) {
//       console.log(error)
//       return res.json({
//         meta: Meta.response('failed', 400, [{
//           param: '',
//           message: res.__('failed.creating_data'),
//           value: ''
//         }])
//       })
//     }
//   }
// })

app.post('/v1/whatsapp/:message_id/send', async (req, res) => {
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
  let type = 'personal'
  if (req.body.mobile_phone !== undefined && req.body.mobile_phone !== '') {
    const splitA = req.body.mobile_phone.split('@')

    if (splitA && splitA.length > 1) {
      type = 'group'
    } else {
      let mobilePhone = ((req.body.mobile_phone.replace(/-|,/g, '')).replace(/\+| |,/g, ''))
      if (parseInt(mobilePhone.charAt(0)) === 0) {
        mobilePhone = '62' + mobilePhone.slice(1)
      }
      req.body.mobile_phone = mobilePhone
    }
  }
  await body('mobile_phone').notEmpty().trim().run(req)
  await body('text').notEmpty().run(req)

  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    // const chatId = `${req.body.mobile_phone}@c.us`
   // console.log(req.body)
    let waClient = client

   // if (req.body.robot === 2) {
   //   waClient = client2
   // }

    if (waClient !== undefined) {     
      let numberDetails = req.body.mobile_phone
      if (type === 'personal') {
        let numberId = await waClient.getNumberId(req.body.mobile_phone)
  
        if(numberId !== null && numberId !== '') {
          numberDetails = numberId._serialized // get mobile number details
        } else {
          numberDetails = `${req.body.mobile_phone}@c.us`
        }
      }
      const text = req.body.text
  
      if (numberDetails) {
        //if (req.body.media !== null && req.body.media !== '' && req.body.media !== undefined) {
        //  const media = new MessageMedia(`image/${req.body.media.format}`, req.body.media.image)
        //  const sendMessageData = await waClient.sendMessage(numberDetails, media, { caption: text, sendMediaAsDocument: true })
        //  await MessageNotification.update({
         //   status: 'success'
         // }, {
         //   where: {
         //     id: req.params.message_id
         //   }
         // })
  
        //}
         
        const sendMessageData = await waClient.sendMessage(numberDetails, text) // send message
        await MessageNotification.update({
          status: 'success'
        }, {
          where: {
            id: req.params.message_id
          }
        })
  
        return res.json({
          data: sendMessageData,
          meta: Meta.response('success', 200, [{
            param: '',
            message: res.__('failed.creating_data'),
            value: ''
          }])
        })
      } else {
        console.log(req.body.mobile_phone, 'Mobile number is not registered')
        await MessageNotification.update({
          status: 'failed'
        }, {
          where: {
            id: req.params.message_id
          }
        })
        return res.json({
          meta: Meta.response('failed', 400, [{
            param: '',
            message: res.__('failed.creating_data'),
            value: ''
          }])
        })
      }
    }
   
  }
})

app.use('/', v1.index)

// main
// app.use('/v1/test', v1.test)
// app.use('/v1/whatsapp', v1.whatsapp)

// Cron
app.use('/cron', cronRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
