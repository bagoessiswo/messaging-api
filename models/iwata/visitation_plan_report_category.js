'use strict'

module.exports = (sequelize, DataTypes) => {
  let VisitationPlanReportCategory = sequelize.define('visitation_plan_report_category', {
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

  VisitationPlanReportCategory.associate = (models) => {
    VisitationPlanReportCategory.hasMany(models.visitation_plan_report, {
      foreignKey: 'visitation_plan_report_category_id'
    })
  }

  return VisitationPlanReportCategory
}
