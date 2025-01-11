module.exports = {
    db: {
      main: {
        dialect: 'postgres',
        host: 'localhost',
        port: '5432',
        database: 'SmartDetector',
        user: 'postgres',
        password: '1234',
        requestTimeout: 600000,
        isolationLevel: 'READ_UNCOMMITTED',
      }
    }
}