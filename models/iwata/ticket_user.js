'use strict'

module.exports = (sequelize, DataTypes) => {
  let TicketUser = sequelize.define('ticket_user', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    ticket_id: DataTypes.STRING,
    assigned_at: DataTypes.DATE,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  TicketUser.associate = (models) => {
    // associations can be defined here

    TicketUser.belongsTo(models.user, {
      foreignKey: 'user_id'
    })

    TicketUser.belongsTo(models.ticket, {
      foreignKey: 'ticket_id'
    })
  }
  return TicketUser
}
