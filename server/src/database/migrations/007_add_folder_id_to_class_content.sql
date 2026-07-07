ALTER TABLE class_content ADD COLUMN folder_id INTEGER REFERENCES class_folders(id);
CREATE INDEX IF NOT EXISTS idx_class_content_folder_id ON class_content(folder_id);