'use strict'

module.exports = (sequelize, DataTypes) => {
  let Reason = sequelize.define('reason', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
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

  Reason.associate = (models) => {
    Reason.hasMany(models.visitation_plan_report, {
      foreignKey: 'reason_id'
    })
  }

  return Reason
}
