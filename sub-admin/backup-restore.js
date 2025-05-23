// Backup & Restore Management
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadBackupHistory();
    updateBackupStatus();

    // Event Listeners
    document.getElementById('createBackup').addEventListener('click', showBackupModal);
    document.getElementById('editSchedule').addEventListener('click', showScheduleModal);
    document.getElementById('cancelBackup').addEventListener('click', hideBackupModal);
    document.getElementById('confirmBackup').addEventListener('click', processBackup);
    document.getElementById('cancelSchedule').addEventListener('click', hideScheduleModal);
    document.getElementById('saveSchedule').addEventListener('click', saveSchedule);
    document.getElementById('exportHistory').addEventListener('click', exportBackupHistory);
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));

    // Backup type filter
    document.getElementById('backupType').addEventListener('change', loadBackupHistory);

    // Search functionality
    const searchInput = document.querySelector('.search-container input');
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadBackupHistory, 500);
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});

let currentPage = 1;
const backupsPerPage = 10;

async function loadBackupHistory() {
    const backupType = document.getElementById('backupType').value;
    const searchQuery = document.querySelector('.search-container input').value;

    try {
        // In a real application, this would be an API call
        const response = await fetch('/api/backups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                backupType,
                searchQuery,
                page: currentPage,
                limit: backupsPerPage
            })
        });

        const data = await response.json();
        displayBackups(data.backups);
        updatePagination(data.total);
    } catch (error) {
        console.error('Error loading backup history:', error);
        // For demo purposes, show sample data
        displaySampleBackups();
    }
}

function displayBackups(backups) {
    const tbody = document.getElementById('backupTableBody');
    tbody.innerHTML = '';

    backups.forEach(backup => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${backup.id}</td>
            <td>${formatDate(backup.dateTime)}</td>
            <td><span class="type-badge ${backup.type.toLowerCase()}">${backup.type}</span></td>
            <td>${formatSize(backup.size)}</td>
            <td><span class="status-badge ${backup.status.toLowerCase()}">${backup.status}</span></td>
            <td>${backup.location}</td>
            <td class="actions">
                <button class="action-btn view-btn" title="View Details" onclick="viewBackup('${backup.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn download-btn" title="Download" onclick="downloadBackup('${backup.id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="action-btn restore-btn" title="Restore" onclick="restoreBackup('${backup.id}')">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete" onclick="deleteBackup('${backup.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displaySampleBackups() {
    const sampleBackups = [
        {
            id: 'BK-001',
            dateTime: new Date(),
            type: 'Full',
            size: 1024 * 1024 * 500, // 500MB
            status: 'Complete',
            location: 'Local + Cloud'
        },
        {
            id: 'BK-002',
            dateTime: new Date(Date.now() - 86400000),
            type: 'Incremental',
            size: 1024 * 1024 * 50, // 50MB
            status: 'Complete',
            location: 'Local'
        }
    ];
    displayBackups(sampleBackups);
}

async function updateBackupStatus() {
    try {
        const response = await fetch('/api/backup-status');
        const data = await response.json();
        
        // Update status cards
        document.querySelector('.status-card:nth-child(1) p').textContent = data.lastBackup;
        document.querySelector('.status-card:nth-child(2) p').textContent = data.nextBackup;
        document.querySelector('.status-card:nth-child(3) p').textContent = data.storageUsed;
        document.querySelector('.status-card:nth-child(4) p').textContent = data.health;
    } catch (error) {
        console.error('Error updating backup status:', error);
    }
}

function showBackupModal() {
    const modal = document.getElementById('backupModal');
    modal.style.display = 'block';
}

function hideBackupModal() {
    const modal = document.getElementById('backupModal');
    modal.style.display = 'none';
}

function showScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    modal.style.display = 'block';
}

function hideScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    modal.style.display = 'none';
}

async function processBackup() {
    const form = document.getElementById('backupForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/backups/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            hideBackupModal();
            loadBackupHistory();
            updateBackupStatus();
            showNotification('Backup created successfully', 'success');
        } else {
            throw new Error('Failed to create backup');
        }
    } catch (error) {
        console.error('Error creating backup:', error);
        showNotification('Failed to create backup', 'error');
    }
}

async function saveSchedule() {
    const form = document.getElementById('scheduleForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/backup-schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            hideScheduleModal();
            updateBackupStatus();
            showNotification('Schedule updated successfully', 'success');
        } else {
            throw new Error('Failed to update schedule');
        }
    } catch (error) {
        console.error('Error updating schedule:', error);
        showNotification('Failed to update schedule', 'error');
    }
}

async function viewBackup(backupId) {
    try {
        const response = await fetch(`/api/backups/${backupId}`);
        const data = await response.json();
        // Implement view backup details logic
        console.log('View backup:', data);
    } catch (error) {
        console.error('Error viewing backup:', error);
        showNotification('Failed to view backup details', 'error');
    }
}

async function downloadBackup(backupId) {
    try {
        const response = await fetch(`/api/backups/${backupId}/download`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${backupId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading backup:', error);
        showNotification('Failed to download backup', 'error');
    }
}

async function restoreBackup(backupId) {
    if (confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
        try {
            const response = await fetch(`/api/backups/${backupId}/restore`, {
                method: 'POST'
            });

            if (response.ok) {
                showNotification('Backup restored successfully', 'success');
            } else {
                throw new Error('Failed to restore backup');
            }
        } catch (error) {
            console.error('Error restoring backup:', error);
            showNotification('Failed to restore backup', 'error');
        }
    }
}

async function deleteBackup(backupId) {
    if (confirm('Are you sure you want to delete this backup?')) {
        try {
            const response = await fetch(`/api/backups/${backupId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadBackupHistory();
                updateBackupStatus();
                showNotification('Backup deleted successfully', 'success');
            } else {
                throw new Error('Failed to delete backup');
            }
        } catch (error) {
            console.error('Error deleting backup:', error);
            showNotification('Failed to delete backup', 'error');
        }
    }
}

async function exportBackupHistory() {
    try {
        const response = await fetch('/api/backups/export-history');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting backup history:', error);
        showNotification('Failed to export backup history', 'error');
    }
}

function updatePagination(total) {
    const totalPages = Math.ceil(total / backupsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function changePage(delta) {
    currentPage += delta;
    loadBackupHistory();
}

function formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function showNotification(message, type) {
    // Implement notification system
    console.log(`${type}: ${message}`);
} 