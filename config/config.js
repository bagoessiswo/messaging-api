module.exports = {
  'local': {
    'databases': {
      'iwata': {
        'username': process.env.LOCAL_DB_USERNAME,
        'password': process.env.LOCAL_DB_PASSWORD,
        'database': process.env.LOCAL_DB_NAME,
        'host': process.env.LOCAL_DB_HOSTNAME,
        'port': process.env.LOCAL_DB_PORT,
        'dialect': 'mysql',
        'timezone': 'Asia/Jakarta'
      }
    }
  },
  'development': {
    'databases': {
      'iwata': {
        'username': process.env.DEVELOPMENT_DB_USERNAME,
        'password': process.env.DEVELOPMENT_DB_PASSWORD,
        'database': process.env.DEVELOPMENT_DB_NAME,
        'host': process.env.DEVELOPMENT_DB_HOSTNAME,
        'port': process.env.DEVELOPMENT_DB_PORT,
        'dialect': 'mysql',
        'timezone': 'Asia/Jakarta',
        'timeout': 100000000
      }
    }
  }

}
