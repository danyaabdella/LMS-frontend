# EduPlatform API Documentation

## Database Setup
\`\`\`bash
npm run db:migrate
\`\`\`

This creates all necessary tables with proper relationships and indexes.

## Environment Variables

Required environment variables:
\`\`\`
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## API Endpoints

### Exams

#### GET /api/exams
Fetch all exams with question counts.

**Response:**
\`\`\`json
[
  {
    "id": 1,
    "name": "Mathematics Quiz",
    "file_name": "math_mcq.docx",
    "status": "published",
    "question_count": 20,
    "created_at": "2024-11-14T10:30:00Z"
  }
]
\`\`\`

#### POST /api/exams/upload
Upload and parse MCQ file.

**Request:**
\`\`\`
FormData:
- file: File (.docx, .pdf, .txt)
- examName: string
- userId: number
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "examId": 1,
  "questionCount": 20
}
\`\`\`

### Quizzes

#### GET /api/quizzes/[examId]/questions
Get all questions for an exam with options.

**Response:**
\`\`\`json
[
  {
    "id": 1,
    "question_text": "What is the capital of France?",
    "question_number": 1,
    "difficulty": "easy",
    "options": [
      { "id": 1, "text": "London", "number": 0 },
      { "id": 2, "text": "Paris", "number": 1 }
    ]
  }
]
\`\`\`

#### POST /api/quizzes/submit
Submit quiz answers and get score.

**Request:**
\`\`\`json
{
  "examId": 1,
  "studentId": 5,
  "answers": {
    "1": 2,
    "2": 1
  },
  "durationSeconds": 1200
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "score": 85,
  "correct": 17,
  "total": 20
}
\`\`\`

### Analytics

#### GET /api/analytics/dashboard
Get complete analytics data for dashboard.

**Response:**
\`\`\`json
{
  "dailyVisits": [...],
  "enrollments": [...],
  "competition": { "participants": 453 },
  "purchases": [...],
  "totalStudents": 2458
}
\`\`\`

#### GET /api/users/count
Get total student count.

**Response:**
\`\`\`json
{
  "count": 2458
}
\`\`\`

## File Format for MCQ Upload

Supported formats: .docx, .pdf, .txt

Example format:
\`\`\`
Q1: What is the capital of France?
a) London
b) Paris*
c) Berlin
d) Madrid

Q2: Which is the largest ocean?
A) Atlantic
B) Indian
C) Arctic
D) Pacific*
\`\`\`

Note: Use asterisk (*) to mark correct answers.

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 400: Bad request (validation error)
- 404: Not found
- 500: Server error

Error response format:
\`\`\`json
{
  "error": "Description of error"
}
