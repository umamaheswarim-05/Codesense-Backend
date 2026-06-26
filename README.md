# CodeSense Backend

Node.js + Express.js REST API for the CodeSense AI-Driven Code Execution & Learning Analytics Platform.

## What This Does
- Handles student and educator authentication (JWT + bcryptjs)
- Receives code submissions and runs pattern-based execution engine
- Logs every execution to PostgreSQL database
- Serves ML risk predictions from the FastAPI ML service
- Returns AI-style error explanations to the frontend

## Tech Stack
- Node.js + Express.js
- PostgreSQL (pg)
- JWT + bcryptjs
- dotenv, cors

## Database Tables
- users — stores student and educator accounts
- executions — logs every code submission
- error_tags — classifies each error as Syntax / Logic / Runtime
- ml_predictions — stores Random Forest risk scores
- recommendations — stores personalised practice suggestions

## How to Run
```bash
npm install
node server.js
```

## Environment Variables (.env)
