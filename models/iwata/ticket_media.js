'use strict'
const Space = require('../../helpers/space')

module.exports = (sequelize, DataTypes) => {
  let TicketMedia = sequelize.define('ticket_media', {
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
    ticket_id: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  TicketMedia.associate = (models) => {
    // associations can be defined here

    TicketMedia.belongsTo(models.ticket, {
      foreignKey: 'ticket_id'
    })

    TicketMedia.belongsTo(models.media, {
      foreignKey: 'media_id'
    })
  }

  return TicketMedia
}
