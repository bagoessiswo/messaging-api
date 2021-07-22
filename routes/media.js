const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const { Sequelize } = require('sequelize')
const IwataConfig = require('../config/iwata')
const Meta = require('../helpers/meta')
const TokenHelper = require('../helpers/token')
const Pagination = require('../helpers/pagination')
const Multer = require('multer')
const Delete = require('delete')
const _ = require('lodash')
const Space = require('../helpers/space')
const Models = require('../models/index')
const Media = Models.media

// Middleware
const isValidMethod = require('../middleware/isValidMethod')
const isValidAppVersion = require('../middleware/isValidAppVersion')
const isAuthenticated = require('../middleware/isAuthenticated')

router.get('/', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let limit = req.query.limit || IwataConfig.data.limit_pagination
  let page = req.query.page || 1
  let sort = []

  if (typeof req.query.sort !== 'undefined' && req.query.sort !== '') {
    sort.push(Sequelize.literal(req.query.sort))
  } else {
    sort.push(Sequelize.literal('created_at desc'))
  }

  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  if (authenticatedUser) {
    try {
      let media = await Media.findAndCountAll({
        where: {
          user_id: authenticatedUser.id
        },
        distinct: true,
        order: [sort],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * limit
      })

      if (media) {
        return res.json({
          data: media.rows,
          pagination: Pagination.make(media.count, media.rows.length, limit, page, req._parsedOriginalUrl.query, req.originalUrl),
          meta: Meta.response('success', 200, [
            {
              param: '',
              message: req.__('success.showing_data'),
              value: ''
            }])
        })
      } else {
        return res.json({
          data: [],
          pagination: Pagination.make(0, 0, 0, 0, req._parsedOriginalUrl.query, req.originalUrl),
          meta: Meta.response('success', 200, [
            {
              param: '',
              message: req.__('success.showing_data'),
              value: ''
            }])
        })
      }
    } catch (error) {
      return res.json({
        data: [],
        pagination: Pagination.make(0, 0, 0, 0, req._parsedOriginalUrl.query, req.originalUrl),
        meta: Meta.response('success', 200, [{
          param: '',
          message: res.__('success.showing_data'),
          value: ''
        }])
      })
    }
  } else {
    return res.json({
      data: [],
      pagination: Pagination.make(0, 0, 0, 0, req._parsedOriginalUrl.query, req.originalUrl),
      meta: Meta.response('success', 200, [{
        param: '',
        message: res.__('success.showing_data'),
        value: ''
      }])
    })
  }
})

