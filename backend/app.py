import os
from flask import Flask, request, jsonify, redirect, url_for, session, send_from_directory
import psycopg2
from psycopg2 import sql

app = Flask(__name__)
app.secret_key = os.environ.get('APP_SECRET') # Needed for session management

def init_db():
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
    return send_file('/app/frontend/client.html')

@app.route('/client/current')
@token_required
def client():
    return send_file('/app/frontend/current.html')

@app.route('/client/archive')
@token_required
def client():
    return send_file('/app/frontend/archive.html')

@app.route('/api/v1/expense/unapproved', methods=['GET'])
@token_required
def get_unapproved_expenses():
    # Fetch and return unapproved expenses
    pass

@app.route('/api/v1/expense/create', methods=['POST'])
@token_required
def create_expense():
    data = request.json
    name = data.get('name')
    cost = data.get('cost')
    # Create new expense
    pass

@app.route('/api/v1/expense/update', methods=['PUT'])
@token_required
def update_expense():
    data = request.json
    expense_id = data.get('id')
    name = data.get('name')
    cost = data.get('cost')
    # Update the expense
    pass

@app.route('/api/v1/expense/delete', methods=['DELETE'])
@token_required
def delete_expense():
    data = request.json
    expense_id = data.get('id')
    # Delete the expense
    pass

if __name__ == '__main__':
    init_db() # Ensure the database is initialized
    app.run(host='0.0.0.0', port=5000, debug=True)
