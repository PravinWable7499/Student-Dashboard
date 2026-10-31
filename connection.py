# import pyodbc

# def get_db_connection():
#     try:
#         conn = pyodbc.connect(
#                 "DRIVER={ODBC Driver 18 for SQL Server};"
#                 "SERVER=localhost\\SQLEXPRESS;"
#                 "DATABASE=SMS;"
#                 "Trusted_Connection=yes;"
#                 "Encrypt=yes;"
#                 "TrustServerCertificate=yes;"
#             )
#         return conn
#     except Exception as e:
#         print(f"Database Connection Error: {e}")
#         return None


import os
import psycopg2
from psycopg2.extras import NamedTupleCursor

try:
    from dotenv import load_dotenv
    load_dotenv()          # reads .env on your PC; on Render it does nothing
except ImportError:
    pass


def get_db_connection():
    try:
        conn = psycopg2.connect(
            os.environ["DATABASE_URL"],
            cursor_factory=NamedTupleCursor,        # lets you use row.column_name like pyodbc
            options="-c timezone=Asia/Kolkata"
        )
        return conn
    except Exception as e:
        print(f"Database Connection Error: {e}")
        return None