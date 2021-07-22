'use strict'
const Space = require('../../helpers/space')
const Op = require('sequelize').Op
const Promise = require('bluebird')

module.exports = (sequelize, DataTypes) => {
  let Media = sequelize.define('media', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    mediable: DataTypes.STRING,
    mediable_id: DataTypes.STRING,
    context: DataTypes.STRING,
    user_id: DataTypes.STRING,
    title: DataTypes.STRING,
    content: DataTypes.STRING,
    src: {
      type: DataTypes.STRING,
      get () {
        if (this.getDataValue('resource_type') === 'video') {
          return Space.getVideo(this.getDataValue('src'))
        } else if (this.getDataValue('resource_type') === 'audio') {
          return Space.getAudio(this.getDataValue('src'))
        } else {
          return Space.getImage(this.getDataValue('src'))
        }
      }
    },
    format: DataTypes.STRING,
    resource_type: DataTypes.STRING,
    height: DataTypes.DECIMAL,
    width: DataTypes.DECIMAL,
    bytes: DataTypes.DECIMAL
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  Media.associate = function (models) {
    Media.belongsTo(models.user, {
      foreignKey: 'user_id'
    })
  }

  Media.addHook('afterDestroy', 'removeCDNFile', function (media, options) {
    Space.remove(media.src, function (error, result) {
      if (error) {
        console.log(error)
      }
    })
  })

  Media.getFileName = function (value) {
    return new Promise(function (resolve, reject) {
      return Media.findOne({
        where: {
          [Op.or]: [
            {
              id: value

            },
            {
              src: value
            }
          ],
          mediable: null,
          mediable_id: null
        }
      }).then(function (media) {
        if (media) {
          return resolve(media.src.file_name)
        } else {
          return reject(new Error('Media doesn\'t exist'))
        }
      })
    })
  }

  Media.getMedia = function (value) {
    return new Promise(function (resolve, reject) {
      return Media.findOne({
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
      }).then(function (media) {
        if (media) {
          return resolve(media)
        } else {
          return reject(new Error('Media doesn\'t exist'))
        }
      })
    })
  }

  Media.prototype.useMedia = function (mediable, mediableId) {
    let media = this
    return sequelize.models.media.update({
      mediable: null,
      mediable_id: null
    }, {
      where: {
        mediable: mediable,
        mediable_id: mediableId
      }
    }).then(function (result) {
      return media.update({
        mediable: mediable,
        mediable_id: mediableId
      }).then(function (media) {
        return media
      }).catch(function (error) {
        console.log(error)
        return false
      })
    })
  }

  return Media
}
