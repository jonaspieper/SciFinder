from flask import Flask, render_template, request, send_from_directory
import duckdb
import json
import math

app = Flask(__name__)

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


if __name__ == '__main__':
    app.run()