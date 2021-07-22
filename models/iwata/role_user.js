'use strict'

module.exports = (sequelize, DataTypes) => {
  let RoleUser = sequelize.define('role_user', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    role_id: DataTypes.STRING,
    user_id: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: 'role_user'
  })

  RoleUser.associate = (models) => {
    RoleUser.belongsTo(models.user, {
      foreignKey: 'user_id'
    })
    RoleUser.belongsTo(models.role, {
      foreignKey: 'role_id'
    })
  }

  return RoleUser
}
