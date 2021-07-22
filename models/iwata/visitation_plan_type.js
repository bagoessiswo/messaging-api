'use strict'

module.exports = (sequelize, DataTypes) => {
  let VisitationPlanType = sequelize.define('visitation_plan_type', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  VisitationPlanType.associate = (models) => {
    VisitationPlanType.hasMany(models.visitation_plan, {
      foreignKey: 'visitation_plan_type_id'
    })
  }

  return VisitationPlanType
}
