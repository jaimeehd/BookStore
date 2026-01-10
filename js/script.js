// Usamos un IIFE (Immediately Invoked Function Expression) para encapsular nuestro código.
(function() {
    
    // --- 1. Definiciones y Estado Global del Módulo ---
    const BASE_PATH = window.BASE_PATH || '';
    const PLACEHOLDER_IMAGE = `${BASE_PATH}/images/placeholder.jpg`;

    let books = []; 
    let lastScrollPosition = 0;
    let lastSelectedBookId = null;
     let isGridRendered = false; // NUEVO: Flag para saber si el grid ya fue renderizado

    // NUEVO: Función asíncrona para cargar los libros desde el archivo JSON.
    async function fetchBooks() {
        try {
            const response = await fetch(`${BASE_PATH}/books.json`);
            if (!response.ok) {
                throw new Error(`Error en la red: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('No se pudieron cargar los libros:', error);
            alert("Error: No se pudo cargar el archivo books.json. Asegúrese de estar usando un servidor local (como 'Live Server' en VS Code). Revise la consola para más detalles.");
            return [];
        }
    }

    // --- NUEVO: Sistema de Routing ---
    const router = {
        /**
         * Obtiene el ID del libro desde la URL hash
         * Formato esperado: #libro/123
         */
        getBookIdFromHash: () => {
            const hash = window.location.hash;
            const match = hash.match(/^#libro\/(\d+)$/);
            return match ? parseInt(match[1], 10) : null;
        },

        /**
         * Navega a la vista de detalle de un libro
         */
        navigateToBook: (bookId) => {
            window.location.hash = `#libro/${bookId}`;
        },

        /**
         * Navega a la vista de listado
         */
        navigateToHome: () => {
            window.location.hash = '';
        },

        /**
         * Obtiene la URL completa para compartir un libro
         */
        getShareableUrl: (bookId) => {
            const baseUrl = window.location.origin + window.location.pathname;
            return `${baseUrl}#libro/${bookId}`;
        }
    };

    // --- 2. Funciones Puras de Renderizado (Generadores de HTML) ---
    function generatePriceHTML(book) {
        const hasDiscount = book.discountPrice && book.discountPrice < book.price;
        const priceFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const originalPrice = priceFormatter.format(book.price);
        const currentPrice = hasDiscount ? priceFormatter.format(book.discountPrice) : originalPrice;
        return `<div class="price-container">${hasDiscount ? `<span class="price-original">${originalPrice}</span><span class="price-current">${currentPrice}</span>` : `<span class="price-current">${currentPrice}</span>`}${book.promoTag ? `<span class="promo-tag">${book.promoTag}</span>` : ''}</div>`;
    }
    
    function generateBookCardHTML(book) {
        const imageSrc = book.imageFile ? `${BASE_PATH}/images/${book.imageFile}` : PLACEHOLDER_IMAGE;
        const statusClass = book.status === 'available' ? 'status-badge--available' : 'status-badge--sold';
        const statusText = book.status === 'available' ? 'Disponible' : 'Agotado';
        return `<article class="book-card" data-book-id="${book.id}"><div class="book-card__image-container"><img src="${imageSrc}" alt="Portada de ${book.title}" class="book-card__image" onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';"><div class="status-badge ${statusClass}">${statusText}</div></div><div class="book-card__content"><h4 class="book-card__title">${book.title}</h4><p class="book-card__meta"><strong>Autor:</strong> ${book.author}</p><p class="book-card__meta"><strong>Género:</strong> ${book.genre}</p><p class="book-card__meta"><strong>Estado:</strong> ${book.condition}</p><div class="book-card__price">${generatePriceHTML(book)}</div></div></article>`;
    }
    
    function generateBookDetailHTML(book) {
        const statusClass = book.status === 'available' ? 'status-badge--available' : 'status-badge--sold';
        const statusText = book.status === 'available' ? 'Disponible' : 'Vendido';
        const imageSrc = book.imageFile ? `${BASE_PATH}/images/${book.imageFile}` : PLACEHOLDER_IMAGE;
        
        // NUEVO: Agregamos el botón de compartir
        return `<img src="${imageSrc}" alt="Portada de ${book.title}" class="book-detail__cover"><div class="book-detail__info"><h2 class="book-detail__title">${book.title}</h2><h3 class="book-detail__author">por ${book.author}</h3><ul class="book-detail__meta-list"><li><strong>ISBN:</strong> ${book.isbn}</li><li><strong>Colección:</strong> ${book.collection}</li><li><strong>Género:</strong> ${book.genre}</li><li><strong>Estado:</strong> ${book.condition}</li></ul><p class="book-detail__description">${book.description}</p><div class="book-detail__footer"><div class="book-detail__price">${generatePriceHTML(book)}</div><div class="book-detail__actions"><span class="status-badge ${statusClass}">${statusText}</span><button class="share-button" data-book-id="${book.id}" title="Copiar enlace para compartir">📋 Compartir</button></div></div></div>`;
    }
    
    // --- 3. Punto de Entrada Principal de la Aplicación ---
    document.addEventListener('DOMContentLoaded', () => {
        async function main() {
            books = await fetchBooks();

            // --- 3.1. Referencias al DOM ---
            const bookGrid = document.getElementById('book-grid');
            const bookListingView = document.getElementById('book-listing');
            const bookDetailView = document.getElementById('book-detail-view');
            const bookDetailContent = document.getElementById('book-detail-content');
            const backButton = bookDetailView.querySelector('.back-button');
            const imageModal = document.getElementById('image-modal');
            const modalImage = imageModal.querySelector('.modal-image');
            const modalCloseButton = imageModal.querySelector('.modal-close');
            const searchContainer = document.getElementById('search-container');
            const searchInput = document.getElementById('search-input');
            const searchForm = document.getElementById('search-form');
            const clearSearchBtn = document.getElementById('clear-search-btn');

            // Verificación de robustez
            if (!bookGrid || !bookListingView || !bookDetailView || !bookDetailContent || !backButton || !imageModal) {
                console.error("Error de inicialización: Faltan elementos esenciales en el DOM.");
                return;
            }
            
            if (books.length === 0) {
                bookGrid.innerHTML = `<p class="no-results-message">No se pudieron cargar los libros. Intente recargar la página.</p>`;
                return;
            }
            
            function renderGrid(searchTerm = '') {
                const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
                
                const filteredBooks = books.filter(book => {
                    return (
                        book.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                        book.author.toLowerCase().includes(lowerCaseSearchTerm) ||
                        book.genre.toLowerCase().includes(lowerCaseSearchTerm)
                    );
                });

                if (filteredBooks.length > 0) {
                    bookGrid.innerHTML = filteredBooks.map(generateBookCardHTML).join('');
                } else {
                    bookGrid.innerHTML = `<p class="no-results-message">No se encontraron libros para tu búsqueda.</p>`;
                }

                isGridRendered = true; // Marcamos que el grid ya fue renderizado
            }

            // --- 3.2. Gestores (Managers) de Lógica ---
            const modalManager = {
                open: (imageSrc) => {
                    modalImage.src = imageSrc;
                    imageModal.classList.add('visible');
                    document.body.classList.add('no-scroll');
                },
                close: () => {
                    imageModal.classList.remove('visible');
                    document.body.classList.remove('no-scroll');
                }
            };

            const viewManager = {
                showGridView: () => {
                    // Si el grid está vacío, renderizarlo primero
                    if (!isGridRendered) {
                        renderGrid();
                    }
                    

                    bookListingView.classList.remove('hidden');
                    bookDetailView.classList.add('hidden');
                    requestAnimationFrame(() => {
                        window.scrollTo(0, lastScrollPosition);
                        if (lastSelectedBookId) {
                            const currentlySelected = bookGrid.querySelector('.book-card--selected');
                            if (currentlySelected) currentlySelected.classList.remove('book-card--selected');
                            const lastCard = bookGrid.querySelector(`[data-book-id="${lastSelectedBookId}"]`);
                            if (lastCard) lastCard.classList.add('book-card--selected');
                        }
                    });
                },
                showDetailView: (bookId) => {
                    const book = books.find(b => b.id === bookId);
                    if (book) {
                        bookDetailContent.innerHTML = generateBookDetailHTML(book);
                        bookListingView.classList.add('hidden');
                        bookDetailView.classList.remove('hidden');
                        window.scrollTo(0, 0);
                    } else {
                        // Si el libro no existe, redirigir al home
                        router.navigateToHome();
                    }
                }
            };

            // --- NUEVO: Función para copiar el enlace al portapapeles ---
            function copyShareLink(bookId) {
                const shareUrl = router.getShareableUrl(bookId);
                
                // Usamos la API del portapapeles moderna
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareUrl)
                        .then(() => {
                            showNotification('¡Enlace copiado al portapapeles!');
                        })
                        .catch(err => {
                            console.error('Error al copiar:', err);
                            fallbackCopyToClipboard(shareUrl);
                        });
                } else {
                    // Fallback para navegadores antiguos
                    fallbackCopyToClipboard(shareUrl);
                }
            }

            // Fallback para copiar en navegadores que no soportan la API moderna
            function fallbackCopyToClipboard(text) {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    showNotification('¡Enlace copiado al portapapeles!');
                } catch (err) {
                    showNotification('No se pudo copiar. URL: ' + text, true);
                }
                
                document.body.removeChild(textArea);
            }

            // Función para mostrar notificaciones temporales
            function showNotification(message, isError = false) {
                const notification = document.createElement('div');
                notification.className = `notification ${isError ? 'notification--error' : 'notification--success'}`;
                notification.textContent = message;
                document.body.appendChild(notification);
                
                // Animación de entrada
                setTimeout(() => notification.classList.add('visible'), 10);
                
                // Remover después de 3 segundos
                setTimeout(() => {
                    notification.classList.remove('visible');
                    setTimeout(() => document.body.removeChild(notification), 300);
                }, 3000);
            }

            // --- 3.3. Asignación de Event Listeners ---
            
            // Navegación principal
            bookGrid.addEventListener('click', (event) => {
                const card = event.target.closest('.book-card');
                if (card && card.dataset.bookId) {
                    const bookId = parseInt(card.dataset.bookId, 10);
                    lastScrollPosition = window.scrollY;
                    lastSelectedBookId = bookId;
                    router.navigateToBook(bookId);
                }
            });

            backButton.addEventListener('click', () => {
                router.navigateToHome();
            });

            // NUEVO: Event listener para el botón de compartir
            bookDetailContent.addEventListener('click', (event) => {
                // Lógica del modal (existente)
                if (event.target.classList.contains('book-detail__cover')) {
                    modalManager.open(event.target.src);
                }
                
                // NUEVO: Lógica del botón compartir
                if (event.target.classList.contains('share-button')) {
                    const bookId = parseInt(event.target.dataset.bookId, 10);
                    copyShareLink(bookId);
                }
            });

            // Lógica del modal
            modalCloseButton.addEventListener('click', modalManager.close);
            imageModal.addEventListener('click', (event) => {
                if (event.target === imageModal) {
                    modalManager.close();
                }
            });
            window.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && imageModal.classList.contains('visible')) {
                    modalManager.close();
                }
            });
            
            // Búsqueda
            searchForm.addEventListener('submit', (e) => e.preventDefault());

            searchInput.addEventListener('input', (event) => {
                const searchTerm = event.target.value;
                renderGrid(searchTerm);
                    
                if (searchTerm.length > 0) {
                    searchContainer.classList.add('has-text');
                } else {
                    searchContainer.classList.remove('has-text');
                }
            });

            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                const inputEvent = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(inputEvent);
                searchInput.focus();
            });

            // --- NUEVO: Event listener para cambios en el hash ---
            window.addEventListener('hashchange', () => {
                const bookId = router.getBookIdFromHash();
                
                if (bookId) {
                    viewManager.showDetailView(bookId);
                } else {
                    viewManager.showGridView();
                }
            });

            // --- NUEVO: Procesamiento inicial de la URL ---
            const initialBookId = router.getBookIdFromHash();
            
            if (initialBookId) {
                // Si hay un libro en la URL, mostrarlo directamente
                viewManager.showDetailView(initialBookId);
            } else {
                // Renderizado normal del grid
                renderGrid();
            }
        }
        
        // Ejecutamos la función principal de nuestra aplicación.
        main();
    });
})();