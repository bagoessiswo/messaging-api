const express = require('express')
const router = express.Router()
// const moment = require('moment')

/* GET home page. */
router.get('/', function (req, res, next) {
  return res.json('Hello')
})

module.exports = router
