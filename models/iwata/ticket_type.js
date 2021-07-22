'use strict'

module.exports = (sequelize, DataTypes) => {
  let TicketType = sequelize.define('ticket_type', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  TicketType.associate = (models) => {
    // associations can be defined here

    TicketType.hasMany(models.ticket, {
      foreignKey: 'ticket_type_id'
    })
  }
  return TicketType
}
