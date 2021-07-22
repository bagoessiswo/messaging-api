'use strict'

module.exports = (sequelize, DataTypes) => {
  let WorkShift = sequelize.define('work_shift', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    work_place_id: DataTypes.STRING,
    name: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  WorkShift.associate = (models) => {
    // associations can be defined here

    WorkShift.belongsTo(models.work_place, {
      foreignKey: 'work_place_id'
    })

    WorkShift.belongsToMany(models.work_schedule, {
      foreignKey: 'work_shift_id',
      through: models.work_shift_schedule
    })
  }

  return WorkShift
}
