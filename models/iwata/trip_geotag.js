'use strict'

module.exports = (sequelize, DataTypes) => {
  let TripGeotag = sequelize.define('trip_geotag', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    trip_id: DataTypes.STRING,
    device_id: DataTypes.STRING,
    visitation_plan_id: DataTypes.STRING,
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING,
    geo_time: DataTypes.DATE,
    is_active: DataTypes.INTEGER
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  TripGeotag.associate = (models) => {
    // associations can be defined here

    TripGeotag.belongsTo(models.trip, {
      foreignKey: 'trip_id'
    })

    TripGeotag.belongsTo(models.visitation_plan, {
      foreignKey: 'visitation_plan_id'
    })

    TripGeotag.belongsTo(models.user, {
      foreignKey: 'user_id'
    })
  }

  return TripGeotag
}
