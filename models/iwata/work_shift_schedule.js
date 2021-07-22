'use strict'

module.exports = (sequelize, DataTypes) => {
  let WorkShiftSchedule = sequelize.define('work_shift_schedule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    work_shift_id: DataTypes.STRING,
    work_schedule_id: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: 'work_shift_schedules'
  })

  WorkShiftSchedule.associate = (models) => {
    WorkShiftSchedule.belongsTo(models.work_schedule, {
      foreignKey: 'work_schedule_id'
    })
    WorkShiftSchedule.belongsTo(models.work_shift, {
      foreignKey: 'work_shift_id'
    })
  }

  return WorkShiftSchedule
}
