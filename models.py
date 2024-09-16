from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class DissertationSection(db.Model):
    __tablename__ = 'dissertation_section'

    id = db.Column(db.Integer, primary_key=True)
    section_name = db.Column(db.String(50), nullable=False, unique=True)
    content = db.Column(db.Text, nullable=True)

    def __init__(self, section_name, content=None):
        self.section_name = section_name
        self.content = content
