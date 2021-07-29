const express = require('express')
const router = express.Router()
const messagingCron = require('../../cron/messaging')
router.use(messagingCron.sendQueue())

module.exports = router
