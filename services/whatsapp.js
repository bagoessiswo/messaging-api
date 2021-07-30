'use strict'

const Promise = require('bluebird')
const Axios = require('axios')
module.exports = {
  sendMessage: function (messageId) {
    return new Promise(function (resolve, reject) {
      Axios({
        url: `${process.env.APP_URL}/v1/whatsapp/${messageId}/send`,
        method: 'post'
      }).then(function (response) {
        if (response.status === 200 || response.status === 201) {
          resolve(response.data)
        } else {
          reject(response.data)
        }
      }).catch(function (error) {
        reject(error)
      })
    })
  }
}
