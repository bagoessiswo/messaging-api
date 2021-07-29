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

const fs = require('fs')

// const { Client } = require('whatsapp-web.js')
// const SESSION_FILE_PATH = './session.json'

// function connectWA (forceNewSession = false) {
//   let sessionData
//   if (fs.existsSync(SESSION_FILE_PATH) && !forceNewSession) {
//     sessionData = require(SESSION_FILE_PATH)
//   }
//   const client = new Client({
//     session: sessionData
//   })
//   client.initialize()
//   client.on('qr', (qr) => {
//     qrcode.generate(qr, { small: true })
//   })
//   client.on('authenticated', (session) => {
//     sessionData = session
//     fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
//       if (err) {
//         console.error(err)
//       }
//     })
//   })
//   client.on('ready', () => {
//     console.log('WWebJS v', require('whatsapp-web.js').version)
//     console.log('Client is ready!')
//   })

//   client.on('auth_failure', (reason) => {
//     sessionData = null
//     try {
//       // Destroy actual browser
//       client.destroy()

//       // delete session path
//       fs.rmdirSync(SESSION_FILE_PATH, { recursive: true })

//       // Send command to restart the instance
//       setTimeout(() => {
//         connectWA()
//       }, 3000)
//     } catch (error) {
//       console.error('Error on session finished. %s', error)
//     }
//   })

//   return client
// }

// const client = connectWA()

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
  whatsapp: require('./routes/whatsapp')
}

const cronRouter = require('./routes/cron/index')

app.use('/', v1.index)

// main
app.use('/v1/whatsapp', v1.whatsapp)

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
