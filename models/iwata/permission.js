'use strict'

module.exports = (sequelize, DataTypes) => {
  let Permission = sequelize.define('permission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    name: DataTypes.STRING,
    slug: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  Permission.associate = (models) => {
    Permission.belongsToMany(models.role, {
      foreignKey: 'permission_id',
      through: models.permission_role
    })

    Permission.hasMany(models.permission_role, {
      foreignKey: 'permission_id'
    })
  }

  return Permission
}
