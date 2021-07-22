'use strict'
const Space = require('../../helpers/space')

module.exports = (sequelize, DataTypes) => {
  let User = sequelize.define('user', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    avatar: {
      type: DataTypes.STRING,
      get () {
        return Space.getImage(this.getDataValue('avatar'))
      }
    },
    name: DataTypes.STRING,
    user_category_id: DataTypes.STRING,
    birthdate: DataTypes.DATE,
    mobile_phone: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    gender: DataTypes.STRING,
    joined_at: DataTypes.DATE,
    type: DataTypes.STRING,
    is_subscribed_newsletter: DataTypes.INTEGER,
    is_email_verified: DataTypes.INTEGER,
    is_mobile_phone_verified: DataTypes.INTEGER,
    is_verified_user: DataTypes.INTEGER,
    is_outlet: DataTypes.INTEGER,
    is_attendance_tracked: DataTypes.INTEGER,
    warehouse_id: DataTypes.STRING,
    branch_id: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  User.associate = (models) => {
    // associations can be defined here

    User.hasMany(models.trip, {
      foreignKey: 'user_id'
    })

    User.hasMany(models.visitation_plan, {
      foreignKey: 'user_id'
    })

    User.hasOne(models.user_work_late, {
      foreignKey: 'user_id'
    })

    User.hasMany(models.user_work_day, {
      foreignKey: 'user_id'
    })

    User.belongsToMany(models.role, {
      foreignKey: 'user_id',
      through: models.role_user
    })

    User.hasMany(models.role_user, {
      foreignKey: 'user_id'
    })

    User.hasMany(models.contact, {
      as: 'plottings',
      foreignKey: 'plotted_by'
    })

    User.hasMany(models.contact, {
      as: 'acquisitions',
      foreignKey: 'acquired_by'
    })

    User.hasMany(models.contact, {
      as: 'verifications',
      foreignKey: 'verified_by'
    })

    User.hasMany(models.user_subdistrict, {
      foreignKey: 'user_id'
    })

    User.belongsToMany(models.subdistrict, {
      foreignKey: 'user_id',
      through: models.user_subdistrict
    })

    User.hasOne(models.user_shift, {
      foreignKey: 'user_id'
    })

    User.hasMany(models.sales_target, {
      foreignKey: 'user_id'
    })

    User.belongsTo(models.branch, {
      foreignKey: 'branch_id'
    })
  }

  return User
}
