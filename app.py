import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_session import Session
from sqlalchemy.orm import DeclarativeBase
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv  # ✅ Add this line

# ✅ Load environment variables from .env
load_dotenv()

# Enable logging
logging.basicConfig(level=logging.DEBUG)

# Setup DB base
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")  # ✅ Securely loaded

# --- Session Config ---
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
Session(app)

# --- Enable CORS ---
CORS(app, supports_credentials=True)

# --- Google OAuth Setup ---
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.environ.get("GOOGLE_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"}
)

# --- DATABASE SETUP ---
database_url = os.environ.get("DATABASE_URL")
if not database_url:
    logging.error("DATABASE_URL is not set in environment variables.")
    raise RuntimeError("Missing DATABASE_URL. Set it in your Render environment.")

# Configure database URI
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# --- App Context ---
with app.app_context():
    import models  # ensure models are registered
    db.create_all()  # create tables

    import routes
    import auth_routes

# Export app
__all__ = ["app"]
