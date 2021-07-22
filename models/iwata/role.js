'use strict'

module.exports = (sequelize, DataTypes) => {
  let Role = sequelize.define('role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    type: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true
  })

  Role.associate = (models) => {
    Role.belongsToMany(models.permission, {
      foreignKey: 'role_id',
      through: models.permission_role
    })

    Role.belongsToMany(models.user, {
      foreignKey: 'role_id',
      through: models.role_user
    })

    Role.hasMany(models.permission_role, {
      foreignKey: 'role_id'
    })

    Role.hasMany(models.role_user, {
      foreignKey: 'role_id'
    })
  }

  return Role
}
