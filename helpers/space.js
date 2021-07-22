'use strict'
const AWS = require('aws-sdk')
const Axios = require('axios')
const RandomString = require('randomstring')
const SizeOf = require('image-size')
const FS = require('fs')

// please remove key on deployment, testing purpose only
AWS.config.update({
  accessKeyId: process.env.DIGITALOCEAN_SPACE_KEY,
  secretAccessKey: process.env.DIGITALOCEAN_SPACE_SECRET_KEY
})

let spacesEndpoint = new AWS.Endpoint(process.env.DIGITALOCEAN_SPACE_ENDPOINT)
const S3 = new AWS.S3({
  endpoint: spacesEndpoint
})

module.exports = {
  uploadFromUrl: function (url, directory, fileName = null) {
    return new Promise(function (resolve, reject) {
      directory = directory.replace(/^\/|$/g, '')
      let generatedFilename = fileName === null ? RandomString.generate(40) : fileName
      let key = process.env.NODE_ENV === 'production' ? directory + generatedFilename : 'development/' + directory + generatedFilename
      return Axios({
        url: url,
        method: 'get'
      }).then(function (res) {
        if (res.status === 200) {
          let objectParams = {
            Bucket: process.env.DIGITALOCEAN_SPACE_NAME,
            ContentType: res.headers['content-type'],
            ContentLength: res.headers['content-length'],
            Key: (res.headers['content-type'].split('/'))[0] + '/upload/' + key,
            Body: res.data,
            ACL: 'public-read'
          }
          return S3.putObject(objectParams).promise().then(function (response) {
            let result = SizeOf(res.body)
            result.ETag = response.ETag
            result.path = key
            result.file_name = generatedFilename
            result.public_id = key
            result.format = result.type
            result.bytes = res.headers['content-length']
            result.resource_type = (res.headers['content-type'].split('/'))[0]

            return resolve(result)
          }).catch(function (error) {
            console.log(error)
            return reject(new Error('Failed upload image from URL into Space Storage'))
          })
        } else {
          return reject(new Error('Failed upload image from URL into Space Storage'))
        }
      }).catch(function (error) {
        console.log(error)
        return reject(new Error('Failed upload image from URL into Space Storage, File not found'))
      })
    })
  },

  uploadFromFile: function (file, directory, fileName = null) {
    return new Promise(function (resolve, reject) {
      directory = directory.replace(/^\/|$/g, '')
      let generatedFilename = fileName === null ? RandomString.generate(40) : fileName
      let key = process.env.NODE_ENV === 'production' ? directory + generatedFilename : 'development/' + directory + generatedFilename
      FS.readFile(file.path, function (error, data) {
        if (error) return reject(new Error('Failed upload image from File into Space Storage'))

        let objectParams = {
          Bucket: process.env.DIGITALOCEAN_SPACE_NAME,
          ContentType: file.mimetype,
          ContentLength: file.size,
          Key: (file.mimetype.split('/'))[0] + '/upload/' + key,
          Body: data,
          ACL: 'public-read'
        }

        console.log(objectParams)
        return S3.putObject(objectParams).promise().then(function (response) {
          let result = {}
          if ((file.mimetype.split('/'))[0] === 'audio') {
            result.type = (file.mimetype.split('/'))[1]
          } else {
            result = SizeOf(data)
          }

          result.ETag = response.ETag
          result.path = key
          result.file_name = generatedFilename
          result.public_id = key
          result.format = result.type
          result.resource_type = (file.mimetype.split('/'))[0]
          result.bytes = file.size

          return resolve(result)
        }).catch(function (error) {
          console.log(error)
          return reject(new Error('Failed upload image from File into Space Storage'))
        })
      })
    })
  },

  getImage: function (filename, height = null, width = null) {
    const URL = process.env.CDN_URL

    if (filename !== null) {
      filename = filename + ''
      if (filename.match(/instagram.com/g)) {
        return {
          file_name: filename,
          original_url: filename,
          custom_url: filename,
          height: height,
          width: width,
          type: 'image'
        }
      } else {
        return {
          file_name: filename,
          original_url: URL + '/' + filename,
          custom_url: URL + '/' + filename + '?{params}',
          height: height,
          width: width,
          type: 'image'
        }
      }
    } else {
      return {
        file_name: null,
        original_url: null,
        custom_url: null,
        height: height,
        width: width,
        type: 'image'
      }
    }
  },

  getAudio: function (filename) {
    const URL = process.env.DIGITALOCEAN_CDN

    if (filename !== null) {
      filename = filename + ''

      return {
        file_name: filename,
        original_url: URL + '/audio/upload/' + filename,
        custom_url: URL + '/audio/upload/' + filename,
        type: 'audio'
      }
    } else {
      return {
        file_name: null,
        original_url: null,
        custom_url: null,
        type: 'audio'
      }
    }
  },

  getVideo: function (filename, height = null, width = null) {
    const URL = process.env.CDN_URL

    if (filename !== null) {
      filename = filename + ''
      if (filename.match(/instagram.com/g)) {
        return {
          file_name: filename,
          original_url: filename,
          custom_url: filename,
          height: height,
          width: width,
          type: 'video'
        }
      } else {
        return {
          file_name: filename,
          original_url: URL + '/video/upload/' + filename,
          custom_url: URL + '/{/params}' + '/video/upload/' + filename,
          thumbnail_url: URL + '/video/upload/' + filename + '.jpg',
          thumbnail_custom_url: URL + '/video/upload/' + filename + '.jpg',
          height: height,
          width: width,
          type: 'video'
        }
      }
    } else {
      return {
        file_name: null,
        original_url: null,
        custom_url: null,
        height: height,
        width: width,
        type: 'video'
      }
    }
  },

  remove: function (filename) {
    return new Promise(function (resolve, reject) {
      const objectParams = {
        Bucket: process.env.DIGITALOCEAN_SPACE_NAME,
        Key: filename
      }

      return S3.deleteObject(objectParams).promise().then(function (response) {
        return resolve(response)
      }).catch(function (error) {
        console.log(error)
        return reject(new Error('Failed upload image from File into Space Storage'))
      })
    })
  }
}
