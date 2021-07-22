'use strict'

module.exports = (sequelize, DataTypes) => {
  let ContactReview = sequelize.define('contact_review', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    contact_id: DataTypes.STRING,
    status: DataTypes.STRING,
    user_id: DataTypes.STRING,
    payment_method: DataTypes.STRING,
    payment_plafon: DataTypes.DECIMAL,
    payment_status: DataTypes.STRING,
    condition_type_id: DataTypes.STRING,
    previous_supplier: DataTypes.STRING,
    previous_supplier_discount: DataTypes.STRING,
    previous_payment_method: DataTypes.STRING,
    product_completeness: DataTypes.STRING,
    product_bestseller: DataTypes.STRING,
    product_type: DataTypes.STRING,
    open_since: DataTypes.STRING,
    shop_building_status: DataTypes.STRING,
    shop_building_location: DataTypes.STRING,
    total_shopkeeper: DataTypes.INTEGER
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  ContactReview.associate = (models) => {
    // associations can be defined here

    ContactReview.belongsTo(models.user, {
      foreignKey: 'user_id'
    })

    ContactReview.belongsTo(models.contact, {
      foreignKey: 'contact_id'
    })
  }
  return ContactReview
}
