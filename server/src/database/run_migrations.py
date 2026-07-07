import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'Redes.db'
MIGRATIONS_DIR = BASE_DIR / 'migrations'

if not MIGRATIONS_DIR.exists():
    print("Migrations directory not found, nothing to migrate.")
else:
    migration_files = sorted(MIGRATIONS_DIR.glob('*.sql'))
    if not migration_files:
        print("No migration files found.")
    else:
        print(f"Running {len(migration_files)} migration(s) on {DB_PATH}")
        
        conn = sqlite3.connect(DB_PATH)
        conn.execute('PRAGMA foreign_keys = ON;')
        
        for migration_file in migration_files:
            print(f"Running migration: {migration_file.name}")
            try:
                sql_text = migration_file.read_text(encoding='utf-8')
                # Usar executescript para permitir múltiples comandos
                conn.executescript(sql_text)
                print(f"✓ {migration_file.name} completed successfully")
            except sqlite3.OperationalError as e:
                # Si la columna ya existe, ignorar el error
                if "duplicate column name" in str(e) or "already exists" in str(e):
                    print(f"⚠ {migration_file.name} - Column already exists, skipping")
                else:
                    print(f"✗ Error in {migration_file.name}: {e}")
                    raise
        
        conn.commit()
        conn.close()
        print('All migrations completed successfully.')
