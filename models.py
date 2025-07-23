from app import db
from datetime import datetime, timezone
from sqlalchemy import Index

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    picture = db.Column(db.String(500))
    drive_file_id = db.Column(db.String(100))  # Google Drive backup file ID
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationship with expenses
    expenses = db.relationship('Expense', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'picture': self.picture,
            'created_at': self.created_at.isoformat()
        }

class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    note = db.Column(db.String(500), nullable=True)
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Add indexes for better query performance
    __table_args__ = (
        Index('idx_expense_user_date', 'user_id', 'date'),
        Index('idx_expense_user_category', 'user_id', 'category'),
        Index('idx_expense_created_at', 'created_at'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'amount': float(self.amount),
            'category': self.category,
            'note': self.note,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Expense {self.id}: ₹{self.amount} - {self.category}>'
