'use strict'

module.exports = (sequelize, DataTypes) => {
  let WorkPlace = sequelize.define('work_place', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    province_id: DataTypes.INTEGER,
    city_id: DataTypes.INTEGER,
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING,
    maximum_attendance_radius: DataTypes.INTEGER,
    sequence: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  WorkPlace.associate = (models) => {
    // associations can be defined here

    WorkPlace.hasMany(models.user_attendance, {
      foreignKey: 'work_place_id'
    })

    WorkPlace.belongsTo(models.province, {
      foreignKey: 'province_id'
    })

    WorkPlace.belongsTo(models.city, {
      foreignKey: 'city_id'
    })
  }

  return WorkPlace
}
