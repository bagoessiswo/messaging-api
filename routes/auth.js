const express = require('express')
const router = express.Router()

const Meta = require('../helpers/meta')
const TokenHelper = require('../helpers/token')

// Middleware
const isValidMethod = require('../middleware/isValidMethod')
const isValidAppVersion = require('../middleware/isValidAppVersion')
const isAuthenticated = require('../middleware/isAuthenticated')

/* GET users listing. */
router.get('/info', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  const user = await TokenHelper.getUser(req, res, next)
  return res.json({
    data: user,
    meta: Meta.response('success', 200, [{
      param: '',
      message: res.__('success.showing_data'),
      value: ''
    }])
  })
})

module.exports = router
