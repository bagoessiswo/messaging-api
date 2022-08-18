'use strict'

module.exports = (sequelize, DataTypes) => {
  const IntervieweeSchedule = sequelize.define('interviewee_schedule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    date: DataTypes.DATE,
    time: DataTypes.STRING,
    note: DataTypes.STRING,
    interviewee_id: DataTypes.STRING,
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  IntervieweeSchedule.associate = (models) => {
    IntervieweeSchedule.belongsTo(models.interviewee, {
      foreignKey: 'interviewee_id'
    })
  }

  return IntervieweeSchedule
}
