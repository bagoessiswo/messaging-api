'use strict'

module.exports = (sequelize, DataTypes) => {
  let UserWorkDay = sequelize.define('user_work_day', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    work_shift_id: DataTypes.STRING,
    work_schedule_id: DataTypes.STRING,
    schedule_checkin_at: DataTypes.STRING,
    schedule_checkout_at: DataTypes.STRING,
    date: DataTypes.DATE,
    checkin_at: DataTypes.STRING,
    checkout_at: DataTypes.STRING,
    checkin_id: DataTypes.STRING,
    checkout_id: DataTypes.STRING,
    is_late_checkin: DataTypes.INTEGER,
    late_minutes: DataTypes.INTEGER,
    is_late_checkout: DataTypes.INTEGER,
    debt_minutes: DataTypes.INTEGER,
    is_alpha: DataTypes.INTEGER,
    is_permitted_leave: DataTypes.INTEGER,
    is_sick_without_permit_leave: DataTypes.INTEGER,
    is_sick_with_permit_leave: DataTypes.INTEGER,
    is_paid_leave: DataTypes.INTEGER,
    is_mass_paid_leave: DataTypes.INTEGER,
    is_early_leave: DataTypes.INTEGER,
    leave_type: DataTypes.STRING, // alpha | perimitted_leave | sick_with_permit | sick_without_permit | paid_leave | mass_leave | early_leave
    is_holiday: DataTypes.INTEGER,
    holiday_type: DataTypes.STRING, // sunday | national
    notes: DataTypes.STRING,
    is_forget_checkin: DataTypes.INTEGER,
    is_forget_checkout: DataTypes.INTEGER,
    status: DataTypes.STRING // open | closed
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  UserWorkDay.associate = (models) => {
    // associations can be defined here

    UserWorkDay.belongsTo(models.user, {
      foreignKey: 'user_id'
    })

    UserWorkDay.belongsTo(models.user_attendance, {
      as: 'checkin',
      foreignKey: 'checkin_id'
    })

    UserWorkDay.belongsTo(models.user_attendance, {
      as: 'checkout',
      foreignKey: 'checkout_id'
    })

    UserWorkDay.belongsTo(models.work_schedule, {
      foreignKey: 'work_schedule_id'
    })
  }

  return UserWorkDay
}
