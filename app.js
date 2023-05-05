require('dotenv').config()

const Promise = require('bluebird')
const moment = require('moment')
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
const isValidMethod = require('./middleware/isValidMethod')
const isValidAppVersion = require('./middleware/isValidAppVersion')
const Models = require('./models/index')
const MessageNotification = Models.message_notification
const JobstreetApplicant = Models.jobstreet_applicant
const Alarm = Models.alarm
const AlarmType = Models.alarm_type
const User = Models.user
const UserAttendance = Models.user_attendance
const UserShift = Models.user_shift
const WorkShiftSchedule = Models.work_shift_schedule
const WorkSchedule = Models.work_schedule
const { Op } = require('sequelize')

let INTERVIEW_LINK = 'https://task.iwata.id/interview'
const fs = require('fs')
const MONGO_URI = 'mongodb+srv://qupas:s9kb0rQnQsB6Mwrj@cluster0.t9bib6c.mongodb.net/?retryWrites=true&w=majority'
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const { Client, LocalAuth, RemoteAuth, MessageMedia } = require('whatsapp-web.js')
const SESSION_FILE_PATH2 = './.wwebjs_auth2'
const SESSION_FILE_PATH = './.wwebjs_auth'

async function getAttendanceSummary(groupId, date) {
  let offense = 0
  let message = `*Pelanggaran - Absensi*\nTanggal *${moment(date).format('DD MMM YYYY')}*\n`
  let count = 0
  let users = []
  if (groupId === '120363025101760129@g.us') { //MITRAKITA
    users = await User.findAll({
      where: {
        status: 'active',
        branch_id: 'f95507a0-bc44-11eb-8216-0aa66ecb6fa4',
        id: {
          [Op.notIn]: [
            '9fefe6d2-7105-470b-9e64-c23891d9eeea',
            '52ec2ab1-1c71-4cee-a4ff-d7cb995ec93b', //lenny
            '3fca5840-0fee-11ea-b9dd-05b33a5e4201'
          ]
        }
      },
      order: [
        ['name', 'asc']
      ]
    })
  } else if (groupId === '120363038472864085@g.us') { //TOBA
    users = await User.findAll({
      where: {
        status: 'active',
        branch_id: 'f9556388-bc44-11eb-8216-0aa66ecb6fa4',
        id: {
          [Op.notIn]: ['ebe02f0e-adb7-40f8-8676-d651edc8ca5d']
        }
      },
      order: [
        ['name', 'asc']
      ]
    })
  }
    
  await Promise.map(users, async (user, index) => {
    const userShift = await UserShift.findOne({
      where: {
        user_id: user.id,
        status: 'active'
      }
    })

    if (userShift) {
      const workShiftSchedules = await WorkShiftSchedule.findAll({
        where: {
          work_shift_id: userShift.work_shift_id
        },
        include: [
          {
            model: WorkSchedule,
            required: true,
            where: {
              day: moment(date).format('d')
            }
          }
        ],
        distinct: true
      })
      const attendance = await UserAttendance.findOne({
        where: {
          user_id: user.id,
          created_at: {
            [Op.gte]: moment(date).format('YYYY-MM-DD 00:00:00'),
            [Op.lte]: moment(date).format('YYYY-MM-DD 23:59:59')
          },
          type: 'checkin'
        }
      })

      if (workShiftSchedules) {
        await Promise.map(workShiftSchedules, async ws => {
          if (attendance) {
            if (ws.work_schedule.checkin_at < moment.utc(attendance.created_at).format('HH:mm:ss')) {
              count++
              offense = 1
              
              const duration = (moment.duration(moment(moment.utc(attendance.created_at).format('YYYY-MM-DD HH:mm:ss')).diff(moment(moment(date).format('YYYY-MM-DD') + ' ' + ws.work_schedule.checkin_at)))).asMinutes()
              message += `${count}. ${(user.name.split(' '))[0]} telat absen ${Number(duration).toFixed(1)} menit\n`
              
            }
          } else {
            count++
            offense = 1
            message += `${count}. ${(user.name.split(' '))[0]} belum absen\n`
          }                                
          
          return ws
        })
      }
    }
    
    return user
  })

  if (offense === 1) {
    return message
  } else {
    return 'No offense summary available.'
  }
}

function connectWA (robot = 1, forceNewSession = false) {
  let client = null
  if (robot === 1) {
    client = new Client({
      authStrategy: new LocalAuth({
        restartOnAuthFail: true,
  	    puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
              '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
          ],
        },
        clientId: "client-one",
        qrTimeoutMs: 0,
        dataPath: SESSION_FILE_PATH
      })
    })
  }

  if (robot === 2) {
    client = new Client({
      authStrategy: new LocalAuth({
        restartOnAuthFail: true,
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
          ],
        },
        clientId: "client-two",
        qrTimeoutMs: 0,
        dataPath: SESSION_FILE_PATH2
      })
    })
  }
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
      mobilePhone = '0' + mobilePhone.slice(2)
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

    const attendanceSummary = msg.body.search("attendance_summary")
    if(attendanceSummary && robot === 1) {
      let summaryDate = moment().format('YYYY-MM-DD')
      const commandDetail = msg.body.split("|")
      if (commandDetail.length>1) {
        if (commandDetail[1] !== "") {
          summaryDate = moment(commandDetail[1]).format('YYYY-MM-DD')
        }
      }
      if (parseInt(moment(summaryDate).format('d')) > 0) {
        const summary = await getAttendanceSummary(msg.from, summaryDate)
        await client.sendMessage(msg.from, summary);
      } else {
        await client.sendMessage(msg.from, 'No offense summary available.');
      }
    }
  })

  // client.on('change_battery', (batteryInfo) => {
  //   // Battery percentage for attached device has changed
  //   const { battery, plugged } = batteryInfo;
  //   console.log(`Battery: ${battery}% - Charging? ${plugged}`);
  // });
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

