// Global variables
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let categoryChart = null;
let expenses = [];
let currentChartType = 'pie';

// Categories with emojis
const CATEGORIES = {
    'Food': '🍔',
    'Transport': '🚗',
    'Housing': '🏠',
    'Education': '📚',
    'Healthcare': '🏥',
    'Entertainment': '🎬',
    'Shopping': '🛒',
    'Utilities': '💡',
    'Travel': '✈️',
    'Other': '📝'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    bindEventListeners();
    loadCurrentMonthData();
});

function initializeApp() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // Update month display
    updateMonthDisplay();
    
    // Initialize note counter
    updateNoteCounter();
}

function bindEventListeners() {
    // Month navigation
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));
    
    // Add expense form
    document.getElementById('addExpenseForm').addEventListener('submit', handleAddExpense);
    
    // Note counter
    document.getElementById('note').addEventListener('input', updateNoteCounter);
    
    // Custom category handling
    document.getElementById('category').addEventListener('change', handleCategoryChange);
    
    // Chart type buttons
    document.getElementById('pieChartBtn').addEventListener('click', () => switchChartType('pie'));
    document.getElementById('barChartBtn').addEventListener('click', () => switchChartType('bar'));
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', loadCurrentMonthData);
    
    // Delete modal
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    
    // Form validation
    const form = document.getElementById('addExpenseForm');
    form.addEventListener('input', validateForm);
}

function navigateMonth(direction) {
    currentMonth += direction;
    
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    
    updateMonthDisplay();
    loadCurrentMonthData();
}

