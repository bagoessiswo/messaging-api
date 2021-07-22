'use strict'

module.exports = (sequelize, DataTypes) => {
  let UserToken = sequelize.define('user_token', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    jti: DataTypes.STRING,
    agent: DataTypes.STRING,
    ip_address: DataTypes.STRING,
    application_type: DataTypes.STRING,
    application_version: DataTypes.STRING,
    device_id: DataTypes.STRING,
    revoked: DataTypes.INTEGER,
    expires_at: DataTypes.DATE
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  UserToken.associate = (models) => {
    // associations can be defined here

    UserToken.belongsTo(models.user, {
      foreignKey: 'user_id'
    })
  }

  return UserToken
}
