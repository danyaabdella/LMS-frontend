-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student', -- 'admin', 'student'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'processing'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  difficulty VARCHAR(50) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question Options table
CREATE TABLE question_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_number INTEGER NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Quiz Attempts table
CREATE TABLE quiz_attempts (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  score DECIMAL(5, 2),
  total_questions INTEGER,
  correct_answers INTEGER,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  duration_seconds INTEGER
);

-- Student Responses table
CREATE TABLE student_responses (
  id SERIAL PRIMARY KEY,
  quiz_attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  selected_option_id INTEGER REFERENCES question_options(id),
  is_correct BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table
CREATE TABLE page_analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  page_name VARCHAR(255),
  visit_date DATE,
  visit_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Enrollments table
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  exam_id INTEGER NOT NULL REFERENCES exams(id),
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active' -- 'active', 'completed', 'dropped'
);

-- Course Purchases table
CREATE TABLE course_purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  package_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2),
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competitions table
CREATE TABLE competitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competition Participants table
CREATE TABLE competition_participants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  competition_id INTEGER NOT NULL REFERENCES competitions(id),
  rank INTEGER,
  score DECIMAL(10, 2),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_quiz_attempts_exam_id ON quiz_attempts(exam_id);
CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX idx_student_responses_attempt_id ON student_responses(quiz_attempt_id);
CREATE INDEX idx_page_analytics_date ON page_analytics(visit_date);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_exam_id ON enrollments(exam_id);
CREATE INDEX idx_course_purchases_user_id ON course_purchases(user_id);
