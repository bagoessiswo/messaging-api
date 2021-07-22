'use strict'

module.exports = (sequelize, DataTypes) => {
  let VisitationPlanReport = sequelize.define('visitation_plan_report', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    visitation_plan_id: DataTypes.STRING,
    contact_id: DataTypes.STRING,
    notes: DataTypes.STRING,
    visitation_plan_report_category_id: DataTypes.STRING,
    reason_id: DataTypes.STRING,
    reason_note: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  VisitationPlanReport.associate = (models) => {
    // associations can be defined here

    VisitationPlanReport.belongsTo(models.user, {
      foreignKey: 'user_id'
    })

    VisitationPlanReport.belongsTo(models.visitation_plan, {
      foreignKey: 'visitation_plan_id'
    })

    VisitationPlanReport.hasMany(models.visitation_plan_report_media, {
      foreignKey: 'visitation_plan_report_id'
    })

    VisitationPlanReport.belongsTo(models.reason, {
      foreignKey: 'reason_id'
    })

    VisitationPlanReport.belongsTo(models.visitation_plan_report_category, {
      foreignKey: 'visitation_plan_report_category_id'
    })

    VisitationPlanReport.belongsTo(models.contact, {
      foreignKey: 'contact_id'
    })
  }

  return VisitationPlanReport
}
