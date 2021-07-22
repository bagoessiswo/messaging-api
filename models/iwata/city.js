'use strict'

module.exports = (sequelize, DataTypes) => {
  let City = sequelize.define('city', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    province_id: DataTypes.STRING,
    type: DataTypes.STRING,
    name: DataTypes.STRING,
    postal_code: DataTypes.STRING,
    slug: DataTypes.STRING,
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING,
    icon: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  City.associtate = (models) => {
    City.belongsTo(models.provice, {
      foreignKey: 'province_id'
    })
  }

  return City
}
