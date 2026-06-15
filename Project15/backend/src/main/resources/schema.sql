PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(50),
    role INTEGER NOT NULL DEFAULT 2,
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar VARCHAR(500),
    status INTEGER NOT NULL DEFAULT 1,
    create_time DATETIME,
    update_time DATETIME,
    deleted INTEGER NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS knowledge_point;
CREATE TABLE knowledge_point (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    subject VARCHAR(50),
    parent_id INTEGER,
    description TEXT,
    create_time DATETIME,
    update_time DATETIME,
    deleted INTEGER NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS question;
CREATE TABLE question (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type INTEGER NOT NULL,
    content TEXT NOT NULL,
    image VARCHAR(500),
    analysis TEXT,
    difficulty INTEGER NOT NULL DEFAULT 3,
    score REAL NOT NULL DEFAULT 5.0,
    subject VARCHAR(50),
    create_by INTEGER,
    create_time DATETIME,
    update_time DATETIME,
    deleted INTEGER NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS question_option;
CREATE TABLE question_option (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    option_label VARCHAR(10) NOT NULL,
    option_content TEXT,
    is_correct INTEGER NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS question_knowledge;
CREATE TABLE question_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    knowledge_id INTEGER NOT NULL
);

DROP TABLE IF EXISTS paper;
CREATE TABLE paper (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(50),
    total_score REAL NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 60,
    total_questions INTEGER NOT NULL DEFAULT 0,
    status INTEGER NOT NULL DEFAULT 0,
    create_by INTEGER,
    create_time DATETIME,
    update_time DATETIME,
    deleted INTEGER NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS paper_question;
CREATE TABLE paper_question (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    question_order INTEGER NOT NULL DEFAULT 0,
    score REAL NOT NULL DEFAULT 5.0
);

DROP TABLE IF EXISTS exam;
CREATE TABLE exam (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time DATETIME,
    end_time DATETIME,
    duration INTEGER,
    status INTEGER NOT NULL DEFAULT 0,
    create_by INTEGER,
    create_time DATETIME,
    update_time DATETIME,
    deleted INTEGER NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS exam_student;
CREATE TABLE exam_student (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status INTEGER NOT NULL DEFAULT 0,
    start_time DATETIME,
    submit_time DATETIME,
    total_score REAL DEFAULT 0,
    auto_score REAL DEFAULT 0,
    manual_score REAL DEFAULT 0
);

DROP TABLE IF EXISTS answer_record;
CREATE TABLE answer_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_student_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    user_answer TEXT,
    is_correct INTEGER DEFAULT 0,
    score REAL DEFAULT 0,
    auto_score REAL DEFAULT 0,
    manual_score REAL DEFAULT 0,
    similarity REAL DEFAULT 0,
    create_time DATETIME,
    update_time DATETIME
);

DROP TABLE IF EXISTS wrong_book;
CREATE TABLE wrong_book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    wrong_count INTEGER NOT NULL DEFAULT 1,
    last_wrong_time DATETIME,
    master_status INTEGER NOT NULL DEFAULT 0,
    create_time DATETIME,
    update_time DATETIME,
    deleted INTEGER NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS study_progress;
CREATE TABLE study_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    knowledge_id INTEGER NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    accuracy REAL DEFAULT 0,
    last_practice_time DATETIME
);

CREATE INDEX idx_user_role ON sys_user(role);
CREATE INDEX idx_user_status ON sys_user(status);
CREATE INDEX idx_question_type ON question(type);
CREATE INDEX idx_question_subject ON question(subject);
CREATE INDEX idx_question_difficulty ON question(difficulty);
CREATE INDEX idx_question_knowledge_qid ON question_knowledge(question_id);
CREATE INDEX idx_question_knowledge_kid ON question_knowledge(knowledge_id);
CREATE INDEX idx_paper_create_by ON paper(create_by);
CREATE INDEX idx_paper_status ON paper(status);
CREATE INDEX idx_paper_question_pid ON paper_question(paper_id);
CREATE INDEX idx_exam_paper_id ON exam(paper_id);
CREATE INDEX idx_exam_status ON exam(status);
CREATE INDEX idx_exam_student_examid ON exam_student(exam_id);
CREATE INDEX idx_exam_student_userid ON exam_student(user_id);
CREATE INDEX idx_answer_record_esid ON answer_record(exam_student_id);
CREATE INDEX idx_answer_record_qid ON answer_record(question_id);
CREATE INDEX idx_wrong_book_uid ON wrong_book(user_id);
CREATE INDEX idx_wrong_book_qid ON wrong_book(question_id);
CREATE INDEX idx_study_progress_uid ON study_progress(user_id);
CREATE INDEX idx_study_progress_kid ON study_progress(knowledge_id);

PRAGMA foreign_keys = ON;
