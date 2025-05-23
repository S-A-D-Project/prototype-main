// Archives Management
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date input with today's date
    document.getElementById('archiveDate').value = new Date().toISOString().split('T')[0];

    // Load initial archives
    loadArchives();

    // Event Listeners
    document.getElementById('applyFilters').addEventListener('click', loadArchives);
    document.getElementById('archiveData').addEventListener('click', showArchiveModal);
    document.getElementById('cancelArchive').addEventListener('click', hideArchiveModal);
    document.getElementById('confirmArchive').addEventListener('click', processArchive);
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));

    // Category card click handlers
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            document.getElementById('archiveCategory').value = category;
            loadArchives();
        });
    });

    // Search functionality
    const searchInput = document.querySelector('.search-container input');
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadArchives, 500);
    });
});

let currentPage = 1;
const archivesPerPage = 10;

async function loadArchives() {
    const archiveDate = document.getElementById('archiveDate').value;
    const category = document.getElementById('archiveCategory').value;
    const searchQuery = document.querySelector('.search-container input').value;

    try {
        // In a real application, this would be an API call
        const response = await fetch('/api/archives', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                archiveDate,
                category,
                searchQuery,
                page: currentPage,
                limit: archivesPerPage
            })
        });

        const data = await response.json();
        displayArchives(data.archives);
        updatePagination(data.total);
        updateCategoryCounts(data.counts);
    } catch (error) {
        console.error('Error loading archives:', error);
        // For demo purposes, show sample data
        displaySampleArchives();
    }
}

function displayArchives(archives) {
    const tbody = document.getElementById('archivesTableBody');
    tbody.innerHTML = '';

    archives.forEach(archive => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${archive.id}</td>
            <td><span class="category-badge ${archive.category}">${archive.category}</span></td>
            <td>${formatDate(archive.dateArchived)}</td>
            <td>${archive.records}</td>
            <td>${formatSize(archive.size)}</td>
            <td><span class="status-badge ${archive.status.toLowerCase()}">${archive.status}</span></td>
            <td class="actions">
                <button class="action-btn view-btn" title="View" onclick="viewArchive('${archive.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn download-btn" title="Download" onclick="downloadArchive('${archive.id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete" onclick="deleteArchive('${archive.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displaySampleArchives() {
    const sampleArchives = [
        {
            id: 'ARCH-001',
            category: 'Orders',
            dateArchived: new Date(),
            records: 1234,
            size: 1024 * 1024 * 5, // 5MB
            status: 'Complete'
        },
        {
            id: 'ARCH-002',
            category: 'Products',
            dateArchived: new Date(Date.now() - 86400000),
            records: 567,
            size: 1024 * 1024 * 2, // 2MB
            status: 'Complete'
        }
    ];
    displayArchives(sampleArchives);
}

function updateCategoryCounts(counts) {
    Object.entries(counts).forEach(([category, count]) => {
        const card = document.querySelector(`.category-card[data-category="${category}"]`);
        if (card) {
            card.querySelector('.count').textContent = `${count} records`;
        }
    });
}

function updatePagination(total) {
    const totalPages = Math.ceil(total / archivesPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function changePage(delta) {
    currentPage += delta;
    loadArchives();
}

function showArchiveModal() {
    const modal = document.getElementById('archiveModal');
    modal.style.display = 'block';
}

function hideArchiveModal() {
    const modal = document.getElementById('archiveModal');
    modal.style.display = 'none';
}

async function processArchive() {
    const form = document.getElementById('archiveForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/archives/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            hideArchiveModal();
            loadArchives();
            showNotification('Archive created successfully', 'success');
        } else {
            throw new Error('Failed to create archive');
        }
    } catch (error) {
        console.error('Error creating archive:', error);
        showNotification('Failed to create archive', 'error');
    }
}

async function viewArchive(archiveId) {
    try {
        const response = await fetch(`/api/archives/${archiveId}`);
        const data = await response.json();
        // Implement view archive details logic
        console.log('View archive:', data);
    } catch (error) {
        console.error('Error viewing archive:', error);
        showNotification('Failed to view archive', 'error');
    }
}

async function downloadArchive(archiveId) {
    try {
        const response = await fetch(`/api/archives/${archiveId}/download`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `archive-${archiveId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading archive:', error);
        showNotification('Failed to download archive', 'error');
    }
}

async function deleteArchive(archiveId) {
    if (confirm('Are you sure you want to delete this archive?')) {
        try {
            const response = await fetch(`/api/archives/${archiveId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadArchives();
                showNotification('Archive deleted successfully', 'success');
            } else {
                throw new Error('Failed to delete archive');
            }
        } catch (error) {
            console.error('Error deleting archive:', error);
            showNotification('Failed to delete archive', 'error');
        }
    }
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