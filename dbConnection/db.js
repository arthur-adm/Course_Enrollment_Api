const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool(
    {
        user:process.env.PG_USER,
        password:process.env.PG_PASSWORD,
        port:5432,
        host:'localhost',
        database:process.env.PG_DATABASE
    }
);

const db = async function(text,data){
    try{
        return await pool.query(text,data);
    }catch(err){
        console.log(err.message);
        throw new Error(err.message);
    }
};

module.exports = db;