function updateMonthDisplay() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentMonth - 1]} ${currentYear}`;
}

function updateNoteCounter() {
    const note = document.getElementById('note');
    const counter = document.getElementById('noteCounter');
    counter.textContent = note.value.length;
    
    if (note.value.length > 450) {
        counter.style.color = '#dc3545';
    } else if (note.value.length > 400) {
        counter.style.color = '#ffc107';
    } else {
        counter.style.color = '#6c757d';
    }
}

function handleCategoryChange() {
    const categorySelect = document.getElementById('category');
    const customContainer = document.getElementById('customCategoryContainer');
    
    if (categorySelect.value === 'custom') {
        customContainer.style.display = 'block';
        document.getElementById('customCategory').required = true;
    } else {
        customContainer.style.display = 'none';
        document.getElementById('customCategory').required = false;
        document.getElementById('customCategory').value = '';
    }
}

async function loadCurrentMonthData() {
    showLoading(true);
    
    try {
        // Load expenses for current month
        await loadExpenses();
        
        // Load summary for current and previous month
        await loadMonthlySummary();
        
        // Load insights
        await loadInsights();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('Error loading data. Please try again.', 'danger');
    } finally {
        showLoading(false);
    }
}

async function loadExpenses() {
    const response = await fetch(`/api/expenses?month=${currentMonth}&year=${currentYear}`);
    const data = await response.json();
    
    if (data.success) {
        expenses = data.expenses;
        displayExpenses();
        updateChart();
    } else {
        throw new Error(data.error);
    }
}

async function loadMonthlySummary() {
    // Current month
    const currentResponse = await fetch(`/api/summary/${currentYear}/${currentMonth}`);
    const currentData = await currentResponse.json();
    
    // Previous month
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 1) {
        prevMonth = 12;
        prevYear--;
    }
    
    const prevResponse = await fetch(`/api/summary/${prevYear}/${prevMonth}`);
    const prevData = await prevResponse.json();
    
    if (currentData.success) {
        updateDashboard('current', currentData.summary);
    }
    
    if (prevData.success) {
        updateDashboard('last', prevData.summary);
    }
}

async function loadInsights() {
    try {
        const response = await fetch(`/api/insights/${currentYear}/${currentMonth}`);
        const data = await response.json();
        
        if (data.success && data.insights.length > 0) {
            displayInsights(data.insights);
        } else {
            hideInsights();
        }
    } catch (error) {
        console.error('Error loading insights:', error);
        hideInsights();
    }
}

function updateDashboard(period, summary) {
    const amountElement = document.getElementById(`${period}MonthAmount`);
    const countElement = document.getElementById(`${period}MonthCount`);
    
    amountElement.textContent = formatCurrency(summary.total_amount);
    countElement.textContent = `${summary.expense_count} expense${summary.expense_count !== 1 ? 's' : ''}`;
}

function displayInsights(insights) {
    const container = document.getElementById('insightsContainer');
    const list = document.getElementById('insightsList');
    
    list.innerHTML = '';
    insights.forEach(insight => {
        const li = document.createElement('li');
        li.textContent = insight;
        list.appendChild(li);
    });
    
    container.style.display = 'block';
    container.classList.add('fade-in');
}

function hideInsights() {
    const container = document.getElementById('insightsContainer');
    container.style.display = 'none';
}

function displayExpenses() {
    const container = document.getElementById('expensesList');
    
    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-receipt fa-3x mb-3"></i>
                <p>No expenses found for this month</p>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addExpenseModal">
                    Add Your First Expense
                </button>
            </div>
        `;
        return;
    }
    
    // Group expenses by category
    const expensesByCategory = {};
    expenses.forEach(expense => {
        if (!expensesByCategory[expense.category]) {
            expensesByCategory[expense.category] = [];
        }
        expensesByCategory[expense.category].push(expense);
    });
    
    let html = '';
    
    Object.keys(expensesByCategory).forEach(category => {
        const categoryExpenses = expensesByCategory[category];
        const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const emoji = CATEGORIES[category] || '📝';
        
        html += `
            <div class="expense-category">
                <div class="category-header" data-bs-toggle="collapse" data-bs-target="#category-${category}" aria-expanded="false">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="category-title">
                            <span class="me-2">${emoji}</span>
                            ${category}
                            <small class="text-muted ms-2">(${categoryExpenses.length})</small>
                        </span>
                        <div class="d-flex align-items-center">
                            <span class="category-total me-2">₹${formatCurrency(categoryTotal)}</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>
                </div>
                <div class="collapse category-expenses" id="category-${category}">
                    ${categoryExpenses.map(expense => `
                        <div class="expense-item">
                            <div class="expense-details">
                                <div class="expense-amount">₹${formatCurrency(expense.amount)}</div>
                                ${expense.note ? `<div class="expense-note">${escapeHtml(expense.note)}</div>` : ''}
                                <div class="expense-date">${formatDate(expense.date)}</div>
                            </div>
                            <div class="expense-actions">
                                <button class="delete-btn" onclick="showDeleteModal(${expense.id}, '${escapeHtml(expense.note || category)}', ${expense.amount})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    container.classList.add('fade-in');
}

function updateChart() {
    const canvas = document.getElementById('categoryChart');
    const noDataDiv = document.getElementById('noChartData');
    
    if (expenses.length === 0) {
        canvas.style.display = 'none';
        noDataDiv.style.display = 'block';
        if (categoryChart) {
            categoryChart.destroy();
            categoryChart = null;
        }
        return;
    }
    
    canvas.style.display = 'block';
    noDataDiv.style.display = 'none';
    
    // Calculate category totals
    const categoryTotals = {};
    expenses.forEach(expense => {
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
        } else {
            categoryTotals[expense.category] = expense.amount;
        }
    });
    
    const labels = Object.keys(categoryTotals).map(cat => `${CATEGORIES[cat] || '📝'} ${cat}`);
    const data = Object.values(categoryTotals);
    const colors = generateColors(labels.length);
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    const chartConfig = {
        type: currentChartType,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.8', '1')),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: currentChartType === 'pie' ? 'bottom' : 'top',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed || context.parsed.y;
                            return `₹${formatCurrency(value)}`;
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    };
    
    if (currentChartType === 'bar') {
        chartConfig.options.scales = {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '₹' + formatCurrency(value);
                    }
                }
            }
        };
    }
    
    categoryChart = new Chart(ctx, chartConfig);
}

function switchChartType(type) {
    currentChartType = type;
    
    // Update button states
    document.getElementById('pieChartBtn').classList.toggle('active', type === 'pie');
    document.getElementById('barChartBtn').classList.toggle('active', type === 'bar');
    
    // Update chart
    updateChart();
}

