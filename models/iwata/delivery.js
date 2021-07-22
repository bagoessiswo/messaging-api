'use strict'

module.exports = (sequelize, DataTypes) => {
  let Delivery = sequelize.define('delivery', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    invoice: DataTypes.STRING,
    delivery_invoice: DataTypes.STRING,
    contact_id: DataTypes.STRING,
    user_id: DataTypes.STRING,
    status: DataTypes.STRING, // pending | assigned | on_progress | canceled | delivered
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING,
    address: DataTypes.STRING,
    notes: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  Delivery.associate = (models) => {
    // associations can be defined here

    Delivery.belongsTo(models.user, {
      foreignKey: 'user_id'
    })

    Delivery.belongsTo(models.contact, {
      foreignKey: 'contact_id'
    })
  }

  return Delivery
}
