CREATE TABLE IF NOT EXISTS class_folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    parent_id INTEGER,
    path TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES class_folders(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_root_folder
ON class_folders(class_id, slug)
WHERE parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_child_folder
ON class_folders(class_id, parent_id, slug)
WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_class_folders_class_id ON class_folders(class_id);
CREATE INDEX IF NOT EXISTS idx_class_folders_parent_id ON class_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_class_folders_path ON class_folders(path);