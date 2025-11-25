const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool (Optimized for scale)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Event listener for errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const query = (text, params) => pool.query(text, params);

module.exports = { query };