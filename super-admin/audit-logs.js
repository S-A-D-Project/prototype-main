// Audit Logs Management for Super Admin
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date inputs with default values
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('startDate').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];

    // Load initial logs
    loadLogs();

    // Event Listeners
    document.getElementById('applyFilters').addEventListener('click', loadLogs);
    document.getElementById('exportLogs').addEventListener('click', exportLogs);
    document.getElementById('clearLogs').addEventListener('click', clearLogs);
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
    document.getElementById('closeDetails').addEventListener('click', hideLogDetails);

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadLogs, 500);
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});

let currentPage = 1;
const logsPerPage = 20;

async function loadLogs() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const actionType = document.getElementById('actionType').value;
    const userType = document.getElementById('userType').value;
    const searchQuery = document.querySelector('.search-box input').value;

    try {
        // In a real application, this would be an API call
        const response = await fetch('/api/audit-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                startDate,
                endDate,
                actionType,
                userType,
                searchQuery,
                page: currentPage,
                limit: logsPerPage
            })
        });

        const data = await response.json();
        displayLogs(data.logs);
        updatePagination(data.total);
    } catch (error) {
        console.error('Error loading logs:', error);
        // For demo purposes, show sample data
        displaySampleLogs();
    }
}

function displayLogs(logs) {
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '';

    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(log.timestamp)}</td>
            <td>${log.user}</td>
            <td><span class="user-type-badge ${log.userType.toLowerCase()}">${log.userType}</span></td>
            <td><span class="action-badge ${log.action.toLowerCase()}">${log.action}</span></td>
            <td>${log.module}</td>
            <td>${log.details}</td>
            <td>${log.ipAddress}</td>
            <td><span class="status-badge ${log.status.toLowerCase()}">${log.status}</span></td>
            <td class="actions">
                <button class="action-btn view-btn" title="View Details" onclick="viewLogDetails('${log.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn export-btn" title="Export" onclick="exportLog('${log.id}')">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displaySampleLogs() {
    const sampleLogs = [
        {
            id: 'LOG-001',
            timestamp: new Date(),
            user: 'System Administrator',
            userType: 'Super Admin',
            action: 'Login',
            module: 'Authentication',
            details: 'Successful login',
            ipAddress: '192.168.1.1',
            status: 'Success'
        },
        {
            id: 'LOG-002',
            timestamp: new Date(Date.now() - 3600000),
            user: 'Sub Admin',
            userType: 'Sub Admin',
            action: 'Create',
            module: 'User Management',
            details: 'Created new user account',
            ipAddress: '192.168.1.2',
            status: 'Success'
        }
    ];
    displayLogs(sampleLogs);
}

async function viewLogDetails(logId) {
    try {
        const response = await fetch(`/api/audit-logs/${logId}`);
        const log = await response.json();
        
        // Populate modal with log details
        document.getElementById('detailTimestamp').textContent = formatDate(log.timestamp);
        document.getElementById('detailUser').textContent = log.user;
        document.getElementById('detailUserType').textContent = log.userType;
        document.getElementById('detailAction').textContent = log.action;
        document.getElementById('detailModule').textContent = log.module;
        document.getElementById('detailDetails').textContent = log.details;
        document.getElementById('detailIP').textContent = log.ipAddress;
        document.getElementById('detailStatus').textContent = log.status;
        document.getElementById('detailAdditionalData').textContent = JSON.stringify(log.additionalData, null, 2);

        // Show modal
        document.getElementById('logDetailsModal').style.display = 'block';
    } catch (error) {
        console.error('Error viewing log details:', error);
        showNotification('Failed to load log details', 'error');
    }
}

function hideLogDetails() {
    document.getElementById('logDetailsModal').style.display = 'none';
}

async function exportLogs() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const actionType = document.getElementById('actionType').value;
    const userType = document.getElementById('userType').value;

    try {
        const response = await fetch('/api/audit-logs/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                startDate,
                endDate,
                actionType,
                userType
            })
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting logs:', error);
        showNotification('Failed to export logs', 'error');
    }
}

async function exportLog(logId) {
    try {
        const response = await fetch(`/api/audit-logs/${logId}/export`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${logId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting log:', error);
        showNotification('Failed to export log', 'error');
    }
}

async function clearLogs() {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
        try {
            const response = await fetch('/api/audit-logs/clear', {
                method: 'POST'
            });

            if (response.ok) {
                loadLogs();
                showNotification('Logs cleared successfully', 'success');
            } else {
                throw new Error('Failed to clear logs');
            }
        } catch (error) {
            console.error('Error clearing logs:', error);
            showNotification('Failed to clear logs', 'error');
        }
    }
}

function updatePagination(total) {
    const totalPages = Math.ceil(total / logsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function changePage(delta) {
    currentPage += delta;
    loadLogs();
}

function formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function showNotification(message, type) {
    // Implement notification system
    console.log(`${type}: ${message}`);
} 