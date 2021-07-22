'use strict'
const Space = require('../../helpers/space')

module.exports = (sequelize, DataTypes) => {
  let UserAttendance = sequelize.define('user_attendance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    type: DataTypes.STRING, // checkin | checkout | early_leave
    time_log: DataTypes.DATE,
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING,
    contact_id: DataTypes.STRING,
    work_place_id: DataTypes.STRING,
    notes: DataTypes.STRING,
    approved_at: DataTypes.DATE,
    rejected_at: DataTypes.DATE,
    approved_by: DataTypes.STRING,
    rejected_by: DataTypes.STRING,
    status: DataTypes.STRING, // approved | pending | rejected,
    photo: {
      type: DataTypes.STRING,
      get () {
        return Space.getImage(this.getDataValue('photo'))
      }
    },
    media_id: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: 'user_attendances',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  UserAttendance.associate = (models) => {
    // associations can be defined here

    UserAttendance.belongsTo(models.user, {
      foreignKey: 'user_id'
    })

    UserAttendance.belongsTo(models.work_place, {
      foreignKey: 'work_place_id'
    })

    UserAttendance.belongsTo(models.user, {
      as: 'approver',
      foreignKey: 'approved_by'
    })

    UserAttendance.belongsTo(models.user, {
      as: 'rejector',
      foreignKey: 'rejected_by'
    })

    UserAttendance.belongsTo(models.media, {
      foreignKey: 'media_id'
    })

    UserAttendance.belongsTo(models.contact, {
      foreignKey: 'contact_id'
    })
  }

  UserAttendance.getEarlyAttendances = async () => {
    let query = `SELECT at1.* FROM iwata.user_attendances at1 INNER JOIN (
      SELECT min(time_log) early_time, DATE(time_log) log_date, id, type FROM iwata.user_attendances GROUP BY log_date, type, user_id
    ) at2 ON at1.time_log = at2.early_time AND at1.type = at2.type ORDER BY at1.time_log`

    let attendances = await sequelize.query(query)

    return attendances
  }

  return UserAttendance
}
