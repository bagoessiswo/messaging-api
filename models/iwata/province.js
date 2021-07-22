'use strict'

module.exports = (sequelize, DataTypes) => {
  let Province = sequelize.define('province', {
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

  Province.associate = (models) => {
    Province.hasMany(models.city, {
      foreignKey: 'province_id'
    })

    Province.hasMany(models.subdistrict, {
      foreignKey: 'province_id'
    })
  }
  return Province
}
