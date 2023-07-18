from flask import Flask, render_template, request, send_from_directory, session, jsonify
import duckdb
import json
import math

app = Flask(__name__)
app.config['SECRET_KEY'] = 'development'  # Only for development!
app.config['SQLALCHEMY_DATABASE_URI'] = 'duckdb:///data.duckdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


# Set the static folder for serving static files
app.static_folder = 'static'

# Database connection
@app.before_first_request
def setup_database():
    # Establish the connection to the DuckDB database
    app.config['db'] = duckdb.connect('data.duckdb')

# Route for index page
@app.route('/')
def index():
    return render_template('index.html')

# Route for serving ent_ids.json
@app.route('/ent_ids.json')
def serve_ent_ids():
    response = send_from_directory(app.root_path, 'ent_ids.json')
    response.headers['Cache-Control'] = 'public, max-age=31536000'  # cache for 1 year
    return response

@app.route('/results')
def results():
    # Get the ent_id from the URL parameter
    ent_id = request.args.get('ent_id')
    page = int(request.args.get('page', 1))
    per_page = 15  # Update to 15 articles per page

    # Retrieve the values associated with the ent_id from ent_ids.json
    with open('ent_ids.json') as json_file:
        ent_ids = json.load(json_file)
    values = ent_ids.get(ent_id, [])

    # Calculate the pagination variables
    total_results = len(set(values))
    total_pages = math.ceil(total_results / per_page)
    offset = (page - 1) * per_page

    # Execute the SQL query to retrieve titles, authors, year, and citation counts from the papers table
    with app.config['db'].cursor() as cursor:
        if values:
            query = f"""
                SELECT title, authors, year, citation_count
                FROM papers
                WHERE article_id IN {tuple(values)}
                ORDER BY citation_count DESC
                LIMIT {per_page} OFFSET {offset}
            """
            cursor.execute(query)
            results = [
                {
                    'title': row[0],
                    'authors': row[1],
                    'year': row[2],
                    'citation_count': row[3]
                }
                for row in cursor.fetchall()
            ]
        else:
            results = []

    return render_template('results.html', results=results, ent_id=ent_id, total_results=total_results, current_page=page, total_pages=total_pages)

@app.route('/add_to_basket', methods=['POST'])
def add_to_basket():
    ent_id = request.form.get('ent_id')
    title = request.form.get('title')

    # Initialize the basket in the session if it doesn't exist or is not a dict
    if 'basket' not in session or not isinstance(session['basket'], dict):
        session['basket'] = {}

    # Add the item to the basket
    if ent_id not in session['basket']:
        session['basket'][ent_id] = title

    # Save the changes to the session
    session.modified = True

    return { 'success': True }


@app.route('/remove_from_basket', methods=['POST'])
def remove_from_basket():
    ent_id = request.form.get('ent_id')

    # Remove the item from the basket if it's there
    if 'basket' in session and isinstance(session['basket'], dict) and ent_id in session['basket']:
        del session['basket'][ent_id]

    # Save the changes to the session
    session.modified = True

    return { 'success': True }
    
@app.route('/get_basket_contents', methods=['GET'])
def get_basket_contents():
    # Initialize the basket in the session if it doesn't exist or is not a dict
    if 'basket' not in session or not isinstance(session['basket'], dict):
        session['basket'] = {}

    # Get the titles of the selected articles from the basket
    basket_contents = list(session['basket'].values())

    return { 'success': True, 'basket_contents': basket_contents }

if __name__ == '__main__':
    app.run()
