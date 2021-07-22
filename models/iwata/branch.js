'use strict'

module.exports = (sequelize, DataTypes) => {
  let Branch = sequelize.define('branch', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    name: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  Branch.associate = (models) => {
    Branch.hasMany(models.user, {
      foreignKey: 'branch_id'
    })

    Branch.hasMany(models.contact, {
      foreignKey: 'branch_id'
    })
  }
  return Branch
}
