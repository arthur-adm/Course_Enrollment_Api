 Course_Enrollment_Api

A RESTful API for managing course creation, enrollment, and access — built with Node.js, Express, PostgreSQL, and JWT authentication.

⸻

 Features
	1. Authentication using JWT (Student & Admin roles)
	2.Course Management (Admin only)
	3.Create, update, delete, publish/unpublish
	-	Enrollment System
	-	Free or paid enrollment
	-	Prevent duplicate enrollment
	-	Mock Payment Endpoint
	-	Simulates payment with success/failure
	-	Validates payment amount
	-	Middleware-based validation (email, role, input)
	-	PostgreSQL schema and data checks

 Getting Started

1. Clone the repo
     git clone https://github.com/arthur-adm/Course_Enrollment_Api.git
     cd Course_Enrollment_Api

2.Install dependencies
     npm install

3.Create a .env file based on this template:
     PORT=3001
     DB_URL=postgres://username:password@localhost:5432/your_database
     JWT_KEY=your_jwt_secret_key
     SALT=10
     API_KEY=your_admin_registration_key
     PG_PASSWORD=your_db_password
     PG_DATABAS=your_database
     PG_USER=your_database_user
     
4. Set up the database


API Endpoints

 Auth
	•	POST /auth/register — Register as student or admin (with api_key)
	•	POST /auth/login — Login and receive JWT

 Courses
	•	POST /courses (admin only) — Create a course
	•	PUT /courses/:id (admin only) — Update a course
	•	DELETE /courses/:id (admin only) — Delete a course
	•	GET /courses — Get all published courses

 Enrollment
	•	POST /enrollments/:courseId — Enroll in a course (free or paid)
	•	GET /enrollments (admin only) — List all enrollments with users and course titles
	•	GET /me/courses — Get enrolled courses for logged-in student

 Mock Payments
	•	POST /payments/pay
	•	Accepts: amount, userId, courseId
	•	Simulates success/failure or checks payment vs course price


 Example Postman Request
 
 POST /auth/register
{
  "name": "Arthur",
  "email": "arthur@gmail.com",
  "password": "1234567890"
}
Use api_key: <your_api_key> header to register as admin.

Folder Structure
Course_Enrollment_Api/
├── dbConnection/       # PostgreSQL connection
├── middlewares/        # Auth, validation, role check
├── routes/             # Auth, courses, enrollments, payments
├── utils/              # JWT creator
├── schema.sql          # DB table schema
├── .env                # Environment variables (ignored)
├── .gitignore
├── server.js


Notes
	•	.env is ignored in .gitignore — create your own based on .env.example
	•	Use admin API_KEY to register admin users
	•	Paid enrollments require mock payment first
