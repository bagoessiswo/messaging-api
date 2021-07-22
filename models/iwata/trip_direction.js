'use strict'

module.exports = (sequelize, DataTypes) => {
  let TripDirection = sequelize.define('trip_direction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    trip_id: DataTypes.STRING,
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING,
    geo_time: DataTypes.DATE
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  TripDirection.associate = (models) => {
    // associations can be defined here

    TripDirection.belongsTo(models.trip, {
      foreignKey: 'trip_id'
    })

    TripDirection.belongsTo(models.user, {
      foreignKey: 'user_id'
    })
  }

  return TripDirection
}
