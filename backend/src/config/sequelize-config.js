require('dotenv').config();

const productionConfig = process.env.DATABASE_URL
  ? {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
      }
    }
  : {
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
      }
    };

module.exports = {
  development: {
    username: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || null,
    database: process.env.PGDATABASE || 'attendance_dev',
    host: process.env.PGHOST || '127.0.0.1',
    port: process.env.PGPORT || 5432,
    dialect: 'postgres',
    logging: true
  },
  test: {
    username: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || null,
    database: process.env.PGDATABASE || 'attendance_test',
    host: process.env.PGHOST || '127.0.0.1',
    port: process.env.PGPORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: productionConfig
};
