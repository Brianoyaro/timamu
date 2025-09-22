from flask import request, jsonify
from ..models import File
from .. import db
files_bp = Blueprint('files', __name__)

@files_bp.route('/', methods=['GET'])
def list_files():
    files = File.query.all()
    return jsonify([{'id': f.id, 'file_name': f.file_name, 'category': f.category} for f in files])
