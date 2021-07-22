'use strict'

module.exports = (sequelize, DataTypes) => {
  let Ticket = sequelize.define('ticket', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    ticketable: DataTypes.STRING,
    ticketable_id: DataTypes.STRING,
    reminder_at: DataTypes.DATE,
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    description: DataTypes.STRING,
    status: DataTypes.STRING,
    ticket_type_id: DataTypes.STRING,
    created_by: DataTypes.STRING,
    updated_by: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  Ticket.associate = (models) => {
    // associations can be defined here

    Ticket.belongsTo(models.user, {
      as: 'creator',
      foreignKey: 'created_by'
    })

    Ticket.belongsTo(models.user, {
      as: 'updater',
      foreignKey: 'updated_by'
    })

    Ticket.hasMany(models.ticket_user, {
      foreignKey: 'ticket_id'
    })

    Ticket.belongsTo(models.ticket_type, {
      foreignKey: 'ticket_type_id'
    })

    Ticket.hasMany(models.ticket_media, {
      foreignKey: 'ticket_id'
    })
  }
  return Ticket
}
