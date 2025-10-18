document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity="1";
    const booksView = document.getElementById('books-view');
    const searchInput = document.querySelector('.search-input');
    const viewButtons = document.querySelectorAll('.view-button');
    const pagination = document.getElementById('pagination');
    
    setTimeout(() => {document.body.classList.add('loaded');}, 100);
    const width = window.innerWidth;

    let currentPage = 1;
    let currentView = 'grid';
    let booksPerPage = 8;
    let totalBooks = 0;
    let currentSearchTerm = '';

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentView = button.dataset.view;
            booksView.className = currentView === 'grid' ? 'books-grid' : 'books-compact';
            fetchBooks(currentPage, currentSearchTerm);
        });
    });

    async function getDownloadUrl(identifier) {
        try {
            const response = await fetch(`https://archive.org/metadata/${identifier}`);
            const data = await response.json();

            // Look for PDF files in the files array
            const pdfFile = data.files.find(file =>
                file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().includes('_text')
            );

            return pdfFile ? `https://archive.org/download/${identifier}/${pdfFile.name}` : null;
        } catch (error) {
            console.error("Error fetching metadata:", error);
            return null;
        }
    }

    async function fetchBooks(page, searchTerm = '') {
        try {
            booksView.innerHTML = '<div class="loading">Loading books...</div>';

            const searchQuery = searchTerm ?
                `title:(${searchTerm}) OR creator:(${searchTerm})` :
                'collection:internetarchivebooks';

            const response = await fetch(
                `https://archive.org/advancedsearch.php?q=${searchQuery}&fl[]=identifier,title,date,description,creator,collection,language&rows=${booksPerPage}&page=${page}&output=json`
            );
            const data = await response.json();
            totalBooks = data.response.numFound;
            renderBooks(data.response.docs);
            renderPagination();
        } catch (error) {
            console.error("Error fetching books:", error);
            booksView.innerHTML = "<div class='loading'>Failed to load books.</div>";
        }
    }

    function renderBooks(books) {
        booksView.innerHTML = books.map(book =>
            currentView === 'grid' ? renderGridCard(book) : renderCompactCard(book)
        ).join('');
    }

    function renderGridCard(book) {
        return `
            <div class="book-card-square">
                <div class="book-image-square">
                    <img src="https://archive.org/services/img/${book.identifier}" 
                         alt="${book.title || 'Book cover'}"
                         onerror="this.src='/api/placeholder/300/300'">
                </div>
                <div class="book-content">
                    <h2 class="book-title">${book.title || 'Untitled'}</h2>
                    
                    <div class="book-metadata">
                        <span>${book.creator || 'Unknown Author'}</span>
                        <span>${book.date || 'Unknown date'}</span>
                    </div>

                    <p class="book-description">${book.description || 'No description available.'}</p>

                    <div class="book-tags">
                        ${(book.collection || []).slice(0, 3).map(tag => `
                            <span class="tag">${tag}</span>
                        `).join('')}
                    </div>
                    <div class="book-actions">
                        <button class="action-button" onclick="window.open('https://archive.org/details/${book.identifier}', '_blank')">
                            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                        </button>
                        <button class="action-button" onclick="downloadBook('${book.identifier}')">
                            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderCompactCard(book) {
        return `
            <div class="book-card-compact">
                <div class="book-image-compact">
                    <img src="https://archive.org/services/img/${book.identifier}" 
                         alt="${book.title || 'Book cover'}"
                         onerror="this.src='/api/placeholder/60/60'">
                </div>
                <div class="book-content-compact">
                    <h2 class="book-title book-title-compact">${book.title || 'Untitled'}</h2>
                    <div class="book-metadata book-metadata-compact">
                        <span>${book.creator || 'Unknown Author'}</span>
                        <span>${book.date || 'Unknown date'}</span>
                    </div>
                </div>
                <div class="book-actions book-actions-compact">
                    <button class="action-button action-button-compact" onclick="window.open('https://archive.org/details/${book.identifier}', '_blank')">View</button>
                    <button class="action-button action-button-compact" onclick="downloadBook('${book.identifier}')">Download</button>
                </div>
            </div>
        `;
    }

    function renderPagination() {
        const totalPages = Math.ceil(totalBooks / booksPerPage);
        let paginationHTML = '';

        paginationHTML += `
            <button class="page-button" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="changePage(${currentPage - 1})">
                <h3>Previous</h2>
            </button>
        `;

        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            paginationHTML += `
                <button class="page-button ${i === currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
            <button class="page-button" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="changePage(${currentPage + 1})">
                <h3>Next</h3>
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    window.changePage = (page) => {
        if (page >= 1) {
            currentPage = page;
            fetchBooks(currentPage, currentSearchTerm);
        }
    };

    window.downloadBook = async (identifier) => {
        const buttons = document.querySelectorAll(`button[onclick="downloadBook('${identifier}')"]`);
        buttons.forEach(button => {
            button.disabled = true;
            button.innerHTML = 'Loading...';
        });

        try {
            const downloadUrl = await getDownloadUrl(identifier);
            if (downloadUrl) {
                window.open(downloadUrl, '_blank');
            } else {
                alert('PDF download is not available for this book.');
            }
        } catch (error) {
            alert('Error getting download link. Please try again.');
        } finally {
            buttons.forEach(button => {
                button.disabled = false;
                button.innerHTML = `
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                `;
            });
        }
    };

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearchTerm = e.target.value;
            currentPage = 1;
            fetchBooks(currentPage, currentSearchTerm);
        }, 500);
    });

    fetchBooks(currentPage, currentSearchTerm);


    if (width > 800) {
        const imgContainer = document.getElementById('img1');
        const maxTranslate = 30;
        const maxRotate = 25;
        document.addEventListener('mousemove', (e) => {
            const { innerWidth, innerHeight } = window;

            const xPercent = e.clientX / innerWidth;
            const yPercent = e.clientY / innerHeight;

            const translateX = (xPercent - 0.5) * 2 * maxTranslate;
            const translateY = (yPercent - 0.5) * 2 * maxTranslate;

            const rotateY = (xPercent - 0.5) * 2 * maxRotate;   
            const rotateX = -(yPercent - 0.5) * 2 * maxRotate;  

            imgContainer.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
            imgContainer.style.transform = `translate(${translateX}px, ${translateY}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        });
    }
});
