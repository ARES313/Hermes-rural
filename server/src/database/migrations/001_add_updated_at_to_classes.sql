-- Migración: Agregar columna updated_at a la tabla classes
-- Descripción: La tabla classes necesita una columna updated_at para registrar cuándo se actualiza cada clase

-- Agregar la columna updated_at con valor por defecto NULL
-- (SQLite no permite funciones como CURRENT_TIMESTAMP como default en ALTER TABLE)
ALTER TABLE classes ADD COLUMN updated_at TEXT;
