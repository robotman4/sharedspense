import os
import psycopg2
from flask import Flask, request, jsonify, redirect, url_for, session, send_from_directory
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = os.environ.get('APP_SECRET') # Needed for session management
app.permanent_session_lifetime = timedelta(days=7) # Set session to be permanent for 7 days

# Function to connect to the database
def database_connect(retries=5, delay=2):
    try:
        dbname = os.environ.get('DB_NAME')
        user = os.environ.get('DB_USER')
        password = os.environ.get('DB_PASSWORD')
        host = os.environ.get('DB_HOST')
        port = os.environ.get('DB_PORT')
    except Exception as error:
        print(f"Error while fetching connection details for database: {error}")
        return None

    for i in range(retries):
        try:
            conn = psycopg2.connect(
                dbname=dbname,
                user=user,
                password=password,
                host=host,
                port=port
            )
            return conn
        except Exception as error:
            print(f"Error while connecting to the database: {error}")
            if i < retries - 1:
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                return None

def database_init():
    try:
        # Connect to PostgreSQL database
        conn = database_connect()
        cursor = conn.cursor()

        # Create the expenses table
        create_table_query = '''
        CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            cost INT CHECK (cost >= 0 AND cost <= 10000000),
            month INT CHECK (month >= 1 AND month <= 12),
            year INT CHECK (year >=1970 AND year <=2999),
            approved BOOLEAN DEFAULT FALSE,
            paid BOOLEAN DEFAULT FALSE
        );
        '''

        cursor.execute(create_table_query)
        conn.commit()

        print("Table 'expenses' created successfully.")

    except Exception as error:
        print(f"Error while creating PostgreSQL table: {error}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def database_migrate(columns):
    try:
        conn = database_connect()
        cursor = conn.cursor()

        for column, column_type in columns.items():
            # Check if the column already exists
            check_column_query = '''
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='expenses' AND column_name=%s;
            '''
            cursor.execute(check_column_query, (column,))
            result = cursor.fetchone()

            # If the column does not exist, add it
            if not result:
                alter_table_query = f'''
                ALTER TABLE expenses
                ADD COLUMN {column} {column_type};
                '''
                cursor.execute(alter_table_query)
                conn.commit()
                print(f"Column '{column}' added to table 'expenses'.")
            else:
                print(f"Column '{column}' already exists in table 'expenses'.")

    except Exception as error:
        print(f"Error while altering PostgreSQL table: {error}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Authentication decorator
def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'authenticated' not in session:
            return redirect(url_for('client_login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/', methods=['GET'])
def index():
    return redirect(url_for('client_login'))

@app.route('/img/<path:filename>', methods=['GET'])
def serve_img(filename):
    return send_from_directory('/app/frontend/img', filename)

@app.route('/js/<path:filename>', methods=['GET'])
def serve_js(filename):
    return send_from_directory('/app/frontend/js', filename)

@app.route('/client', methods=['GET'])
@login_required
def client():
    return send_from_directory('/app/frontend', 'client.html')

@app.route('/client/current', methods=['GET'])
@login_required
def client_current():
    return send_from_directory('/app/frontend', 'current.html')

@app.route('/client/archive', methods=['GET'])
@login_required
def client_archive():
    return send_from_directory('/app/frontend', 'archive.html')

@app.route('/client/login', methods=['GET'])
def client_login():
    # Return login form or page here
    return send_from_directory('/app/frontend', 'login.html')

@app.route('/api/v1/login', methods=['POST'])
def login():
    # Get variables
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Get expected credentials from environment variables
    expected_username = os.environ.get('APP_USER')
    expected_password = os.environ.get('APP_PASS')

    # Check if the provided credentials match the expected credentials
    if username == expected_username and password == expected_password:
        session['authenticated'] = True
        session.permanent = True # Mark the session as permanent
        return jsonify({'success': True, 'message': 'Login was successfull'}), 200
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 403

@app.route('/api/v1/logout', methods=['GET'])
def logout():
    session.pop('authenticated', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@app.route('/api/v1/expense/unapproved', methods=['GET'])
@login_required
def get_unapproved_expenses():
    try:
        # Connect to the database
        conn = database_connect()
        if conn is None:
            return jsonify({'success': False, 'message': 'Failed to connect to the database'}), 500

        # Create a cursor object
        cursor = conn.cursor()

        # Execute the query to fetch unapproved expenses
        query = "SELECT id, name, cost, month, year, approved, paid FROM expenses WHERE approved = false ORDER BY id"
        cursor.execute(query)

        # Fetch all rows
        rows = cursor.fetchall()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        # Convert rows to list of dictionaries for JSON response
        expenses = [{'id': row[0], 'name': row[1], 'cost': row[2], 'month': row[3], 'year': row[4], 'approved': row[5], 'paid': row[6]} for row in rows]

        return jsonify({'success': True, 'message': 'Here is the list of unapproved expenses.', 'expenses': expenses}), 200
    except Exception as error:
        return jsonify({'success': False, 'message': f'Error fetching unapproved expenses: {error}'}), 500

@app.route('/api/v1/expense/create', methods=['POST'])
@login_required
def create_expense():
    try:
        # Get variables
        data = request.json
        name = data.get('name')
        cost = data.get('cost')
        month = datetime.now().month
        year = datetime.now().year

        # Connect to the database
        conn = database_connect()
        if conn is None:
            return jsonify({'success': False, 'message': 'Failed to connect to the database'}), 500

        # Create a cursor object
        cursor = conn.cursor()

        # Execute the query to insert a record
        query = "INSERT INTO expenses (name, cost, month, year) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (name, cost, month, year))

        # Commit the transaction
        conn.commit()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': 'Record added successfully'}), 200
    except Exception as error:
        return jsonify({'success': False, 'message': f'Error adding record: {error}'}), 500

@app.route('/api/v1/expense/update', methods=['PUT'])
@login_required
def update_expense():
    try:
        # Get variables
        data = request.json
        expense_id = data.get('id')
        name = data.get('name')
        cost = data.get('cost')
        month = datetime.now().month
        year = datetime.now().year

        # Connect to the database
        conn = database_connect()
        if conn is None:
            return jsonify({'success': False, 'message': 'Failed to connect to the database'}), 500

        # Create a cursor object
        cursor = conn.cursor()

        # Execute the query to update a record
        query = "UPDATE expenses SET name = %s, cost = %s, month = %s WHERE id = %s"
        cursor.execute(query, (name, cost, month, expense_id))

        # Commit the transaction
        conn.commit()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': 'Record updated successfully'}), 200
    except Exception as error:
        return jsonify({'success': False, 'message': f'Error updating record: {error}'}), 500

@app.route('/api/v1/expense/delete', methods=['DELETE'])
@login_required
def delete_expense():
    try:
        # Get variables
        data = request.json
        expense_id = data.get('id')

        # Connect to the database
        conn = database_connect()
        if conn is None:
            return jsonify({'success': False, 'message': 'Failed to connect to the database'}), 500

        # Create a cursor object
        cursor = conn.cursor()

        # Execute the query to delete a record
        query = "DELETE FROM expenses WHERE id = %s"
        cursor.execute(query, (expense_id,))

        # Commit the transaction
        conn.commit()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': 'Record deleted successfully'}), 200
    except Exception as error:
        return jsonify({'success': False, 'message': f'Error deleting record: {error}'}), 500

@app.route('/api/v1/expense/archive', methods=['POST'])
@login_required
def archive_expense():
    try:
        # Get variables
        data = request.json
        expense_id = data.get('id')
        month = data.get('month')
        year = data.get('year')

        # Connect to the database
        conn = database_connect()
        if conn is None:
            return jsonify({'success': False, 'message': 'Failed to connect to the database'}), 500

        # Create a cursor object
        cursor = conn.cursor()

        # Execute the query to insert a record
        query = "UPDATE expenses SET approved = true, month = %s, year = %s WHERE approved = false"
        cursor.execute(query, (month, year))

        # Commit the transaction
        conn.commit()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': 'Expenses now archived successfully'}), 200
    except Exception as error:
        return jsonify({'success': False, 'message': f'Error archiving expenses: {error}'}), 500

@app.route('/api/v1/expense/approved', methods=['GET'])
@login_required
def get_approved_expenses():
    try:
        # Connect to the database
        conn = database_connect()
        if conn is None:
            return jsonify({'success': False, 'message': 'Failed to connect to the database'}), 500

        # Create a cursor object
        cursor = conn.cursor()

        # Execute the query to fetch unapproved expenses
        query = "SELECT id, name, cost, month, year, approved, paid FROM expenses WHERE approved = false ORDER BY id"
        cursor.execute(query)

        # Fetch all rows
        rows = cursor.fetchall()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        # Convert rows to list of dictionaries for JSON response
        expenses = [{'id': row[0], 'name': row[1], 'cost': row[2], 'month': row[3], 'year': row[4], 'approved': row[5], 'paid': row[6]} for row in rows]

        return jsonify({'success': True, 'message': 'Here is the list of unapproved expenses.', 'expenses': expenses}), 200
    except Exception as error:
        return jsonify({'success': False, 'message': f'Error fetching unapproved expenses: {error}'}), 500

if __name__ == '__main__':
    database_init() # Ensure the database is initialized
    columns_to_add = {
        'year': 'INT'
    }
    database_migrate(columns_to_add)
    app.run(host='0.0.0.0', port=5000, debug=True)
