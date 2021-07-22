'use strict'
const Space = require('../../helpers/space')

module.exports = (sequelize, DataTypes) => {
  let Contact = sequelize.define('contact', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    contact_category_id: DataTypes.STRING,
    contact_grade_id: DataTypes.STRING,
    type: DataTypes.STRING,
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    province_id: DataTypes.INTEGER,
    city_id: DataTypes.INTEGER,
    subdistrict_id: DataTypes.INTEGER,
    owner_name: DataTypes.STRING,
    phone: DataTypes.STRING,
    mobile_phone: DataTypes.STRING,
    email: DataTypes.STRING,
    input_source_id: DataTypes.STRING,
    status: DataTypes.STRING,
    created_by: DataTypes.STRING,
    updated_by: DataTypes.STRING,
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING,
    photo: {
      type: DataTypes.STRING,
      get () {
        return Space.getImage(this.getDataValue('photo'))
      }
    },
    notes: DataTypes.STRING,
    operational_time: DataTypes.STRING,
    plotted_by: DataTypes.STRING,
    verified_by: DataTypes.STRING,
    acquired_by: DataTypes.STRING,
    is_verified: DataTypes.INTEGER,
    is_acquired: DataTypes.INTEGER,
    plotted_at: DataTypes.DATE,
    verified_at: DataTypes.DATE,
    acquired_at: DataTypes.DATE,
    mitrakita_imported_at: DataTypes.DATE,
    is_mitrakita_imported: DataTypes.INTEGER,
    total_order: DataTypes.INTEGER,
    total_invoice: DataTypes.INTEGER,
    turnover: DataTypes.DECIMAL,
    credit_limit: DataTypes.DECIMAL,
    credit_limit_balance: DataTypes.DECIMAL,
    branch_id: DataTypes.STRING,
    outstanding_bill: DataTypes.DECIMAL,
    due_date: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  Contact.associate = (models) => {
    // associations can be defined here

    Contact.hasMany(models.visitation_plan, {
      foreignKey: 'contact_id'
    })

    Contact.belongsTo(models.city, {
      foreignKey: 'city_id'
    })

    Contact.belongsTo(models.province, {
      foreignKey: 'province_id'
    })

    Contact.belongsTo(models.subdistrict, {
      foreignKey: 'subdistrict_id'
    })

    Contact.belongsTo(models.contact_category, {
      foreignKey: 'contact_category_id'
    })

    Contact.belongsTo(models.contact_grade, {
      foreignKey: 'contact_grade_id'
    })

    Contact.belongsTo(models.user, {
      as: 'creator',
      foreignKey: 'created_by'
    })

    Contact.belongsTo(models.user, {
      as: 'updater',
      foreignKey: 'updated_by'
    })

    Contact.belongsTo(models.user, {
      as: 'plotter',
      foreignKey: 'plotted_by'
    })

    Contact.belongsTo(models.user, {
      as: 'verificator',
      foreignKey: 'verified_by'
    })

    Contact.belongsTo(models.user, {
      as: 'acquisitor',
      foreignKey: 'acquired_by'
    })

    Contact.hasMany(models.contact_condition, {
      foreignKey: 'contact_id'
    })

    Contact.hasMany(models.visitation_plan_report, {
      foreignKey: 'contact_id'
    })

    Contact.belongsTo(models.input_source, {
      foreignKey: 'input_source_id'
    })

    Contact.hasMany(models.user_attendance, {
      foreignKey: 'contact_id'
    })

    Contact.hasMany(models.contact_media, {
      foreignKey: 'contact_id'
    })

    Contact.belongsTo(models.branch, {
      foreignKey: 'branch_id'
    })
  }

  // Contact.getNearestId = async (lat, long) => {
  //   let query = `SELECT near.id FROM (SELECT ST_Distance_Sphere(ST_GeomFromText('POINT(${long} ${lat})'), point(c.longitude, c.latitude)) as distance, c.* FROM iwata.contacts c where c.latitude is not null and c.longitude is not null order by distance asc) as near;`

  //   let contacts = await sequelize.query(query)

  //   contacts.map(contact => {
  //     return contact.id
  //   })
  //   return contacts
  // }

  return Contact
}
