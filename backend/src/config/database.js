const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;
let isSqlite = false;

if (process.env.DATABASE_URL) {
  // Production / Render PostgreSQL using connection string
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Render/Supabase/Neon PostgreSQL
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
} else if (process.env.DB_DIALECT === 'sqlite' || (!process.env.PGDATABASE && !process.env.PGUSER)) {
  // Local SQLite database fallback
  isSqlite = true;
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH || './data/database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
} else {
  // Standard PostgreSQL connection using separate parameters
  sequelize = new Sequelize(
    process.env.PGDATABASE,
    process.env.PGUSER,
    process.env.PGPASSWORD,
    {
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
      }
    }
  );
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    if (isSqlite) {
      console.log('SQLite connection established successfully.');
    } else {
      console.log('PostgreSQL connection established successfully.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, Sequelize, testConnection };
