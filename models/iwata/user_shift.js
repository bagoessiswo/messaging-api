'use strict'

module.exports = (sequelize, DataTypes) => {
  let UserShift = sequelize.define('user_shift', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    work_shift_id: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: 'user_shifts'
  })

  UserShift.associate = (models) => {
    UserShift.belongsTo(models.user, {
      foreignKey: 'user_id'
    })
    UserShift.belongsTo(models.work_shift, {
      foreignKey: 'work_shift_id'
    })
  }

  return UserShift
}
