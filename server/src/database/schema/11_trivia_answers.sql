-- Tabla de respuestas dadas por estudiantes en intentos de trivia
CREATE TABLE IF NOT EXISTS trivia_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_correct INTEGER NOT NULL DEFAULT 0,
    points_obtained REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (attempt_id) REFERENCES trivia_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES trivia_questions(id) ON DELETE RESTRICT,
    FOREIGN KEY (option_id) REFERENCES trivia_options(id) ON DELETE RESTRICT,
    UNIQUE(attempt_id, question_id),
    CHECK (is_correct IN (0, 1))
);