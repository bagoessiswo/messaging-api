'use strict'

module.exports = (sequelize, DataTypes) => {
  let UserWorkLate = sequelize.define('user_work_late', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    user_id: DataTypes.STRING,
    late_count: DataTypes.INTEGER
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  UserWorkLate.associate = (models) => {
    // associations can be defined here

    UserWorkLate.belongsTo(models.user, {
      foreignKey: 'user_id'
    })
  }

  return UserWorkLate
}
