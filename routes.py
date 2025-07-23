from flask import render_template, request, jsonify, make_response, session
from app import app, db
from models import Expense, User
from auth_routes import login_required
from datetime import datetime, date
from sqlalchemy import func, extract
import csv
import io
from decimal import Decimal

# Categories with emoji icons
CATEGORIES = {
    'Food': '🍔',
    'Transport': '🚗',
    'Housing': '🏠',
    'Education': '📚',
    'Healthcare': '🏥',
    'Entertainment': '🎬',
    'Shopping': '🛒',
    'Utilities': '💡',
    'Travel': '✈️',
    'AYS': '🎯',  # Add Your Spending category
    'Other': '📝'
}

# Remove the index route as it's now handled in auth_routes.py

@app.route('/api/health')
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'message': 'Expense Tracker API is running'})

@app.route('/api/expenses', methods=['GET'])
@login_required
def get_expenses():
    """Get expenses with optional month/year filtering."""
    try:
        user_id = session['user']['id']
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        
        query = Expense.query.filter_by(user_id=user_id)
        
        if month and year:
            query = query.filter(
                extract('month', Expense.date) == month,
                extract('year', Expense.date) == year
            )
        
        expenses = query.order_by(Expense.date.desc(), Expense.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'expenses': [expense.to_dict() for expense in expenses]
        })
    except Exception as e:
        app.logger.error(f"Error fetching expenses: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/expenses', methods=['POST'])
@login_required
def add_expense():
    """Add a new expense."""
    try:
        user_id = session['user']['id']
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        amount = data.get('amount')
        category = data.get('category')
        note = data.get('note', '').strip()
        expense_date = data.get('date')
        
        # Validation
        if not amount or amount <= 0:
            return jsonify({'success': False, 'error': 'Amount must be positive'}), 400
        
        if not category:
            return jsonify({'success': False, 'error': 'Category is required'}), 400
        
        if len(note) > 500:
            return jsonify({'success': False, 'error': 'Note too long (max 500 characters)'}), 400
        
        # Parse date
        try:
            if expense_date:
                parsed_date = datetime.strptime(expense_date, '%Y-%m-%d').date()
            else:
                parsed_date = date.today()
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format'}), 400
        
        # Create expense
        expense = Expense(
            user_id=user_id,
            amount=Decimal(str(amount)),
            category=category,
            note=note if note else None,
            date=parsed_date
        )
        
        db.session.add(expense)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'expense': expense.to_dict(),
            'message': 'Expense added successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error adding expense: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    """Delete an expense."""
    try:
        user_id = session['user']['id']
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first_or_404()
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Expense deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting expense: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/summary/<int:year>/<int:month>')
@login_required
def get_monthly_summary(year, month):
    """Get monthly summary for a specific month."""
    try:
        user_id = session['user']['id']
        expenses = Expense.query.filter(
            Expense.user_id == user_id,
            extract('month', Expense.date) == month,
            extract('year', Expense.date) == year
        ).all()
        
        total_amount = sum(float(expense.amount) for expense in expenses)
        expense_count = len(expenses)
        
        # Category breakdown
        category_breakdown = {}
        for expense in expenses:
            if expense.category in category_breakdown:
                category_breakdown[expense.category] += float(expense.amount)
            else:
                category_breakdown[expense.category] = float(expense.amount)
        
        return jsonify({
            'success': True,
            'summary': {
                'year': year,
                'month': month,
                'total_amount': total_amount,
                'expense_count': expense_count,
                'category_breakdown': category_breakdown
            }
        })
        
    except Exception as e:
        app.logger.error(f"Error fetching summary: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export/<int:year>/<int:month>')
@login_required
def export_csv(year, month):
    """Export expenses for a month as CSV."""
    try:
        user_id = session['user']['id']
        expenses = Expense.query.filter(
            Expense.user_id == user_id,
            extract('month', Expense.date) == month,
            extract('year', Expense.date) == year
        ).order_by(Expense.date.desc()).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Date', 'Category', 'Amount (₹)', 'Note'])
        
        # Write data
        for expense in expenses:
            writer.writerow([
                expense.date.strftime('%Y-%m-%d'),
                expense.category,
                float(expense.amount),
                expense.note or ''
            ])
        
        # Create response
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=expenses_{year}_{month:02d}.csv'
        
        return response
        
    except Exception as e:
        app.logger.error(f"Error exporting CSV: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/insights/<int:year>/<int:month>')
@login_required
def get_insights(year, month):
    """Get spending insights by comparing with previous month."""
    try:
        user_id = session['user']['id']
        # Current month
        current_expenses = Expense.query.filter(
            Expense.user_id == user_id,
            extract('month', Expense.date) == month,
            extract('year', Expense.date) == year
        ).all()
        
        # Previous month
        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1
        
        prev_expenses = Expense.query.filter(
            Expense.user_id == user_id,
            extract('month', Expense.date) == prev_month,
            extract('year', Expense.date) == prev_year
        ).all()
        
        # Calculate totals and category breakdowns
        current_total = sum(float(e.amount) for e in current_expenses)
        prev_total = sum(float(e.amount) for e in prev_expenses)
        
        current_categories = {}
        prev_categories = {}
        
        for expense in current_expenses:
            current_categories[expense.category] = current_categories.get(expense.category, 0) + float(expense.amount)
        
        for expense in prev_expenses:
            prev_categories[expense.category] = prev_categories.get(expense.category, 0) + float(expense.amount)
        
        insights = []
        
        # Overall spending comparison
        if prev_total > 0:
            change_percent = ((current_total - prev_total) / prev_total) * 100
            if abs(change_percent) > 10:  # Only show significant changes
                direction = "more" if change_percent > 0 else "less"
                insights.append(f"You spent {abs(change_percent):.0f}% {direction} this month (₹{current_total:.0f} vs ₹{prev_total:.0f})")
        
        # Category-wise insights
        for category in current_categories:
            current_amt = current_categories[category]
            prev_amt = prev_categories.get(category, 0)
            
            if prev_amt > 0:
                change_percent = ((current_amt - prev_amt) / prev_amt) * 100
                if abs(change_percent) > 20:  # Show significant category changes
                    direction = "more" if change_percent > 0 else "less"
                    insights.append(f"You spent {abs(change_percent):.0f}% {direction} on {category} this month")
        
        return jsonify({
            'success': True,
            'insights': insights[:3]  # Limit to top 3 insights
        })
        
    except Exception as e:
        app.logger.error(f"Error generating insights: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
