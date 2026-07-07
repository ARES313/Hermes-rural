import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'Redes.db'
SCHEMA_DIR = BASE_DIR / 'schema'

if not SCHEMA_DIR.exists():
    raise FileNotFoundError(f"Schema directory not found: {SCHEMA_DIR}")

sql_files = sorted(SCHEMA_DIR.glob('*.sql'))
if not sql_files:
    raise FileNotFoundError(f"No SQL files found in {SCHEMA_DIR}")

print(f"Loading {len(sql_files)} schema files into {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
conn.execute('PRAGMA foreign_keys = ON;')
for sql_file in sql_files:
    print(f"Applying {sql_file.name}")
    sql_text = sql_file.read_text(encoding='utf-8')
    conn.executescript(sql_text)

conn.commit()
conn.close()
print('Schema import completed successfully.')
