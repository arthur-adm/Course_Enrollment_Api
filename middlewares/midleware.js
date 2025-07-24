const db = require('../dbConnection/db');
const jwt = require ('jsonwebtoken');
require("dotenv").config();

function validateEmailFormat(req, res, next) {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  next();
};

async function checkEmailExists(req, res, next) {
  const { email } = req.body;
  try {
    const result = await db('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    next();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function authorizeRole(req,res,next){
    jwt.verify(req.headers['jwt'],process.env.JWT_KEY,(err,user)=>{
        if(err){
            return res.status(400).json({message:"your jwt token invalid or expired, login at first"});
        }
        if(user.role!== "admin"){
            return res.status(404).json({message:"you dont have admin privilegies"});
        }
        next();
    })
};
function authenticateVerify(req,res,next){
    jwt.verify(req.headers['jwt'],process.env.JWT_KEY,(err,user)=>{
        if(err){
            return res.status(400).json({message:"your jwt token invalid or expired, login at first"});
        }
        next()
    })
};
function validateCourseInput(req, res, next) {
  const { title, description, price, category, isPublished } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: 'Price must be a valid non-negative number' });
  }
  const isPublishedBool =
    isPublished === true ||
    isPublished === 'true' ||
    isPublished === 1 ||
    isPublished === '1' ||
    isPublished === false ||
    isPublished === 'false' ||
    isPublished === 0 ||
    isPublished === '0';
  if (!isPublishedBool && isPublished !== undefined) {
    return res.status(400).json({ error: 'isPublished must be a boolean' });
  }
  // Optional: sanitize/fix values before passing to DB
  req.body.price = parsedPrice;
  req.body.isPublished = ['true', '1', true].includes(isPublished);
  next();
};

module.exports={checkEmailExists,validateEmailFormat,authorizeRole,authenticateVerify,validateCourseInput};