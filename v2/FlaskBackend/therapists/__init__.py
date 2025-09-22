from flask import Blueprint

therapists_bp = Blueprint('therapists', __name__)

from . import routes
