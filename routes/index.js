const express = require('express')
const router = express.Router()
// const moment = require('moment')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' })
  // let date1 = moment()
  // let date2 = moment(moment().format('YYYY-MM-DD 09:53:00'))
  // let difference = moment.duration(date2.diff(date1)).as('minutes')
  // return res.json(difference)
})

module.exports = router