const client =  connectWA()
const client2 = connectWA(2)

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

app.post('/v1/whatsapp/send', isValidMethod('POST'), isValidAppVersion, async (req, res) => {
  await body('to').notEmpty().run(req)

  if (Array.isArray(req.body.to)) {
    req.body.to = await Promise.map(req.body.to, phone => {
      let mobilePhone = ((phone.replace(/-|,/g, '')).replace(/\+| |,/g, ''))
      if (parseInt(mobilePhone.charAt(0)) === 0) {
        mobilePhone = '62' + mobilePhone.slice(1)
      }
      return mobilePhone
    })
  } else {
    if (req.body.to !== undefined && req.body.to !== '') {
      let mobilePhone = ((req.body.to.replace(/-|,/g, '')).replace(/\+| |,/g, ''))
      if (parseInt(mobilePhone.charAt(0)) === 0) {
        mobilePhone = '62' + mobilePhone.slice(1)
      }
      req.body.to = [mobilePhone]
    }
  }

  await body('message').notEmpty().trim().run(req)
  await body('media').trim().run(req)

  if (req.body.robot === undefined || req.body.robot === '') {
    req.body.robot = 1
  }

  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    let waClient = client
    if (req.body.robot === 2) {
      waClient = client2
    }

    if (waClient !== undefined){
      try { 
        const successSend = []
        const failedSend = []
        const mappedMessage = await Promise.map(req.body.to, async (phone) => {
          let type = 'personal'
          if (phone !== undefined && phone !== '') {
            const splitA = phone.split('@')
            if (splitA && splitA.length > 1) {
              type = 'group'
            }
  
            
            let numberDetails = phone
            if (type === 'personal') {
              let numberId = await waClient.getNumberId(phone)
        
              if(numberId !== null && numberId !== '') {
                numberDetails = numberId._serialized // get mobile number details
              } else {
                numberDetails = `${phone}@c.us`
              }
            }
            const text = req.body.message
        
            if (numberDetails) {
              let sendMessageData = null
              if (req.body.media !== null && req.body.media !== '' && req.body.media !== undefined) {
                const media = await MessageMedia.fromUrl(req.body.media)
                sendMessageData = await waClient.sendMessage(numberDetails, media, { caption: text })
              } else {
                sendMessageData = await waClient.sendMessage(numberDetails, text) // send message
              }
  
              if (sendMessageData.ack === 'ACK_ERROR') {
                failedSend.push({
                  media: req.body.media || null,
                  message: req.body.message,
                  status: 'success',
                  scheduled_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                  to: phone,
                  robot: req.body.robot,
                  method: 'direct'
                })
                return {
                  media: req.body.media || null,
                  message: req.body.message,
                  status: 'failed',
                  scheduled_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                  to: phone,
                  robot: req.body.robot,
                  method: 'direct'
                }
              } else {
                successSend.push({
                  media: req.body.media || null,
                  message: req.body.message,
                  status: 'success',
                  scheduled_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                  to: phone,
                  robot: req.body.robot,
                  method: 'direct'
                })
                return {
                  media: req.body.media || null,
                  message: req.body.message,
                  status: 'success',
                  scheduled_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                  to: phone,
                  robot: req.body.robot,
                  method: 'direct'
                }
              }
            } else {
              failedSend.push({
                media: req.body.media || null,
                message: req.body.message,
                status: 'success',
                scheduled_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                to: phone,
                robot: req.body.robot,
                method: 'direct'
              })
              return {
                media: req.body.media || null,
                message: req.body.message,
                status: 'failed',
                scheduled_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                to: phone,
                robot: req.body.robot,
                method: 'direct'
              }
            }
          }
        })
        await MessageNotification.bulkCreate(mappedMessage)
        return res.json({
          data: {
            success: successSend,
            failed: failedSend
          },
          meta: Meta.response('success', 200, [{
            param: '',
            message: res.__('failed.creating_data'),
            value: ''
          }])
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
    } else {
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

    if (req.body.robot === 2) {
      waClient = client2
    }

    if (waClient !== undefined){
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
        let sendMessageData = null
        if (req.body.media !== null && req.body.media !== '' && req.body.media !== undefined) {
          const media = await MessageMedia.fromUrl(req.body.media)
          sendMessageData = await waClient.sendMessage(numberDetails, media, { caption: text })
          await MessageNotification.update({
            status: 'success'
          }, {
            where: {
              id: req.params.message_id
            }
          })
  
        } else {
          sendMessageData = await waClient.sendMessage(numberDetails, text) // send message
          await MessageNotification.update({
            status: 'success'
          }, {
            where: {
              id: req.params.message_id
            }
          })
        }
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
