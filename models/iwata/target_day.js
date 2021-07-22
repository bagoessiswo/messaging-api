'use strict'

module.exports = (sequelize, DataTypes) => {
  let TargetDay = sequelize.define('target_day', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    sales_target_id: DataTypes.STRING,
    day: DataTypes.INTEGER,
    total_visitation: DataTypes.INTEGER,
    total_repeat_order: DataTypes.INTEGER,
    total_new_order: DataTypes.INTEGER,
    total_omzet_repeat_order: DataTypes.DECIMAL,
    total_omzet_new_order: DataTypes.DECIMAL,
    is_holiday: DataTypes.INTEGER
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  TargetDay.associate = (models) => {
    TargetDay.belongsTo(models.sales_target, {
      foreignKey: 'sales_target_id'
    })
  }

  return TargetDay
}
