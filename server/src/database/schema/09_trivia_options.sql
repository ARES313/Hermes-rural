-- Tabla de opciones de respuesta para preguntas de trivia
CREATE TABLE IF NOT EXISTS trivia_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL,
    FOREIGN KEY (question_id) REFERENCES trivia_questions(id) ON DELETE CASCADE,
    UNIQUE(question_id, position),
    CHECK (is_correct IN (0, 1))
);