async function handleAddExpense(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const formData = new FormData(e.target);
    let category = formData.get('category');
    
    // Handle custom category
    if (category === 'custom') {
        const customCategory = document.getElementById('customCategory').value.trim();
        if (!customCategory) {
            showAlert('Please enter a custom category name', 'danger');
            return;
        }
        category = customCategory;
        
        // Add to categories list for future use
        CATEGORIES[category] = '📝';
        
        // Add to select dropdown
        const categorySelect = document.getElementById('category');
        const newOption = document.createElement('option');
        newOption.value = category;
        newOption.textContent = `📝 ${category}`;
        categorySelect.insertBefore(newOption, categorySelect.querySelector('option[value="custom"]'));
    }
    
    const expenseData = {
        amount: parseFloat(formData.get('amount')),
        category: category,
        note: formData.get('note').trim(),
        date: formData.get('date')
    };
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
            modal.hide();
            
            // Reset form
            e.target.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            updateNoteCounter();
            handleCategoryChange(); // Hide custom category field
            
            // Show success message
            showAlert('Expense added successfully!', 'success');
            
            // Reload data
            await loadCurrentMonthData();
        } else {
            showAlert(data.error, 'danger');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showAlert('Error adding expense. Please try again.', 'danger');
    } finally {
        showLoading(false);
    }
}

function validateForm() {
    const form = document.getElementById('addExpenseForm');
    const amount = form.amount.value;
    const category = form.category.value;
    
    let isValid = true;
    
    // Reset validation states
    form.querySelectorAll('.form-control, .form-select').forEach(field => {
        field.classList.remove('is-invalid');
    });
    
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
        form.amount.classList.add('is-invalid');
        isValid = false;
    }
    
    // Validate category
    if (!category) {
        form.category.classList.add('is-invalid');
        isValid = false;
    }
    
    return isValid;
}

function showDeleteModal(expenseId, description, amount) {
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    const infoDiv = document.getElementById('deleteExpenseInfo');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    infoDiv.innerHTML = `
        <strong>Amount:</strong> ₹${formatCurrency(amount)}<br>
        <strong>Description:</strong> ${description}
    `;
    
    confirmBtn.onclick = () => deleteExpense(expenseId);
    modal.show();
}

async function deleteExpense(expenseId) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/expenses/${expenseId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            
            // Show success message
            showAlert('Expense deleted successfully!', 'success');
            
            // Reload data
            await loadCurrentMonthData();
        } else {
            showAlert(data.error, 'danger');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        showAlert('Error deleting expense. Please try again.', 'danger');
    } finally {
        showLoading(false);
    }
}

function confirmDelete() {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn.onclick) {
        confirmBtn.onclick();
    }
}

async function exportToCSV() {
    try {
        const response = await fetch(`/api/export/${currentYear}/${currentMonth}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expenses_${currentYear}_${currentMonth.toString().padStart(2, '0')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showAlert('Expenses exported successfully!', 'success');
        } else {
            throw new Error('Export failed');
        }
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showAlert('Error exporting expenses. Please try again.', 'danger');
    }
}

// Utility functions
function formatCurrency(amount) {
    return parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateColors(count) {
    const colors = [
        'rgba(255, 163, 97, 0.8)',   // Primary Orange
        'rgba(52, 152, 219, 0.8)',   // Blue
        'rgba(46, 204, 113, 0.8)',   // Green
        'rgba(155, 89, 182, 0.8)',   // Purple
        'rgba(231, 76, 60, 0.8)',    // Red
        'rgba(241, 196, 15, 0.8)',   // Yellow
        'rgba(230, 126, 34, 0.8)',   // Dark Orange
        'rgba(26, 188, 156, 0.8)',   // Teal
        'rgba(142, 68, 173, 0.8)',   // Dark Purple
        'rgba(192, 57, 43, 0.8)'     // Dark Red
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert-fixed');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show alert-fixed`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1050;
        min-width: 300px;
        max-width: 500px;
    `;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}
