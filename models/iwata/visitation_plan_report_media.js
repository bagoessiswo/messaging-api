'use strict'
const Space = require('../../helpers/space')

module.exports = (sequelize, DataTypes) => {
  let VisitationPlanReportMedia = sequelize.define('visitation_plan_report_media', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    media_id: DataTypes.STRING,
    media_src: {
      type: DataTypes.STRING,
      get () {
        return Space.getImage(this.getDataValue('media_src'))
      }
    },
    visitation_plan_report_id: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  VisitationPlanReportMedia.associate = (models) => {
    // associations can be defined here

    VisitationPlanReportMedia.belongsTo(models.visitation_plan_report, {
      foreignKey: 'visitation_plan_report_id'
    })

    VisitationPlanReportMedia.belongsTo(models.media, {
      foreignKey: 'media_id'
    })
  }

  return VisitationPlanReportMedia
}