router.post('/', isValidMethod('POST'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)
  if (authenticatedUser) {
    const mediaUpload = Multer({ dest: '/tmp/' }).single('src')
    mediaUpload(req, res, async (error) => {
      if (error) {
        console.log(error)
        return res.status(400).json({
          meta: Meta.response('failed_create_media', 400, [
            {
              param: '',
              message: req.__('failed.creating_data'),
              value: ''
            }])
        })
      } else {
        // await body('method').notEmpty().isIn(['image', 'video', 'document']).run(req)
        await body('type').notEmpty().isIn(['image', 'video', 'document', 'audio']).run(req)
        await body('context').notEmpty().isIn(['visitation_plan_reports', 'contacts', 'contact_conditions', 'attendances', 'tickets']).run(req)

        const result = validationResult(req)
        if (!result.isEmpty()) {
          if (typeof req.file !== 'undefined') {
            Delete([req.file.path], { force: true }, function (error, deleted) {
              if (error) {
                console.log(error)
              }
            })
          }
          return res.status(400).json({ meta: Meta.response('failed_create_media', 400, result.array()) })
        } else {
          if (typeof req.file !== 'undefined') {
            req.body.file = req.file
            req.body.size = req.file.size
            await body('size').custom(async (value) => {
              switch (req.body.type) {
                case 'image':
                  return _.includes(IwataConfig.media.image_mime_types, req.file.mimetype) && req.body.size <= IwataConfig.media.image_max_size
                case 'video':
                  return _.includes(IwataConfig.media.video_mime_types, req.file.mimetype) && req.body.size <= IwataConfig.media.video_max_size
                case 'audio':
                  return _.includes(IwataConfig.media.video_mime_types, req.file.mimetype) && req.body.size <= IwataConfig.media.video_max_size
                case 'document':
                  break
                default:
                  return false
              }
            }).run(req)
          }

          await body('file').notEmpty().run(req)

          const result2 = validationResult(req)
          if (!result2.isEmpty()) {
            if (typeof req.file !== 'undefined') {
              Delete([req.file.path], { force: true }, function (error, deleted) {
                if (error) {
                  console.log(error)
                }
              })
            }
            return res.status(400).json({ meta: Meta.response('failed_create_media', 400, result2.array()) })
          } else {
            return Space.uploadFromFile(req.file, IwataConfig.media.path[req.body.context]).then(function (file) {
              req.body.src = file.public_id
              req.body.title = req.body.title === '' || typeof req.body.title === 'undefined' ? null : req.body.title
              req.body.content = req.body.content === '' || typeof req.body.content === 'undefined' ? null : req.body.content
              req.body.format = file.format
              req.body.resource_type = file.resource_type
              req.body.height = file.height || null
              req.body.width = file.width || null
              req.body.bytes = file.bytes
              req.body.user_id = authenticatedUser.id
              return Media.create(req.body).then(function (result) {
                return Media.findOne({
                  attributes: {
                    exclude: ['created_at', 'updated_at', 'deleted_at']
                  },
                  where: {
                    id: result.id
                  }
                }).then(function (media) {
                  Delete([req.file.path], { force: true }, function (error, deleted) {
                    if (error) {
                      console.log(error)
                    }
                  })
                  return res.json({
                    data: media,
                    meta: Meta.response('success_create_media', 200, [
                      {
                        param: '',
                        message: req.__('success.creating_data'),
                        value: ''
                      }])
                  })
                })
              })
            }).catch(function (error) {
              console.log(error)
              return res.status(400).json({
                meta: Meta.response('failed_create_media', 400, [
                  {
                    param: '',
                    message: req.__('failed.creating_data'),
                    value: ''
                  }])
              })
            })
          }
        }
      }
    })
  } else {
    return res.status(400).json({
      meta: Meta.response('not_found', 400, [{
        param: '',
        message: res.__('not_found.user'),
        value: ''
      }])
    })
  }
})

module.exports = router

// case 'url':
//   await body('src').notEmpty().isURL().run(req)
//   await body('type').notEmpty().isIn(['image', 'video', 'document']).run(req)
//   await body('context').notEmpty().isIn(['visitation_plan_reports']).run(req)

//   const result4 = validationResult(req)
//   if (!result4.isEmpty()) {
//     return res.status(400).json({ meta: Meta.response('failed_create_media', 400, result4.array()) })
//   } else {
//     return Space.uploadFromUrl(req.body.src, IwataConfig.media.path[req.body.context]).then(function (file) {
//       req.body.src = file.public_id
//       req.body.title = req.body.title === '' || typeof req.body.title === 'undefined' ? null : req.body.title
//       req.body.content = req.body.content === '' || typeof req.body.content === 'undefined' ? null : req.body.content
//       req.body.format = file.format
//       req.body.resource_type = file.resource_type
//       req.body.height = file.height
//       req.body.width = file.width
//       req.body.bytes = file.bytes
//       req.body.user_id = authenticatedUser.id
//       return Media.create(req.body).then(function (result) {
//         return Media.findOne({
//           attributes: {
//             exclude: ['created_at', 'updated_at', 'deleted_at']
//           },
//           where: {
//             id: result.id
//           }
//         }).then(function (media) {
//           return res.json({
//             data: media,
//             meta: Meta.response('success_create_media', 200, [
//               {
//                 param: '',
//                 message: req.__('success.creating_data'),
//                 value: ''
//               }])
//           })
//         })
//       })
//     }).catch(function (error) {
//       console.log(error)
//       return res.status(400).json({
//         meta: Meta.response('failed_create_media', 400, [
//           {
//             param: '',
//             message: req.__('failed.creating_data'),
//             value: ''
//           }])
//       })
//     })
//   }
// default:
//   return res.status(400).json({
//     meta: Meta.response('failed_create_media', 400, [
//       {
//         param: '',
//         message: req.__('failed.creating_data'),
//         value: ''
//       }])
//   })
