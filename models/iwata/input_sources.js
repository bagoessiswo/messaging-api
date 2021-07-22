'use strict'

module.exports = (sequelize, DataTypes) => {
  let InputSource = sequelize.define('input_source', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    url: DataTypes.STRING,
    sequence: DataTypes.INTEGER,
    status: DataTypes.STRING,
    name: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  InputSource.associate = (models) => {
    InputSource.hasMany(models.contact, {
      foreignKey: 'input_source_id'
    })
  }

  return InputSource
}
