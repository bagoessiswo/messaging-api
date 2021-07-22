const express = require('express')
const router = express.Router()
const moment = require('moment')
const { param, validationResult, body } = require('express-validator')
const { Sequelize, Op } = require('sequelize')
const IwataConfig = require('../config/iwata')
const Pagination = require('../helpers/pagination')
const Meta = require('../helpers/meta')
const TokenHelper = require('../helpers/token')
const Slug = require('../helpers/slug')

const Models = require('../models/index')
const Ticket = Models.ticket
const TicketType = Models.ticket_type
const TicketUser = Models.ticket_user
const TicketMedia = Models.ticket_media
const User = Models.user
const Media = Models.media

// Middleware
const isValidMethod = require('../middleware/isValidMethod')
const isValidAppVersion = require('../middleware/isValidAppVersion')
const isAuthenticated = require('../middleware/isAuthenticated')

router.post('/', isValidMethod('POST'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  await body('name').notEmpty().trim().escape().custom(async (value) => {
    const existedTicket = await Ticket.findOne({
      where: {
        name: value,
        status: 'active'
      }
    })

    if (!existedTicket) {
      return true
    } else {
      throw new Error('Ticket exist')
    }
  }).run(req)

  if (req.body.slug !== undefined || req.body.slug !== '') {
    req.body.slug = Slug.generate(req.body.name)
  } else {
    req.body.slug = Slug.generate(req.body.slug)
  }

  await body('ticket_type_id').notEmpty().trim().escape().custom(async (value) => {
    const existedType = await TicketType.findOne({
      where: {
        id: value,
        status: 'active'
      }
    })

    if (existedType) {
      return true
    } else {
      throw new Error('Ticket type not found')
    }
  }).run(req)

  await body('description').notEmpty().trim().escape().run(req)
  await body('ticket_media.*.image').trim().escape().custom(async (value) => {
    if (value !== undefined && value !== '') {
      const existedMedia = await Media.findOne({
        where: {
          [Op.or]: [
            {
              id: value
            },
            {
              src: value
            }
          ]
        }
      })

      if (existedMedia) {
        return true
      } else {
        throw new Error('Media not found')
      }
    } else {
      return true
    }
  }).run(req)
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    if (authenticatedUser) {
      try {
        const newTicket = await Ticket.create({
          name: req.body.name,
          slug: req.body.slug,
          ticket_type_id: req.body.ticket_type_id,
          reminder_at: req.body.reminder_at,
          description: req.body.description,
          created_by: authenticatedUser.id,
          status: 'active'
        })

        if (newTicket) {
          await TicketUser.create({
            ticket_id: newTicket.id,
            user_id: authenticatedUser.id,
            assigned_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            status: 'active'
          })

          if (req.body.ticket_media !== undefined && req.body.ticket_media.length > 0) {
            let mappedMedia = await Promise.map(req.body.ticket_media, async (media) => {
              let detailMedia = await Media.findOne({
                where: {
                  [Op.or]: [
                    {
                      id: media.image
                    },
                    {
                      src: media.image
                    }
                  ],
                  mediable: {
                    [Op.or]: [null, 'ticket']
                  }
                }
              })

              if (detailMedia) {
                detailMedia.mediable = 'ticket'
                detailMedia.mediable_id = newTicket.id
                await detailMedia.save()
              }

              return {
                ticket_id: newTicket.id,
                media_id: detailMedia.id,
                media_src: detailMedia.src.file_name
              }
            })

            if (mappedMedia) {
              await TicketMedia.bulkCreate(mappedMedia)
            }
          }

          let ticket = await Ticket.findOne({
            where: {
              id: newTicket.id
            },
            include: [
              {
                model: TicketType,
                required: true
              },
              {
                model: User,
                as: 'creator',
                required: true,
                attributes: {
                  exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
                }
              },
              {
                model: TicketUser,
                include: [
                  {
                    model: User,
                    attributes: {
                      exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
                    }
                  }
                ],
                required: true
              },
              {
                model: TicketMedia,
                required: false
              }
            ]
          })

          return res.json({
            data: ticket,
            meta: Meta.response('success', 200, [{
              param: '',
              message: res.__('success.creating_data'),
              value: ''
            }])
          })
        } else {
          return res.status(400).json({
            meta: Meta.response('failed', 400, [{
              param: '',
              message: res.__('failed.creating_data'),
              value: ''
            }])
          })
        }
      } catch (error) {
        console.error(error)
        return res.status(400).json({
          meta: Meta.response('failed', 400, [{
            param: '',
            message: res.__('failed.creating_data'),
            value: ''
          }])
        })
      }
    } else {
      return res.status(400).json({
        meta: Meta.response('not_found', 400, [{
          param: '',
          message: res.__('not_found.user'),
          value: ''
        }])
      })
    }
  }
})

