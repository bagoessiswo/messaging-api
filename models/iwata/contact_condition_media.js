'use strict'
const Space = require('../../helpers/space')

module.exports = (sequelize, DataTypes) => {
  let ContactConditionMedia = sequelize.define('contact_condition_media', {
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
    contact_condition_id: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  ContactConditionMedia.associate = (models) => {
    // associations can be defined here

    ContactConditionMedia.belongsTo(models.contact_condition, {
      foreignKey: 'contact_condition_id'
    })

    ContactConditionMedia.belongsTo(models.media, {
      foreignKey: 'media_id'
    })
  }

  return ContactConditionMedia
}
