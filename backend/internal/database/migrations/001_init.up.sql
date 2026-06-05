-- Migration: 001_init.up.sql
-- Creates the full schema for the ISTA-GOMA university platform.
-- Designed to be idempotent via CREATE TABLE IF NOT EXISTS.

-- ─── Users & Authentication ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id          TEXT        PRIMARY KEY,
    first_name  TEXT        NOT NULL,
    last_name   TEXT        NOT NULL,
    middle_name TEXT        NOT NULL DEFAULT '',
    email       TEXT        NOT NULL UNIQUE,
    role        TEXT        NOT NULL CHECK (role IN (
                    'student','teacher','apparitorat',
                    'secretariat_faculte','secretariat_general','rectorat'
                )),
    faculty_id  TEXT,
    ref_id      TEXT,
    phone       TEXT        NOT NULL DEFAULT '',
    avatar      TEXT        NOT NULL DEFAULT '',
    description TEXT        NOT NULL DEFAULT '',
    active      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_credentials (
    user_id       TEXT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT        NOT NULL,
    activated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS activation_tokens (
    id         TEXT        PRIMARY KEY,
    user_id    TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT        NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         TEXT        PRIMARY KEY,
    user_id    TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT        NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Academic Structure ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS faculties (
    id         TEXT        PRIMARY KEY,
    name       TEXT        NOT NULL,
    code       TEXT        NOT NULL UNIQUE,
    dean       TEXT        NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotions (
    id         TEXT        PRIMARY KEY,
    name       TEXT        NOT NULL,
    faculty_id TEXT        NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    level      TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id          TEXT        PRIMARY KEY,
    name        TEXT        NOT NULL,
    capacity    INTEGER     NOT NULL DEFAULT 0,
    description TEXT        NOT NULL DEFAULT '',
    category    TEXT        NOT NULL CHECK (category IN ('Laboratoire','Salle de cours','Auditoire')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Staff ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teachers (
    id          TEXT        PRIMARY KEY,
    matricule   TEXT        NOT NULL UNIQUE,
    first_name  TEXT        NOT NULL,
    last_name   TEXT        NOT NULL,
    middle_name TEXT        NOT NULL DEFAULT '',
    email       TEXT        NOT NULL UNIQUE,
    phone       TEXT        NOT NULL DEFAULT '',
    faculty_id  TEXT        NOT NULL REFERENCES faculties(id),
    title       TEXT        NOT NULL,
    status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('active','pending')),
    description TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Students ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS students (
    id              TEXT        PRIMARY KEY,
    matricule       TEXT        NOT NULL UNIQUE,
    first_name      TEXT        NOT NULL,
    last_name       TEXT        NOT NULL,
    middle_name     TEXT        NOT NULL DEFAULT '',
    birth_date      TEXT        NOT NULL DEFAULT '2000-01-01',
    email           TEXT        NOT NULL UNIQUE,
    phone           TEXT        NOT NULL DEFAULT '',
    gender          TEXT        NOT NULL CHECK (gender IN ('M','F')),
    promotion_id    TEXT        NOT NULL REFERENCES promotions(id),
    faculty_id      TEXT        NOT NULL REFERENCES faculties(id),
    status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('active','pending','suspended','excluded')),
    enrollment_date TEXT        NOT NULL,
    average         NUMERIC(4,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Courses & Schedules ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS courses (
    id           TEXT        PRIMARY KEY,
    code         TEXT        NOT NULL UNIQUE,
    name         TEXT        NOT NULL,
    credits      INTEGER     NOT NULL DEFAULT 0,
    faculty_id   TEXT        NOT NULL REFERENCES faculties(id),
    promotion_id TEXT        NOT NULL REFERENCES promotions(id),
    teacher_id   TEXT        REFERENCES teachers(id),
    room_id      TEXT        REFERENCES rooms(id),
    hours        INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
    id           TEXT        PRIMARY KEY,
    course_id    TEXT        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    promotion_id TEXT        NOT NULL REFERENCES promotions(id),
    teacher_id   TEXT        REFERENCES teachers(id),
    day          TEXT        NOT NULL CHECK (day IN ('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi')),
    start_time   TEXT        NOT NULL,
    end_time     TEXT        NOT NULL,
    room         TEXT        NOT NULL,
    start_date   TEXT,
    end_date     TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Grades & Appeals ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS grades (
    id               TEXT        PRIMARY KEY,
    student_id       TEXT        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id        TEXT        NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
    promotion_id     TEXT        NOT NULL REFERENCES promotions(id),
    score            NUMERIC(4,2) NOT NULL CHECK (score >= 0 AND score <= 20),
    status           TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','validated','rejected')),
    session          TEXT        NOT NULL,
    type             TEXT        NOT NULL CHECK (type IN ('TD','TP','Interro','Examen')),
    assessment_title TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id, type, assessment_title)
);

CREATE TABLE IF NOT EXISTS grade_appeals (
    id              TEXT        PRIMARY KEY,
    student_id      TEXT        NOT NULL REFERENCES students(id)  ON DELETE CASCADE,
    course_id       TEXT        NOT NULL REFERENCES courses(id),
    grade_id        TEXT        NOT NULL REFERENCES grades(id),
    reason          TEXT        NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','approved','rejected')),
    response        TEXT,
    estimated_grade NUMERIC(4,2) NOT NULL DEFAULT 0,
    proof_url       TEXT,
    status_message  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Assignments & Submissions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assignments (
    id               TEXT        PRIMARY KEY,
    course_id        TEXT        NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
    teacher_id       TEXT        NOT NULL REFERENCES teachers(id),
    title            TEXT        NOT NULL,
    description      TEXT        NOT NULL DEFAULT '',
    due_date         TEXT        NOT NULL,
    deadline_time    TEXT,
    duration_minutes INTEGER,
    type             TEXT        NOT NULL CHECK (type IN ('Formulaire','PDF','Lien')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
    id            TEXT        PRIMARY KEY,
    assignment_id TEXT        NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id    TEXT        NOT NULL REFERENCES students(id)    ON DELETE CASCADE,
    content       TEXT        NOT NULL,
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    grade         NUMERIC(4,2),
    feedback      TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_id, student_id)
);

-- ─── Course Resources ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS course_resources (
    id         TEXT        PRIMARY KEY,
    course_id  TEXT        NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
    teacher_id TEXT        NOT NULL REFERENCES teachers(id),
    title      TEXT        NOT NULL,
    type       TEXT        NOT NULL CHECK (type IN ('pdf','video','link','doc')),
    url        TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notifications & Announcements ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
    id          TEXT        PRIMARY KEY,
    type        TEXT        NOT NULL,
    message     TEXT        NOT NULL,
    target_role TEXT        NOT NULL,
    read        BOOLEAN     NOT NULL DEFAULT FALSE,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id         TEXT        PRIMARY KEY,
    title      TEXT        NOT NULL,
    body       TEXT        NOT NULL,
    author     TEXT        NOT NULL,
    date       TEXT        NOT NULL,
    audience   TEXT        NOT NULL DEFAULT 'all',
    priority   TEXT        NOT NULL DEFAULT 'info'
               CHECK (priority IN ('info','important','urgent')),
    scope      TEXT        NOT NULL DEFAULT 'global'
               CHECK (scope IN ('global','faculty','course')),
    target_id  TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_students_faculty     ON students(faculty_id);
CREATE INDEX IF NOT EXISTS idx_students_promotion   ON students(promotion_id);
CREATE INDEX IF NOT EXISTS idx_students_status      ON students(status);
CREATE INDEX IF NOT EXISTS idx_courses_faculty      ON courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_courses_promotion    ON courses(promotion_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher      ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_student       ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course        ON grades(course_id);
CREATE INDEX IF NOT EXISTS idx_grades_status        ON grades(status);
CREATE INDEX IF NOT EXISTS idx_schedules_promotion  ON schedules(promotion_id);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher    ON schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role   ON notifications(target_role, read);
CREATE INDEX IF NOT EXISTS idx_announcements_date   ON announcements(date DESC);