router.put('/:ticket_id', isValidMethod('PUT'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  await param('ticket_id').notEmpty().trim().escape().custom(async (value) => {
    const existedTicket = await Ticket.findOne({
      where: {
        id: value
      },
      include: [
        {
          model: TicketUser,
          where: {
            user_id: authenticatedUser.id
          },
          include: [
            {
              model: User,
              attributes: {
                exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
              }
            }
          ],
          required: true
        }
      ]
    })

    if (existedTicket) {
      return true
    } else {
      throw new Error('Ticket not found')
    }
  }).run(req)

  await body('name').notEmpty().trim().escape().custom(async (value) => {
    const existedTicket = await Ticket.findOne({
      where: {
        name: value,
        status: 'active',
        id: {
          [Op.not]: req.params.ticket_id
        }
      }
    })

    if (!existedTicket) {
      return true
    } else {
      throw new Error('Ticket exist')
    }
  }).run(req)

  if (req.body.slug !== undefined || req.body.slug !== '') {
    req.body.slug = Slug.generate(req.body.name)
  } else {
    req.body.slug = Slug.generate(req.body.slug)
  }

  await body('slug').notEmpty().trim().escape().custom(async (value) => {
    const existedTicket = await Ticket.findOne({
      where: {
        slug: value,
        status: 'active',
        id: {
          [Op.not]: req.params.ticket_id
        }
      }
    })

    if (!existedTicket) {
      return true
    } else {
      throw new Error('Ticket exist')
    }
  }).run(req)

  await body('ticket_type_id').notEmpty().trim().escape().custom(async (value) => {
    const existedType = await TicketType.findOne({
      where: {
        id: value,
        status: 'active'
      }
    })

    if (existedType) {
      return true
    } else {
      throw new Error('Ticket type not found')
    }
  }).run(req)

  await body('description').notEmpty().trim().escape().run(req)

  await body('ticket_media.*.image').trim().escape().custom(async (value) => {
    if (value !== undefined && value !== '') {
      const existedMedia = await Media.findOne({
        where: {
          [Op.or]: [
            {
              id: value
            },
            {
              src: value
            }
          ]
        }
      })

      if (existedMedia) {
        return true
      } else {
        throw new Error('Media not found')
      }
    } else {
      return true
    }
  }).run(req)

  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    if (authenticatedUser) {
      const updatedTicket = await Ticket.update({
        name: req.body.name,
        slug: req.body.slug,
        ticket_type_id: req.body.ticket_type_id,
        reminder_at: req.body.reminder_at,
        description: req.body.description,
        updated_by: authenticatedUser.id,
        status: 'active'
      }, {
        where: {
          id: req.params.ticket_id
        }
      })

      if (updatedTicket) {
        await TicketUser.findOrCreate({
          where: {
            ticket_id: req.params.ticket_id,
            user_id: authenticatedUser.id,
            assigned_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            status: 'active'
          },
          defaults: {
            user_id: authenticatedUser.id
          }
        })

        if (req.body.ticket_media !== undefined && req.body.ticket_media.length > 0) {
          let mappedMedia = await Promise.map(req.body.ticket_media, async (media) => {
            let detailMedia = await Media.findOne({
              where: {
                [Op.or]: [
                  {
                    id: media.image
                  },
                  {
                    src: media.image
                  }
                ],
                mediable: {
                  [Op.or]: [null, 'ticket']
                }
              }
            })

            if (detailMedia) {
              detailMedia.mediable = 'ticket'
              detailMedia.mediable_id = req.params.ticket_id
              await detailMedia.save()
            }

            return {
              ticket_id: req.params.ticket_id,
              media_id: detailMedia.id,
              media_src: detailMedia.src.file_name
            }
          })

          if (mappedMedia) {
            await TicketMedia.destroy({
              where: {
                ticket_id: req.params.ticket_id
              }
            }).then(async (result) => {
              await TicketMedia.bulkCreate(mappedMedia)
            })
          }
        }

        return res.json({
          meta: Meta.response('success', 200, [{
            param: '',
            message: res.__('success.updating_data'),
            value: ''
          }])
        })
      } else {
        return res.status(400).json({
          meta: Meta.response('failed', 400, [{
            param: '',
            message: res.__('failed.updating_data'),
            value: ''
          }])
        })
      }
    } else {
      return res.status(400).json({
        meta: Meta.response('not_found', 400, [{
          param: '',
          message: res.__('not_found.user'),
          value: ''
        }])
      })
    }
  }
})

