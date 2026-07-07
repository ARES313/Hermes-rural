-- Tabla de intentos de trivia por estudiante
CREATE TABLE IF NOT EXISTS trivia_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trivia_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TEXT,
    score REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress',
    FOREIGN KEY (trivia_id) REFERENCES trivias(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
    CHECK (status IN ('in_progress', 'submitted', 'graded'))
);