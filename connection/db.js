// import postgre pool
const { Pool }  = require('pg')

const dbPool = new Pool({
    host: 'ec2-34-194-171-47.compute-1.amazonaws.com',
    database: 'dci6qdenpdees',
    port: 5432,
    user: 'ltjikctdsuzngl',
    password: '316270c46964998b3a12cbb71cd3f9367c67cfc4b2e46bdf430afdfca9992003',
}) 


module.exports = dbPool