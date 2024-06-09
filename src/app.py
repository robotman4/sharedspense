import os
import psycopg2
from flask import Flask, request, jsonify, redirect, url_for, session, send_from_directory
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get('APP_SECRET') # Needed for session management

# Function to connect to the database
def database_connect():
    try:
        # Read database credentials from environment variables
        dbname = os.environ.get('DB_NAME')
        user = os.environ.get('DB_USER')
        password = os.environ.get('DB_PASSWORD')
        host = os.environ.get('DB_HOST')
        port = os.environ.get('DB_PORT')

        # Connect to PostgreSQL database
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

# Function to verify bearer token
def verify_token(token):
    # Implement token verification logic
    return True # Just a placeholder, replace with actual logic

# Authentication decorator
def token_required(f):
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not verify_token(token):
            return jsonify({'message': 'Token is missing or invalid!'}), 403
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/img/<path:filename>')
def serve_img(filename):
    return send_from_directory('/app/frontend/img', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('/app/frontend/js', filename)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Implement your login logic here
        token = request.form.get('token')
        if verify_token(token):
            session['authenticated'] = True
            return redirect(url_for('client'))
        else:
            return jsonify({'message': 'Invalid credentials'}), 403
    # Return login form or page here
    return '''
        <form method="post">
            Token: <input type="text" name="token">
            <input type="submit" value="Login">
        </form>
    '''

@app.route('/client')
@token_required
def client():
    return send_from_directory('/app/frontend', 'client.html')

@app.route('/client/current')
@token_required
def client_current():
    return send_from_directory('/app/frontend', 'current.html')

@app.route('/client/archive')
@token_required
def client_archive():
    return send_from_directory('/app/frontend', 'archive.html')

@app.route('/api/v1/expense/unapproved', methods=['GET'])
@token_required
def get_unapproved_expenses():
    try:
        # Connect to the database
        conn = database_connect()
        if conn is None:
            return jsonify({'success': False, 'message': 'Failed to connect to the database'}), 500

        # Create a cursor object
        cursor = conn.cursor()

        # Execute the query to fetch unapproved expenses
        query = "SELECT * FROM expenses WHERE approved = false ORDER BY id"
        cursor.execute(query)

        # Fetch all rows
        rows = cursor.fetchall()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        # Convert rows to list of dictionaries for JSON response
        expenses = [{'id': row[0], 'name': row[1], 'cost': row[2], 'approved': row[3], 'month': row[4]} for row in rows]

        return jsonify({'success': True, 'message': 'Here is the list of unapproved expenses.', 'expenses': expenses}), 200
    except Exception as error:
        return jsonify({'success': False, 'message': f'Error fetching unapproved expenses: {error}'}), 500

@app.route('/api/v1/expense/create', methods=['POST'])
@token_required
def create_expense():
    try:
        # Get variables
        data = request.json
        name = data.get('name')
        cost = data.get('cost')
        month = datetime.now().month

        # Connect to the database
        conn = database_connect()
        if conn is None:
            return jsonify({'success': False, 'message': 'Failed to connect to the database'}), 500

        # Create a cursor object
        cursor = conn.cursor()

        # Execute the query to insert a record
        query = "INSERT INTO expenses (name, cost, month) VALUES (%s, %s, %s)"
        cursor.execute(query, (name, cost, month))

        # Commit the transaction
        conn.commit()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': 'Record added successfully'}), 200
    except Exception as error:
        return jsonify({'success': False, 'message': f'Error adding record: {error}'}), 500

@app.route('/api/v1/expense/update', methods=['PUT'])
@token_required
def update_expense():
    try:
        # Get variables
        data = request.json
        expense_id = data.get('id')
        name = data.get('name')
        cost = data.get('cost')
        month = datetime.now().month

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

        return jsonify({'message': 'Record updated successfully'}), 200
    except Exception as error:
        return jsonify({'message': f'Error updating record: {error}'}), 500

@app.route('/api/v1/expense/delete', methods=['DELETE'])
@token_required
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

if __name__ == '__main__':
    database_init() # Ensure the database is initialized
    app.run(host='0.0.0.0', port=5000, debug=True)
