'use strict'

const jwt = require('jsonwebtoken')
const JWTOptions = require('../config/jwt')
const moment = require('moment')
const Promise = require('bluebird')
const { Op } = require('sequelize')
const Models = require('../models/index')
const User = Models.user
const Role = Models.role
const UserToken = Models.user_token
const Branch = Models.branch
// const Permission = Models.permission

module.exports = {
  parseAuthHeader: (authorization) => {
    var re = /(\S+)\s+(\S+)/
    if (typeof authorization !== 'string') {
      return null
    }

    var matches = authorization.match(re)
    return matches && { scheme: matches[1], value: matches[2] }
  },

  getToken: (req) => {
    let token = null
    if (typeof req.headers['authorization'] !== 'undefined' && req.headers['authorization']) {
      let authParams = module.exports.parseAuthHeader(req.headers['authorization'])
      if (authParams) {
        token = authParams.value
      }
    } else if (typeof req.cookies !== 'undefined' && req.cookies && typeof req.cookies['token'] !== 'undefined' && req.cookies['token']) {
      token = req.cookies['token']
      return token
    }
    return token
  },

  decode: (req) => {
    return jwt.verify(module.exports.getToken(req), JWTOptions.secret)
  },

  getUser: (req, res, next) => {
    return new Promise((resolve, reject) => {
      const jwtPayload = module.exports.decode(req)

      if (jwtPayload) {
        return UserToken.findOne({
          where: {
            user_id: jwtPayload.id,
            jti: jwtPayload.jti,
            expires_at: {
              [Op.gt]: moment().format('YYYY-MM-DD HH:mm:ss')
            }
          }
        }).then(async (token) => {
          if (token) {
            try {
              let user = await User.findOne({
                where: {
                  id: jwtPayload.id
                },
                include: [
                  {
                    model: Role,
                    requried: true
                  },
                  {
                    model: Branch,
                    requried: true
                  }
                ],
                attributes: {
                  exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
                }
              })

              if (user) {
                return resolve(user)
              } else {
                return reject(new Error('User not found'))
              }
            } catch (error) {
              return reject(new Error(error))
            }
          } else {
            return reject(new Error('Token not found'))
          }
        })
      } else {
        return reject(new Error('Invalid token'))
      }
    })
  },

  hasRoles: (req, roles, required = false) => {
    return new Promise(function (resolve, reject) {
      const jwtPayload = module.exports.decode(req)

      if (jwtPayload) {
        return UserToken.findOne({
          where: {
            user_id: jwtPayload.id,
            jti: jwtPayload.jti,
            expires_at: {
              [Op.gt]: moment().format('YYYY-MM-DD HH:mm:ss')
            }
          }
        }).then(async (token) => {
          if (token) {
            try {
              let user = await User.findOne({
                where: {
                  id: jwtPayload.id
                },
                attributes: {
                  exclude: ['created_at', 'updated_at', 'deleted_at', 'password']
                }
              })

              if (user) {
                return user.getRoles({
                  where: {
                    slug: roles
                  }
                }).then(function (userRoles) {
                  // if required = true (check if user has all roles based on param)
                  if (userRoles && userRoles.length > 0 && required === true && roles.length === userRoles.length) {
                    return resolve(true)
                  } else if (userRoles && userRoles.length > 0 && required === false) { // if required = false
                    return resolve(true)
                  } else {
                    return resolve(false)
                  }
                }).catch((error) => {
                  console.error(error)
                  return reject(new Error('Role not found'))
                })
              } else {
                return reject(new Error('User not found'))
              }
            } catch (error) {
              return reject(new Error(error))
            }
          } else {
            return reject(new Error('Token not found'))
          }
        })
      } else {
        return reject(new Error('Invalid token'))
      }
    })
  }

  // hasPermissions: (req, permissions, options = {required: false}) => {
  //   return new Promise(function (resolve, reject) {
  //     // Get token from request
  //     let token = module.exports.decode(req)
  //     if (token) {
  //       // Get user by userId from token
  //       return User.findOne({
  //         where: {
  //           id: token.id
  //         }
  //       }).then(function (user) {
  //         if (user) {
  //           // Get all Roles with specific permission slugs
  //           let conditions = {
  //             '$permissions.slug$': permissions
  //           }

  //           if (typeof options.type !== 'undefined' && options.type !== '' && options.type !== null) {
  //             conditions.type = options.type
  //           }

  //           // Check if merchant & merchantId is valid
  //           if (options.type === 'merchant' && typeof req.params.merchantId !== 'undefined' && req.params.merchantId !== '' && req.params.merchantId !== null) {
  //             conditions['$user_role.user_roleable$'] = 'merchant'
  //             conditions['$user_role.user_roleable_id$'] = req.params.merchantId
  //           }

  //           return user.getRoles({
  //             attributes: [ ],
  //             where: conditions,
  //             distinct: true,
  //             include: [
  //               {
  //                 model: Permission,
  //                 required: true,
  //                 plain: true,
  //                 through: {
  //                   attributes: []
  //                 }
  //               }
  //             ]
  //           }).then(function (userRoles) {
  //             // check role exists
  //             if (userRoles && userRoles.length > 0) {
  //               let userPermissions = []

  //               // mapping permission into userPermissions
  //               userRoles.map(function (userRole) {
  //                 userRole.permissions.map(function (userPermission) {
  //                   userPermissions.push(userPermission.toJSON())
  //                 })
  //               })

  //               // remove duplicate userPermissions by permission id
  //               userPermissions = _.uniqBy(userPermissions, function (userPermission) {
  //                 return userPermission.id
  //               })

  //               // if required = true (check if user has all permissions based on param)
  //               if (userPermissions.length > 0 && options.required === true && userPermissions.length === permissions.length) {
  //                 return resolve(true)
  //               } else if (userPermissions.length > 0 && (options.required === false || typeof options.required === 'undefined')) { // if options.required = false
  //                 return resolve(true)
  //               } else {
  //                 return resolve(false)
  //               }
  //             } else {
  //               return resolve(false)
  //             }
  //           }).catch(function (error) {
  //             console.log(error)
  //             return reject(new Error('You don\'t have permission to perform this action'))
  //           })
  //         } else {
  //           return resolve(false)
  //         }
  //       }).catch(function (error) {
  //         console.log(error)
  //         return reject(new Error('You don\'t have permission to perform this action'))
  //       })
  //     } else {
  //       return resolve(false)
  //     }
  //   })
  // }
}
