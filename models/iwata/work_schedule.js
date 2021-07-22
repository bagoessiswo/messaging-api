'use strict'

module.exports = (sequelize, DataTypes) => {
  let WorkSchedule = sequelize.define('work_schedule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    work_place_id: DataTypes.STRING,
    day: DataTypes.INTEGER,
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    type: DataTypes.STRING,
    checkin_at: DataTypes.STRING,
    checkout_at: DataTypes.STRING,
    briefing_at: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  WorkSchedule.associate = (models) => {
    // associations can be defined here

    WorkSchedule.belongsTo(models.work_place, {
      foreignKey: 'work_place_id'
    })

    WorkSchedule.belongsToMany(models.work_shift, {
      foreignKey: 'work_schedule_id',
      through: models.work_shift_schedule
    })
  }

  return WorkSchedule
}
