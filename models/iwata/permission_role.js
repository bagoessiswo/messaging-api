'use strict'

module.exports = (sequelize, DataTypes) => {
  let PermissionRole = sequelize.define('permission_role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    role_id: DataTypes.STRING,
    permission_id: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: 'permission_role'
  })

  PermissionRole.associate = (models) => {
    PermissionRole.belongsTo(models.permission, {
      foreignKey: 'permission_id'
    })

    PermissionRole.belongsTo(models.role, {
      foreignKey: 'role_id'
    })
  }

  return PermissionRole
}
