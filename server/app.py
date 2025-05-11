import os
import matplotlib
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask import Flask

from server.routes.auth import auth_bp
from server.utils.load_data import initialize_db, get_new_data
from server.config import JWT_SECRET_KEY, SQLALCHEMY_DATABASE_URI
from server.models import db
from server.routes import auth_bp, comment_bp, iceberg_info_bp, iceberg_api_bp

matplotlib.use("Agg")

app = Flask(__name__)
cors = CORS(app, origins="http://localhost:5173")  # only allow front end queries
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
db.init_app(app)
JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(iceberg_info_bp, url_prefix="/iceberg_info")
app.register_blueprint(iceberg_api_bp, url_prefix="/iceberg_api")
app.register_blueprint(comment_bp, url_prefix="/iceberg")


def _initialize_database(data_dir):
    with app.app_context():
        db.drop_all()  # ! for debugging mode only
        db.create_all()
        initialize_db(data_dir=data_dir, db=db)


def _get_new_data(data_dir):
    json_path = os.path.join(data_dir, "icebergs.json")
    with app.app_context():
        get_new_data(scraped_json_path=json_path, db=db)


if __name__ == "__main__":
    # currently not all data is used for initialization
    _initialize_database(data_dir="../data/data")
    # optionally scrape new data from web page
    _get_new_data(data_dir="../data/data")
    app.run(debug=True, port=8080)