router.put('/:ticket_id/join', isValidMethod('PUT'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  await param('ticket_id').notEmpty().trim().escape().custom(async (value) => {
    const existedTicket = await Ticket.findOne({
      where: {
        id: value
      }
    })

    if (existedTicket) {
      return true
    } else {
      throw new Error('Ticket not found')
    }
  }).run(req)

  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    if (authenticatedUser) {
      try {
        await TicketUser.findOrCreate({
          where: {
            ticket_id: req.params.ticket_id,
            user_id: authenticatedUser.id,
            assigned_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            status: 'active'
          },
          defaults: {
            user_id: authenticatedUser.id
          }
        })

        return res.json({
          meta: Meta.response('success', 200, [{
            param: '',
            message: res.__('success.updating_data'),
            value: ''
          }])
        })
      } catch (error) {
        console.error(error)
        return res.status(400).json({
          meta: Meta.response('failed', 400, [{
            param: '',
            message: res.__('failed.updating_data'),
            value: ''
          }])
        })
      }
    } else {
      return res.status(400).json({
        meta: Meta.response('not_found', 400, [{
          param: '',
          message: res.__('not_found.user'),
          value: ''
        }])
      })
    }
  }
})

router.put('/:ticket_id/leave', isValidMethod('PUT'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  await param('ticket_id').notEmpty().trim().escape().custom(async (value) => {
    const existedTicket = await Ticket.findOne({
      where: {
        id: value
      },
      include: [
        {
          model: TicketUser,
          where: {
            user_id: authenticatedUser.id
          },
          include: [
            {
              model: User,
              attributes: {
                exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
              }
            }
          ],
          required: true
        }
      ]
    })

    if (existedTicket) {
      return true
    } else {
      throw new Error('Ticket not found')
    }
  }).run(req)

  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ meta: Meta.response('failed', 400, result.array()) })
  } else {
    if (authenticatedUser) {
      try {
        await TicketUser.destroy({
          where: {
            ticket_id: req.params.ticket_id,
            user_id: authenticatedUser.id
          }
        })

        return res.json({
          meta: Meta.response('success', 200, [{
            param: '',
            message: res.__('success.updating_data'),
            value: ''
          }])
        })
      } catch (error) {
        console.error(error)
        return res.status(400).json({
          meta: Meta.response('failed', 400, [{
            param: '',
            message: res.__('failed.updating_data'),
            value: ''
          }])
        })
      }
    } else {
      return res.status(400).json({
        meta: Meta.response('not_found', 400, [{
          param: '',
          message: res.__('not_found.user'),
          value: ''
        }])
      })
    }
  }
})

