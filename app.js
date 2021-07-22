require('dotenv').config()

var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var logger = require('morgan')
var cors = require('cors')
var http = require('./helpers/http')
var helmet = require('helmet')
const i18n = require('i18n')

var app = express()

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
  contacts: require('./routes/contacts')
}

// const cronRouter = require('./routes/cron/index')

app.use('/', v1.index)

// main
app.use('/v1/contacts', v1.contacts)

// Cron
// app.use('/cron', cronRouter)

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
