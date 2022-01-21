// import postgre pool
const { Pool }  = require('pg')

const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
}) 


module.exports = dbPool