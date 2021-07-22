'use strict'

module.exports = (sequelize, DataTypes) => {
  let ContactGrade = sequelize.define('contact_grade', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    text_color: DataTypes.STRING,
    background_color: DataTypes.STRING,
    sequence: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  return ContactGrade
}
