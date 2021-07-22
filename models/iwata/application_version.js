'use strict'
module.exports = (sequelize, DataTypes) => {
  let ApplicationVersion = sequelize.define('application_version', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    name: DataTypes.STRING,
    application_version_type_id: DataTypes.STRING,
    release_date: DataTypes.DATE,
    release_notes: DataTypes.STRING,
    deprecated_date: DataTypes.DATE,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  ApplicationVersion.associate = function (models) {
    // associations can be defined here

    ApplicationVersion.belongsTo(models.application_version_type, {
      foreignKey: 'application_version_type_id'
    })
  }

  return ApplicationVersion
}
