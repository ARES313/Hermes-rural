-- Tabla de matriculación de estudiantes en clases
CREATE TABLE IF NOT EXISTS class_enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'active',
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE(class_id, student_id),
    CHECK (status IN ('active', 'removed'))
);