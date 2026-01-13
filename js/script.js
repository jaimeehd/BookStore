// Usamos un IIFE (Immediately Invoked Function Expression) para encapsular nuestro código.
(function() {
    
    // --- 1. Definiciones y Estado Global del Módulo ---
    const BASE_PATH = window.BASE_PATH || '';
    const PLACEHOLDER_IMAGE = `${BASE_PATH}/images/placeholder.jpg`;

    let books = []; 
    let lastScrollPosition = 0;
    let lastSelectedBookId = null;
    let isGridRendered = false; // Flag para saber si el grid ya fue renderizado

    // Función asíncrona para cargar los libros desde el archivo JSON.
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

    // --- 2. Sistema de Routing ---
    const router = {
        getBookIdFromHash: () => {
            const hash = window.location.hash;
            const match = hash.match(/^#libro\/(\d+)$/);
            return match ? parseInt(match[1], 10) : null;
        },

        navigateToBook: (bookId) => {
            window.location.hash = `#libro/${bookId}`;
        },

        navigateToHome: () => {
            window.location.hash = '';
        },

        getShareableUrl: (bookId) => {
            const baseUrl = window.location.origin + window.location.pathname;
            return `${baseUrl}#libro/${bookId}`;
        }
    };

    // --- 3. Gestor de metadatos para redes sociales ---
    const metaManager = {
        setMetaTag(property, content) {
            let meta = document.querySelector(`meta[property="${property}"]`);
            if (!meta) {
                meta = document.querySelector(`meta[name="${property}"]`);
            }
            if (meta) {
                meta.setAttribute('content', content);
            }
        },
        
        updateBookMeta(book) {
            const shareUrl = router.getShareableUrl(book.id);
            const baseImageUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}${BASE_PATH}`;
            const imageSrc = book.imageFile 
                ? `${baseImageUrl}/images/${book.imageFile}`
                : `${baseImageUrl}/images/placeholder.jpg`;
            
            const priceFormatter = new Intl.NumberFormat('es-CO', { 
                style: 'currency', 
                currency: 'COP', 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });
            const price = book.discountPrice && book.discountPrice < book.price 
                ? priceFormatter.format(book.discountPrice) 
                : priceFormatter.format(book.price);
            
            const description = `${book.author} - ${book.genre}. ${book.condition}. Precio: ${price}. ${book.description.substring(0, 100)}...`;
            
            this.setMetaTag('og:title', `${book.title} - El Rincón del Lector`);
            this.setMetaTag('og:description', description);
            this.setMetaTag('og:url', shareUrl);
            this.setMetaTag('og:image', imageSrc);
            this.setMetaTag('twitter:title', book.title);
            this.setMetaTag('twitter:description', description);
            this.setMetaTag('twitter:image', imageSrc);
            
            document.title = `${book.title} - El Rincón del Lector`;
        },

        resetMeta() {
            const defaultUrl = window.location.origin + window.location.pathname;
            const baseImageUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}${BASE_PATH}`;
            const defaultImage = `${baseImageUrl}/images/photo-1507842217343-583bb7270b66.jpg`;
            
            this.setMetaTag('og:title', 'El Rincón del Lector - Libros de Segunda Mano');
            this.setMetaTag('og:description', 'Explora nuestra colección de tesoros literarios de segunda mano y encuentra tu próxima aventura.');
            this.setMetaTag('og:url', defaultUrl);
            this.setMetaTag('og:image', defaultImage);
            this.setMetaTag('twitter:title', 'El Rincón del Lector');
            this.setMetaTag('twitter:description', 'Libros de segunda mano con historias que merecen una segunda oportunidad');
            this.setMetaTag('twitter:image', defaultImage);
            
            document.title = 'Librería El Rincón del Lector';
        }
    };

    // --- 4. Funciones Puras de Renderizado ---
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
    /* 
    function generateBookDetailHTML(book) {
        const statusClass = book.status === 'available' ? 'status-badge--available' : 'status-badge--sold';
        const statusText = book.status === 'available' ? 'Disponible' : 'Vendido';
        const imageSrc = book.imageFile ? `${BASE_PATH}/images/${book.imageFile}` : PLACEHOLDER_IMAGE;
        
        return `<img src="${imageSrc}" alt="Portada de ${book.title}" class="book-detail__cover"><div class="book-detail__info"><h2 class="book-detail__title">${book.title}</h2><h3 class="book-detail__author">por ${book.author}</h3><ul class="book-detail__meta-list"><li><strong>ISBN:</strong> ${book.isbn}</li><li><strong>Colección:</strong> ${book.collection}</li><li><strong>Género:</strong> ${book.genre}</li><li><strong>Estado:</strong> ${book.condition}</li></ul><p class="book-detail__description">${book.description}</p><div class="book-detail__footer"><div class="book-detail__price">${generatePriceHTML(book)}</div><div class="book-detail__actions"><span class="status-badge ${statusClass}">${statusText}</span><div class="share-buttons"><button class="share-button share-button--copy" data-book-id="${book.id}" title="Copiar enlace para compartir">📋 Copiar Link</button><button class="share-button share-button--facebook" data-book-id="${book.id}" title="Compartir en Facebook">📘 Facebook</button></div></div></div></div>`;
    } */
    function generateBookDetailHTML(book) {
        const statusClass = book.status === 'available' ? 'status-badge--available' : 'status-badge--sold';
        const statusText = book.status === 'available' ? 'Disponible' : 'Vendido';
        const imageSrc = book.imageFile ? `${BASE_PATH}/images/${book.imageFile}` : PLACEHOLDER_IMAGE;
        
        // Generar HTML para defectos solo si existen y no son "Ninguno"
        const defectsHTML = (book.defects && book.defects.trim() !== '' && book.defects.toLowerCase() !== 'ninguno') 
            ? `<div class="book-detail__defects"><strong>⚠️ Defectos:</strong><p>${book.defects}</p></div>` 
            : '';
        
        // Generar botón de Facebook solo si existe URL
        const facebookButtonHTML = (book.facebookUrl && book.facebookUrl.trim() !== '') 
            ? `<a href="${book.facebookUrl}" target="_blank" rel="noopener noreferrer" class="share-button share-button--facebook-link" title="Ver en Facebook Marketplace">📘 Ver en Facebook</a>` 
            : '';
        
         return `
            <img src="${imageSrc}" alt="Portada de ${book.title}" class="book-detail__cover">
            <div class="book-detail__info">
                <h2 class="book-detail__title">${book.title}</h2>
                <h3 class="book-detail__author">por ${book.author}</h3>
                
                <ul class="book-detail__meta-list">
                    <li><strong>ISBN:</strong> ${book.isbn}</li>
                    <li><strong>Colección:</strong> ${book.collection}</li>
                    <li><strong>Género:</strong> ${book.genre}</li>
                    <li><strong>Editorial:</strong> ${book.publisher}</li>
                    <li><strong>Formato:</strong> ${book.format}</li>
                    ${book.pages > 0 ? `<li><strong>Páginas:</strong> ${book.pages}</li>` : ''}
                    <li><strong>Estado:</strong> ${book.condition}</li>
                    <li><strong>Ubicación:</strong> ${book.location}</li>
                    <li title="${book.deliveryPreference}"><strong>Preferencia de entrega:</strong> ${book.deliveryPreference}</li>
                </ul>
                
                ${defectsHTML}
                
                <p class="book-detail__description">${book.description}</p>
                
                <div class="book-detail__footer">
                    <div class="book-detail__price">${generatePriceHTML(book)}</div>
                    <div class="book-detail__actions">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <div class="share-buttons">
                            <button class="share-button share-button--copy" data-book-id="${book.id}" title="Copiar enlace para compartir">📋 Copiar Link</button>
                            ${facebookButtonHTML}
                        </div>
                    </div>
                </div>
            </div>`;
    }
    
    // --- 5. Punto de Entrada Principal ---
    document.addEventListener('DOMContentLoaded', () => {
        async function main() {
            books = await fetchBooks();

            // Referencias al DOM
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

            // Verificación
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
                
                isGridRendered = true;
            }

            // Gestores de Lógica
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
                    if (!isGridRendered) {
                        renderGrid();
                    }
                    
                    metaManager.resetMeta();
                    
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
                        metaManager.updateBookMeta(book);
                        bookListingView.classList.add('hidden');
                        bookDetailView.classList.remove('hidden');
                        window.scrollTo(0, 0);
                    } else {
                        router.navigateToHome();
                    }
                }
            };

            // Funciones de compartir
            function copyShareLink(bookId) {
                // Usar las páginas estáticas generadas
                const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
                const shareUrl = `${baseUrl}libro-${bookId}.html`;
                
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
                    fallbackCopyToClipboard(shareUrl);
                }
            }

            function shareOnFacebook(bookId) {
                // Usar las páginas estáticas generadas
                const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
                const shareUrl = `${baseUrl}libro-${bookId}.html`;
                const encodedUrl = encodeURIComponent(shareUrl);
                const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                window.open(facebookUrl, 'facebook-share', 'width=600,height=400');
            }

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

            function showNotification(message, isError = false) {
                const notification = document.createElement('div');
                notification.className = `notification ${isError ? 'notification--error' : 'notification--success'}`;
                notification.textContent = message;
                document.body.appendChild(notification);
                
                setTimeout(() => notification.classList.add('visible'), 10);
                
                setTimeout(() => {
                    notification.classList.remove('visible');
                    setTimeout(() => document.body.removeChild(notification), 300);
                }, 3000);
            }

            // Event Listeners
            bookGrid.addEventListener('click', (event) => {
                const card = event.target.closest('.book-card');
                if (card && card.dataset.bookId) {
                    const bookId = parseInt(card.dataset.bookId, 10);
                    console.log('📖 Click en libro ID:', bookId);
                    lastScrollPosition = window.scrollY;
                    lastSelectedBookId = bookId;
                    router.navigateToBook(bookId);
                }
            });

            backButton.addEventListener('click', () => {
                console.log('⬅️ Click en botón volver');
                router.navigateToHome();
            });

            bookDetailContent.addEventListener('click', (event) => {
                if (event.target.classList.contains('book-detail__cover')) {
                    modalManager.open(event.target.src);
                }
                
                if (event.target.classList.contains('share-button--copy')) {
                    const bookId = parseInt(event.target.dataset.bookId, 10);
                    copyShareLink(bookId);
                }
                
                if (event.target.classList.contains('share-button--facebook')) {
                    const bookId = parseInt(event.target.dataset.bookId, 10);
                    shareOnFacebook(bookId);
                }
            });

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

            window.addEventListener('hashchange', () => {
                const bookId = router.getBookIdFromHash();
                console.log('🔄 Hash cambió. Libro ID:', bookId);
                
                if (bookId) {
                    viewManager.showDetailView(bookId);
                } else {
                    viewManager.showGridView();
                }
            });

            // Procesamiento inicial
            const initialBookId = router.getBookIdFromHash();
            
            if (initialBookId) {
                viewManager.showDetailView(initialBookId);
            } else {
                renderGrid();
            }
        }
        
        main();
    });
})();