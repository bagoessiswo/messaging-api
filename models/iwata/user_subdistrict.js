'use strict'

module.exports = (sequelize, DataTypes) => {
  let UserSubdistrict = sequelize.define('user_subdistrict', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    subdistrict_id: DataTypes.INTEGER,
    user_id: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  UserSubdistrict.associate = (models) => {
    UserSubdistrict.belongsTo(models.user, {
      foreignKey: 'user_id'
    })
    UserSubdistrict.belongsTo(models.subdistrict, {
      foreignKey: 'subdistrict_id'
    })
  }

  return UserSubdistrict
}
