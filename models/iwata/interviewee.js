'use strict'

module.exports = (sequelize, DataTypes) => {
  const Interviewee = sequelize.define('interviewee', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    name: DataTypes.STRING,
    birthplace: DataTypes.STRING,
    birthdate: DataTypes.DATE,
    mobile_phone: DataTypes.STRING,
    address: DataTypes.STRING,
    form_id: DataTypes.STRING,
    status: DataTypes.STRING,
    total_score: DataTypes.STRING,
    hrd_scoring: DataTypes.STRING,
    answers: {
      type: DataTypes.JSON,
      get () {
        if (this.getDataValue('answers') !== undefined && this.getDataValue('answers') !== null && this.getDataValue('answers') !== '') {
          return JSON.parse(this.getDataValue('answers'))
        } else {
          return this.getDataValue('answers')
        }
      }
    },
    is_bio: DataTypes.INTEGER,
    is_question: DataTypes.INTEGER,
    is_schedule: DataTypes.INTEGER
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  Interviewee.associate = (models) => {
    //Interviewee.belongsTo(models.form, {
    //  foreignKey: 'form_id'
    //})

    Interviewee.hasMany(models.interviewee_schedule, {
      foreignKey: 'interviewee_id'
    })
  }

  return Interviewee
}
