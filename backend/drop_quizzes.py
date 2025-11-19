import sqlite3
import os

db_path = 'db.sqlite3'
if not os.path.exists(db_path):
    print("db.sqlite3 not found")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
tables = ['quizzes_attempt', 'quizzes_choice', 'quizzes_question', 'quizzes_quiz']
for table in tables:
    try:
        cursor.execute(f"DROP TABLE IF EXISTS {table}")
        print(f"Dropped {table}")
    except Exception as e:
        print(f"Error dropping {table}: {e}")
conn.commit()
conn.close()
