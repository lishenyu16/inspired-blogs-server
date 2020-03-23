const { Pool, Client } = require('pg')
const pool = new Pool({
    user: 'zbmgnfho',
    host: 'drona.db.elephantsql.com',
    database: 'zbmgnfho',
    password: 'PuHf3gZOdoTzuD7SbQ0md_zc8lyovnN_',
    port: 5432,
})
module.exports = pool


// Transaction example: 
// async () => {
//     const client = await pool.connnect();
//     try {
//         await client.query('BEGIN');
//         const queryText = 'INSERT INTO users(name) VALUES($1) RETURNING id';
//         const res = await client.query(queryText,['Jim']);

//         const queryText2 = 'INSERT INTO photos(user_id, photo_url) VALUES ($1, $2)';
//         await client.query(queryText2, [res.rows[0].id, 's3.bucket.foo']);
//         client.query('COMMIT');
//     }
//     catch(err){
//         await client.query('ROLLBACK')
//     }
//     finally{
//         client.releaase();
//     }
// }

// Single query example:
// async () => {
//     const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [1]);
//     console.log('user:', rows[0])

// }