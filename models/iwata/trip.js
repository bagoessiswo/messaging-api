'use strict'

module.exports = (sequelize, DataTypes) => {
  let Trip = sequelize.define('trip', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    started_at: DataTypes.DATE,
    finished_at: DataTypes.DATE,
    cancelled_at: DataTypes.DATE,
    status: DataTypes.STRING, // started | finished | canceled | pending
    type: DataTypes.STRING, // visitation
    total_distance: DataTypes.INTEGER,
    total_visitation_distance: DataTypes.INTEGER,
    is_optimized: DataTypes.INTEGER
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  Trip.associate = (models) => {
    // associations can be defined here

    Trip.hasMany(models.trip_geotag, {
      foreignKey: 'trip_id'
    })

    Trip.belongsTo(models.user, {
      foreignKey: 'user_id'
    })
  }

  return Trip
}
