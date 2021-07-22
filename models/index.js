'use strict'

var fs = require('fs')
var path = require('path')
const { Sequelize } = require('sequelize')
var basename = path.basename(module.filename)
var env = process.env.NODE_ENV || 'development'
var config = require(path.join(__dirname, '/../config/config.js'))[env]

const db = {}

// Extract the database information into an array
const databases = Object.keys(config.databases)

// Loop over the array and create a new Sequelize instance for every database from config.js
for (let i = 0; i < databases.length; ++i) {
  let database = databases[i]
  let dbPath = config.databases[database]
  dbPath.connectionTimeout = 10000000
  dbPath.pool = {
    acquire: 60000,
    idle: 10000
  }
  // Store the database connection in our db object
  db[database] = new Sequelize(dbPath.database, dbPath.username, dbPath.password, dbPath)
}

fs
  .readdirSync(path.join(__dirname, '/iwata'))
  .filter((file) => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, '/iwata', file))(db.iwata, Sequelize)
    db[model.name] = model
  })

Object.keys(db).forEach(function (modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})
// db.sequelize = sequelize

module.exports = db
