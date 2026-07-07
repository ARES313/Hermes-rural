-- Tabla de preguntas de trivia
CREATE TABLE IF NOT EXISTS trivia_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trivia_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 1,
    time_limit_seconds INTEGER,
    position INTEGER NOT NULL,
    FOREIGN KEY (trivia_id) REFERENCES trivias(id) ON DELETE CASCADE,
    UNIQUE(trivia_id, position)
);