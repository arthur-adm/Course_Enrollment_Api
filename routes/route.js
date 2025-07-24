const express = require('express');
const db = require('../dbConnection/db');
const {validateEmailFormat,checkEmailExists,authorizeRole,authenticateVerify,validateCourseInput} = require('../middlewares/midleware');
require('dotenv').config();
const bcrypt = require('bcrypt');
const createjwt = require('../utils/createjwt')

const register = express.Router();
const login = express.Router();
const courses = express.Router();
const enrollments = express.Router();
const payments = express.Router();


register.post('/auth/register',validateEmailFormat,checkEmailExists,async (req,res)=>{
    const {name,password,email} = req.body;
    let role = 'student';
    if(req.headers['api_key']===process.env.API_KEY){
        role = 'admin';
    }
    console.log(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(password,Number(process.env.SALT));
    const text = 'insert into users (name,password,email,role) values($1,$2,$3,$4)'
    const data = [];
    data.push(name,hashedPassword,email,role);
    try{
        const result =await db(text,data);
        res.status(201).json({message:"registered successfuly"});
    }catch(err){
        console.error(err.message);
        res.status(500).json({message:"Server internal error"});
    }
});



login.get('/auth/login',validateEmailFormat,async (req,res)=>{
    const {email,password} = req.body;
    text = "select * from users where email=$1";
    try{
        const result = await db(text,[email]);
        if(!result.rows.length>0 || !(await bcrypt.compare(password,result.rows[0].password))){
            return res.status(404).json({message:"invalid mail or password"});
        }
        res.status(200).json({message:`you are loged in successfuly, its your jwt token-${createjwt(result.rows[0])}`})
    }catch(err){
        console.error(err.message);
        res.status(500).json({message:"internal server error"});
    }
});



courses.post('/courses',authorizeRole,validateCourseInput,async(req,res)=>{
    const {title,description,price,category,isPublished} = req.body;
    try {
    await db(
      'INSERT INTO courses (title, description, price, category, isPublished) VALUES ($1, $2, $3, $4, $5)',
      [title, description, price, category, isPublished]
    );
    res.status(201).json({ message: 'Course created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});



courses.put('/courses/:id', authorizeRole, validateCourseInput, async (req, res) => {
  const { title, description, price, category, isPublished } = req.body;
  const courseId = req.params.id;
  try {
    const result = await db(
      `UPDATE courses
       SET title = $1,
           description = $2,
           price = $3,
           category = $4,
           isPublished = $5
       WHERE id = $6
       RETURNING *`,
      [title, description, price, category, isPublished, courseId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json({ message: 'Course updated successfully', course: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});



courses.delete('/courses/:id', authorizeRole, async (req, res) => {
  const courseId = req.params.id;
  try {
    const result = await db.query(
      'DELETE FROM courses WHERE id = $1 RETURNING *',
      [courseId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json({ message: 'Course deleted successfully', course: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  };
});



enrollments.post('/enrollments/:courseId', authenticateVerify, async (req, res) => {
  const courseId = req.params.courseId;
  const {userId} = req.body;
  try {
    const courseRes = await db('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const course = courseRes.rows[0];
    const check = await db(
      'SELECT * FROM enrollments WHERE courseid = $1 AND usersid = $2',
      [courseId, userId]
    );
    if (check.rows.length > 0) {
      return res.status(409).json({ error: 'Already enrolled' });
    }
    if (parseFloat(course.price) > 0) {
      return res.status(402).json({
        message: 'Payment required before enrollment',
        courseId: courseId,
        amount: course.price,
        next: '/payments/pay'
      });
    }
    await db(
      'INSERT INTO enrollments (courseid, usersid) VALUES ($1, $2)',
      [courseId, userId]
    );
    res.status(201).json({ message: 'Enrolled successfully (free course)' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

enrollments.get('/enrollments', authenticateVerify,authorizeRole, async (req, res) => {
  try {
    const result = await db(`
      SELECT
        e.usersid AS userId,
        u.email,
        e.courseid AS courseId,
        c.title
      FROM enrollments e
      JOIN users u ON u.id = e.usersid
      JOIN courses c ON c.id = e.courseid
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching enrollments:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});



payments.post('/payments/pay', async (req, res) => {
  const { userId, courseId, payment } = req.body;
  if (!userId || !courseId || payment === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const courseRes = await db  ('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const course = courseRes.rows[0];
    const price = parseFloat(course.price);
    const paid = parseFloat(payment);
    if (paid < price) {
      return res.status(402).json({
        status: 'failure',
        message: 'Insufficient payment',
        required: price,
        paid: paid,
        shortage: price - paid
      });
    }
    const change = paid > price ? paid - price : 0;
    await db(
      'INSERT INTO enrollments (courseid, usersid) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [courseId, userId]
    );
    res.status(200).json({
      status: 'success',
      message: 'Payment accepted and user enrolled',
      paid,
      required: price,
      change: change
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports={payments,enrollments,courses,register,login};