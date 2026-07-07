-- Tabla de clases o cursos
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    teacher_id INTEGER NOT NULL,
    school_year TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    CHECK (status IN ('active', 'inactive'))
);