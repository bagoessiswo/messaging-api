'use strict'

module.exports = (sequelize, DataTypes) => {
  let VisitationPlan = sequelize.define('visitation_plan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    contact_id: DataTypes.STRING,
    scheduled_at: DataTypes.DATE,
    checkin_at: DataTypes.DATE,
    checkout_at: DataTypes.DATE,
    checkin_latitude: DataTypes.STRING,
    checkin_longitude: DataTypes.STRING,
    checkout_latitude: DataTypes.STRING,
    checkout_longitude: DataTypes.STRING,
    is_report_submitted: DataTypes.INTEGER,
    status: DataTypes.STRING,
    visitation_plan_type_id: DataTypes.STRING,
    is_outbound_checkin: DataTypes.INTEGER,
    outbound_range: DataTypes.INTEGER
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  VisitationPlan.associate = (models) => {
    // associations can be defined here

    VisitationPlan.hasMany(models.trip_geotag, {
      foreignKey: 'visitation_plan_id'
    })

    VisitationPlan.belongsTo(models.user, {
      foreignKey: 'user_id'
    })

    VisitationPlan.belongsTo(models.contact, {
      foreignKey: 'contact_id'
    })

    VisitationPlan.hasOne(models.visitation_plan_report, {
      foreignKey: 'visitation_plan_id'
    })

    VisitationPlan.belongsTo(models.visitation_plan_type, {
      foreignKey: 'visitation_plan_type_id'
    })
  }

  return VisitationPlan
}
