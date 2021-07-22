'use strict'
const Space = require('../../helpers/space')

module.exports = (sequelize, DataTypes) => {
  let ContactMedia = sequelize.define('contact_media', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    media_id: DataTypes.STRING,
    media_src: {
      type: DataTypes.STRING,
      get () {
        return Space.getImage(this.getDataValue('media_src'))
      }
    },
    user_id: DataTypes.STRING,
    contact_id: DataTypes.STRING,
    type: DataTypes.STRING // front outside inside shopkeeper
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  ContactMedia.associate = (models) => {
    // associations can be defined here

    ContactMedia.belongsTo(models.user, {
      foreignKey: 'user_id'
    })

    ContactMedia.belongsTo(models.contact, {
      foreignKey: 'contact_id'
    })

    ContactMedia.belongsTo(models.media, {
      foreignKey: 'media_id'
    })
  }

  return ContactMedia
}