router.get('/', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let limit = req.query.limit || IwataConfig.data.limit_pagination
  let page = req.query.page || 1
  let sort = []

  let conditions = {}

  if (typeof req.query.search !== 'undefined' && req.query.search !== '') {
    conditions = {
      [Op.or]: [
        Sequelize.where(Sequelize.fn('lower', Sequelize.col('`ticket`.`name`')), {
          [Op.like]: Sequelize.fn('lower', `%${req.query.search}%`)
        })
      ]
    }
  }

  if (typeof req.query.sort !== 'undefined' && req.query.sort !== '') {
    sort.push(Sequelize.literal(req.query.sort))
  } else {
    sort.push(Sequelize.literal('created_at desc'))
  }
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  if (authenticatedUser) {
    try {
      let tickets = await Ticket.findAndCountAll({
        where: {
          ...conditions
        },
        include: [
          {
            model: TicketType,
            required: true
          },
          {
            model: User,
            as: 'creator',
            required: true,
            attributes: {
              exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
            }
          },
          {
            model: User,
            as: 'updater',
            required: false,
            attributes: {
              exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
            }
          },
          {
            model: TicketUser,
            where: {
              user_id: authenticatedUser.id
            },
            include: [
              {
                model: User,
                attributes: {
                  exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
                }
              }
            ],
            required: true
          },
          {
            model: TicketMedia,
            required: false
          }
        ],
        attributes: {
          exclude: ['deleted_at']
        },
        distinct: true,
        order: [sort],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * limit
      })

      if (tickets) {
        return res.json({
          data: tickets.rows,
          pagination: Pagination.make(tickets.count, tickets.rows.length, limit, page, req._parsedOriginalUrl.query, req.originalUrl),
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
      console.error(error)
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

router.get('/:ticket_id', isValidMethod('GET'), isValidAppVersion, isAuthenticated, async (req, res, next) => {
  let authenticatedUser = await TokenHelper.getUser(req, res, next)

  await param('ticket_id').notEmpty().trim().escape().custom(async (value) => {
    const existedTicket = await Ticket.findOne({
      where: {
        id: value
      },
      include: [
        {
          model: TicketUser,
          where: {
            user_id: authenticatedUser.id
          },
          include: [
            {
              model: User,
              attributes: {
                exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
              }
            }
          ],
          required: true
        }
      ]
    })

    if (existedTicket) {
      return true
    } else {
      throw new Error('Ticket not found')
    }
  }).run(req)
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.json({
      data: null,
      meta: Meta.response('success', 200, [{
        param: '',
        message: res.__('success.showing_data'),
        value: ''
      }])
    })
  } else {
    if (authenticatedUser) {
      try {
        let userTicket = await Ticket.findOne({
          where: {
            id: req.params.ticket_id
          },
          include: [
            {
              model: TicketType,
              required: true
            },
            {
              model: User,
              as: 'creator',
              required: true,
              attributes: {
                exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
              }
            },
            {
              model: User,
              as: 'updater',
              required: false,
              attributes: {
                exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
              }
            },
            {
              model: TicketUser,
              where: {
                user_id: authenticatedUser.id
              },
              include: [
                {
                  model: User,
                  attributes: {
                    exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
                  }
                }
              ],
              required: true
            },
            {
              model: TicketMedia,
              required: false
            }
          ],
          attributes: {
            exclude: ['created_at', 'deleted_at']
          }
        })

        if (userTicket) {
          return res.json({
            data: userTicket,
            meta: Meta.response('success', 200, [
              {
                param: '',
                message: req.__('success.showing_data'),
                value: ''
              }])
          })
        } else {
          return res.json({
            data: null,
            meta: Meta.response('success', 200, [
              {
                param: '',
                message: req.__('success.showing_data'),
                value: ''
              }])
          })
        }
      } catch (error) {
        console.error(error)
        return res.json({
          data: null,
          meta: Meta.response('success', 200, [{
            param: '',
            message: res.__('success.showing_data'),
            value: ''
          }])
        })
      }
    } else {
      return res.json({
        data: null,
        meta: Meta.response('success', 200, [{
          param: '',
          message: res.__('success.showing_data'),
          value: ''
        }])
      })
    }
  }
})

module.exports = router
