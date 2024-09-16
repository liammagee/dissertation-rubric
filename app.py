from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from openai import OpenAI
import json
import markdown


import os
from dotenv import load_dotenv
from models import db, DissertationSection  # Import from models.py
from flask_wtf.csrf import CSRFProtect


# Load environment variables from .env file
load_dotenv()

client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
)


app = Flask(__name__)
csrf = CSRFProtect(app)
app.secret_key = 'your_secret_key'  # Replace with a secure secret key in production


# Configure the SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dissertation.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


# Initialize the db with the app
db.init_app(app)



# Load sections data from JSON file
with open('sections.json', 'r', encoding='utf-8') as f:
    sections = json.load(f)


@app.context_processor
def inject_current_year():
    return {'current_year': datetime.utcnow().year}


@app.route('/')
def home():
    with app.app_context():
        all_sections = DissertationSection.query.all()
        if not all_sections:
            for sec in sections:
                new_section = DissertationSection(section_name=sec['name'])
                db.session.add(new_section)
            db.session.commit()
    return render_template('home.html', sections=sections)


@app.route('/<section>', methods=['GET', 'POST'])
def edit_section(section):
    sec = DissertationSection.query.filter_by(section_name=section).first()
    if not sec:
        return "Section not found.", 404

    if request.method == 'POST':
        content = request.form.get('content', '')
        sec.content = content
        db.session.commit()
        return redirect(url_for('home'))

    content = sec.content if sec.content else ''
    # Get the section data from the loaded sections
    sec_data = next((s for s in sections if s['name'] == section), None)
    if not sec_data:
        return "Section data not found.", 404

    description = sec_data['description']
    # Convert the overview from Markdown to HTML
    overview_markdown = sec_data['overview']
    overview_html = markdown.markdown(overview_markdown)

    return render_template('section.html', section=section, content=content, description=description, overview=overview_html)


@app.route('/preview')
def preview():
    # Retrieve all sections and their content
    all_sections = DissertationSection.query.all()
# Create a list of sections with their names and converted content
    dissertation = []
    for sec in all_sections:
        section_name = sec.section_name.replace('_', ' ').title()
        content_markdown = sec.content if sec.content else 'No content yet.'
        # Convert the content from Markdown to HTML
        content_html = markdown.markdown(content_markdown)
        dissertation.append({
            'name': section_name,
            'content': content_html
        })
    return render_template('preview.html', dissertation=dissertation)


@app.route('/suggestion/<section>', methods=['POST'])
def get_suggestion(section):
    sec_info = next((s for s in sections if s['name'] == section), None)
    if not sec_info:
        return jsonify({"error": "Invalid section"}), 400

    sec = DissertationSection.query.filter_by(section_name=section).first()
    current_content = sec.content if sec.content else ''

    # Get the content from the request (if any)
    data = request.get_json()
    if data and 'content' in data:
        current_content = data['content']

    overview_markdown = sec_info['overview']
    prompt = f"Using these instructions:\n\n\t'{overview_markdown}'\n\nRevise and improve the following {section.replace('_', ' ')} section of a dissertation:\n\n\t'{current_content}'\n\n."

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                 {"role": "system", "content": "You are a social science doctoral advisor. You provide specific and actionable suggestions for improving dissertation sections."},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
        )

        
        suggestions = response.choices[0].message.content.strip()
        return jsonify({"suggestions": suggestions})
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return jsonify({"error": "Failed to get suggestions from OpenAI."}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
