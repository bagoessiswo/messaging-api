'use strict'

module.exports = (sequelize, DataTypes) => {
  let ContactCondition = sequelize.define('contact_condition', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    created_by: DataTypes.STRING,
    updated_by: DataTypes.STRING,
    contact_id: DataTypes.STRING,
    condition_type_id: DataTypes.STRING,
    operational_time_start: DataTypes.STRING,
    operational_time_end: DataTypes.STRING,
    previous_supplier: DataTypes.STRING,
    previous_supplier_discount: DataTypes.STRING,
    best_selling_product: DataTypes.STRING,
    app_promotion_response: DataTypes.STRING,
    payment_method: DataTypes.STRING,
    notes: DataTypes.STRING,
    shopkeeper_name: DataTypes.STRING,
    shopkeeper_phone: DataTypes.STRING,
    total_shopkeeper: DataTypes.INTEGER,
    is_owner_exist: DataTypes.INTEGER,
    credit_score: DataTypes.DECIMAL,
    credit_notes: DataTypes.STRING,
    condition_score: DataTypes.DECIMAL,
    condition_notes: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  ContactCondition.associate = (models) => {
    // associations can be defined here

    ContactCondition.belongsTo(models.user, {
      as: 'creator',
      foreignKey: 'created_by'
    })

    ContactCondition.belongsTo(models.user, {
      as: 'updater',
      foreignKey: 'updated_by'
    })

    ContactCondition.belongsTo(models.contact, {
      foreignKey: 'contact_id'
    })

    ContactCondition.belongsTo(models.condition_type, {
      foreignKey: 'condition_type_id'
    })

    ContactCondition.hasMany(models.contact_condition_media, {
      foreignKey: 'contact_condition_id'
    })
  }

  return ContactCondition
}
