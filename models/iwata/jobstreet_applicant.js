'use strict'

module.exports = (sequelize, DataTypes) => {
  const JobstreetApplicant = sequelize.define('jobstreet_applicant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    name: DataTypes.STRING,
    mobile_phone: DataTypes.STRING,
    data: {
      type: DataTypes.JSON,
      get () {
        if (this.getDataValue('data') !== undefined && this.getDataValue('data') !== null && this.getDataValue('data') !== '') {
          return JSON.parse(this.getDataValue('data'))
        } else {
          return this.getDataValue('data')
        }
      }
    },
    is_responded: DataTypes.INTEGER,
    is_link_sent: DataTypes.INTEGER
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  return JobstreetApplicant
}
