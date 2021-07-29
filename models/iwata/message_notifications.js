'use strict'

module.exports = (sequelize, DataTypes) => {
  const MessageNotification = sequelize.define('message_notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    created_by: DataTypes.STRING,
    to: DataTypes.STRING,
    media: DataTypes.STRING,
    message: DataTypes.STRING,
    scheduled_at: DataTypes.DATE,
    status: DataTypes.STRING // pending | failed | success
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  MessageNotification.associate = (models) => {
    // associations can be defined here

    MessageNotification.belongsTo(models.user, {
      foreignKey: 'created_by'
    })
  }

  return MessageNotification
}
