const express = require('express');
const {payments,enrollments,courses,register,login} = require('./routes/route');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use('/',register);
app.use('/',login);
app.use('/',courses);
app.use('/',enrollments);
app.use('/',payments);

app.listen(process.env.PORT,()=>console.log(`server is listening at port ${process.env.PORT}`));

