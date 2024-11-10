module.exports = {
    db: {
      main: {
        dialect: 'postgres',
        host: '127.0.0.1',
        port: '5436',
        database: 'SmartDetector',
        user: 'SA',
        password: 'avRK-LnF1n',
        requestTimeout: 600000,
        isolationLevel: 'READ_UNCOMMITTED',
      }
    }
}