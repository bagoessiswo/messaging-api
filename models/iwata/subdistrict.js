'use strict'

module.exports = (sequelize, DataTypes) => {
  let Subdistrict = sequelize.define('subdistrict', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    city_id: DataTypes.INTEGER,
    province_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING,
    slug: DataTypes.STRING,
    status: DataTypes.STRING,
    delivery_fee: DataTypes.DECIMAL
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  Subdistrict.associate = (models) => {
    Subdistrict.belongsTo(models.city, {
      foreignKey: 'city_id'
    })

    Subdistrict.belongsTo(models.province, {
      foreignKey: 'province_id'
    })

    Subdistrict.hasMany(models.contact, {
      foreignKey: 'subdistrict_id'
    })
  }

  return Subdistrict
}
