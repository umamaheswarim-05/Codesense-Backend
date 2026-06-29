# CodeSense Backend

Node.js + Express.js REST API server for the CodeSense AI-Driven Code Execution and Learning Analytics Platform.

## Overview
The backend is the core processing layer of CodeSense. It handles user authentication, receives code submissions from the frontend, forwards them to the Wandbox API for real execution, classifies errors, generates AI-style explanations, and logs all activity to a PostgreSQL database. It also communicates with the FastAPI ML service to retrieve student risk predictions for the educator dashboard.

## Tech Stack
- Node.js + Express.js — REST API and routing
- PostgreSQL + pg — Relational database and queries
- JWT + bcryptjs — Authentication and password hashing
- Wandbox API — Real code execution (Python, Java, C++, JavaScript)
- dotenv + cors — Environment config and cross-origin support

## Database Tables
- users — Student and educator accounts
- executions — Every code submission and its output
- errors — Error messages, types, and AI explanations
- ml_predictions — ML risk scores per student
- recommendations — Personalised practice suggestions

## API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login and receive JWT token |
| POST | /api/execute/run | Submit and execute code |
| GET | /api/dashboard/student | Student dashboard data |
| GET | /api/dashboard/educator | Educator dashboard data |

## How to Run
```bash
npm install
node server.js
```

## Environment Variables (.env)
