from flask import session, redirect, url_for, request, jsonify, render_template
from app import app, db, google
from models import User
import requests

def login_required(f):
    """Decorator to require authentication for routes"""
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            if request.is_json:
                return jsonify({'success': False, 'error': 'Authentication required'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/login')
def login():
    """Display login page"""
    if 'user' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/auth/google')
def google_auth():
    """Initiate Google OAuth"""
    try:
        # Use the current request host for the redirect URI
        redirect_uri = url_for('google_callback', _external=True, _scheme='https')
        app.logger.info(f"Redirect URI: {redirect_uri}")
        return google.authorize_redirect(redirect_uri)
    except Exception as e:
        app.logger.error(f"OAuth initiation error: {str(e)}")
        # Show the setup page with the current redirect URI
        redirect_uri = url_for('google_callback', _external=True, _scheme='https')
        return render_template('oauth_error.html', redirect_uri=redirect_uri)

@app.route('/auth/callback')
def google_callback():
    """Handle Google OAuth callback"""
    try:
        token = google.authorize_access_token()
        # Get user info from the token
        user_info = token.get('userinfo')
        if not user_info:
            # Fallback: make a request to userinfo endpoint
            resp = google.get('userinfo')
            user_info = resp.json()
        
        if user_info:
            # Check if user exists
            user = User.query.filter_by(google_id=user_info['sub']).first()
            
            if not user:
                # Create new user
                user = User(
                    google_id=user_info['sub'],
                    email=user_info['email'],
                    name=user_info['name'],
                    picture=user_info.get('picture')
                )
                db.session.add(user)
                db.session.commit()
                
                # TODO: Create Google Drive backup file
                # await create_drive_backup_file(user, token)
            
            # Store user in session
            session['user'] = user.to_dict()
            session['access_token'] = token['access_token']
            
            return redirect(url_for('dashboard'))
        else:
            return redirect(url_for('login', error='Failed to get user info'))
            
    except Exception as e:
        app.logger.error(f"OAuth callback error: {str(e)}")
        # If it's a redirect_uri_mismatch error, show helpful setup page
        if 'redirect_uri_mismatch' in str(e).lower():
            redirect_uri = url_for('google_callback', _external=True, _scheme='https')
            return render_template('oauth_error.html', redirect_uri=redirect_uri)
        return redirect(url_for('login', error='Authentication failed'))

@app.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/api/user')
@login_required
def get_user():
    """Get current user info"""
    return jsonify({'success': True, 'user': session['user']})

@app.route('/dashboard')
@login_required  
def dashboard():
    """Main dashboard page (protected)"""
    return render_template('dashboard.html', user=session['user'])

# Update the root route to redirect to login if not authenticated
@app.route('/')
def index():
    """Root route - redirect to dashboard if authenticated, otherwise login"""
    if 'user' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))