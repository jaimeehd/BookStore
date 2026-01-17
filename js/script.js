    // Retrocompatibilidad: si existe el array images, úsalo; si no, usa imageFile como único elemento
    function getBookImages(book) {
        if (book.images && Array.isArray(book.images) && book.images.length > 0) {
            return book.images;
        }
        if (book.imageFile && typeof book.imageFile === 'string' && book.imageFile.trim() !== '') {
            return [book.imageFile];
        }
        return ['placeholder.jpg'];
    }
// Usamos un IIFE (Immediately Invoked Function Expression) para encapsular nuestro código.
(function() {
    
    // --- 1. Definiciones y Estado Global del Módulo ---
    const BASE_PATH = window.BASE_PATH || '';
    const PLACEHOLDER_IMAGE = `${BASE_PATH}/images/placeholder.jpg`;

    let books = []; 
    let lastScrollPosition = 0;
    let lastSelectedBookId = null;
    let isGridRendered = false;

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

    // --- 4. Funciones para manejo de series ---
    function getRelatedBooks(book) {
        if (!book.seriesId) return [];
        
        return books.filter(b => 
            b.seriesId === book.seriesId && b.id !== book.id
        ).sort((a, b) => (a.volumeNumber || 0) - (b.volumeNumber || 0));
    }

    function getTotalVolumesForSeries(book, relatedBooks) {
        // Recopilar todos los valores de totalVolumes de la serie
        const allBooks = [book, ...relatedBooks];
        const totalVolumeValues = allBooks
            .map(b => b.totalVolumes)
            .filter(val => val && val > 0);
        
        if (totalVolumeValues.length === 0) {
            // Si nadie tiene totalVolumes, usar el conteo real
            return allBooks.length;
        }
        
        // Usar el valor máximo encontrado (asumiendo que el correcto es el mayor)
        const maxTotalVolumes = Math.max(...totalVolumeValues);
        
        // Validar que el máximo tenga sentido (no puede ser menor que los libros que existen)
        return Math.max(maxTotalVolumes, allBooks.length);
    }

    function generateSeriesWarningHTML(book, relatedBooks) {
        if (!book.seriesId || relatedBooks.length === 0) return '';
        
        // Calcular el total real de volúmenes con lógica robusta
        const totalVolumes = getTotalVolumesForSeries(book, relatedBooks);
        
        // Contar solo los volúmenes disponibles (incluyendo el actual)
        const currentAvailable = book.status === 'available' ? 1 : 0;
        const relatedAvailable = relatedBooks.filter(b => b.status === 'available').length;
        const availableVolumes = currentAvailable + relatedAvailable;
        
        // Contar cuántos volúmenes existen realmente en la base de datos
        const existingVolumes = relatedBooks.length + 1;
        
        // Verificar si todos los volúmenes están disponibles
        const allAvailable = availableVolumes === totalVolumes;
        
        // Detectar si faltan volúmenes por registrar en la BD
        const missingFromDatabase = existingVolumes < totalVolumes;
        
        let warningMessage = '';
        if (missingFromDatabase) {
            // Faltan volúmenes por completo (no están en la BD)
            warningMessage = `<span class="series-warning__alert">⚠️ Solo ${existingVolumes} de ${totalVolumes} volúmenes registrados. ${availableVolumes} disponibles para la venta</span>`;
        } else if (!allAvailable) {
            // Todos los volúmenes están en la BD pero algunos están vendidos
            warningMessage = `<span class="series-warning__alert">⚠️ Solo ${availableVolumes} de ${totalVolumes} volúmenes disponibles</span>`;
        } else {
            // Todo está completo y disponible
            warningMessage = '<span class="series-warning__success">✅ Todos los volúmenes están disponibles</span>';
        }
        
        return `
            <div class="series-warning">
                <div class="series-warning__header">
                    <span class="series-warning__icon">📚</span>
                    <strong>Obra en ${totalVolumes} volúmenes</strong>
                </div>
                <p class="series-warning__message">
                    Esta obra requiere <strong>${totalVolumes} libro${totalVolumes > 1 ? 's' : ''}</strong> para estar completa.
                    ${warningMessage}
                </p>
            </div>`;
    }

    function generateRelatedBooksHTML(relatedBooks) {
        if (relatedBooks.length === 0) return '';
        
        const booksHTML = relatedBooks.map(b => {
            const statusClass = b.status === 'available' ? 'available' : 'sold-out';
            const statusText = b.status === 'available' ? 'Disponible' : 'Agotado';
            const priceFormatter = new Intl.NumberFormat('es-CO', { 
                style: 'currency', 
                currency: 'COP', 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });
            const price = b.discountPrice && b.discountPrice < b.price 
                ? priceFormatter.format(b.discountPrice) 
                : priceFormatter.format(b.price);
            
            return `
                <div class="related-book ${statusClass}" data-book-id="${b.id}">
                    <img src="${b.imageFile ? `${BASE_PATH}/images/${b.imageFile}` : PLACEHOLDER_IMAGE}" 
                         alt="${b.title}" 
                         class="related-book__image">
                    <div class="related-book__info">
                        <h4 class="related-book__title">${b.title}</h4>
                        <p class="related-book__price">${price}</p>
                        <span class="related-book__status">${statusText}</span>
                    </div>
                </div>`;
        }).join('');
        
        return `
            <div class="related-books">
                <h3 class="related-books__title">Otros volúmenes de esta obra:</h3>
                <div class="related-books__grid">
                    ${booksHTML}
                </div>
            </div>`;
    }

    // --- 5. Funciones Puras de Renderizado ---
    function generatePriceHTML(book) {
        const hasDiscount = book.discountPrice && book.discountPrice < book.price;
        const priceFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const originalPrice = priceFormatter.format(book.price);
        const currentPrice = hasDiscount ? priceFormatter.format(book.discountPrice) : originalPrice;
        return `<div class="price-container">${hasDiscount ? `<span class="price-original">${originalPrice}</span><span class="price-current">${currentPrice}</span>` : `<span class="price-current">${currentPrice}</span>`}${book.promoTag ? `<span class="promo-tag">${book.promoTag}</span>` : ''}</div>`;
    }
    
    // Traducción simple de status a etiqueta en inglés (igual que admin.js)
    function getStatusLabel(status) {
        if (!status) return '';
        const s = status.toLowerCase();
        if (s === 'available' || s === 'disponible') return 'available';
        if (s === 'sold' || s === 'agotado' || s === 'vendido') return 'sold';
        return status;
    }

    function generateBookCardHTML(book) {
        // Igual que admin: usar getBookImages y la primera imagen como portada
        const images = getBookImages(book);
        const coverImage = images[0];
        const imageSrc = coverImage && coverImage.startsWith('data:')
            ? coverImage
            : coverImage ? `${BASE_PATH}/images/${coverImage}` : PLACEHOLDER_IMAGE;
        const statusClass = book.status === 'available' ? 'status-badge--available' : 'status-badge--sold';
        const statusText = book.status === 'available' ? 'Disponible' : 'Agotado';
        
        // Badge de serie si aplica
        const seriesBadge = book.seriesId ? `<span class="series-badge">📚 Serie</span>` : '';
        
        return `<article class="book-card" data-book-id="${book.id}"><div class="book-card__image-container"><img src="${imageSrc}" alt="Portada de ${book.title}" class="book-card__image" onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';"><div class="status-badge ${statusClass}">${statusText}</div>${seriesBadge}</div><div class="book-card__content"><h4 class="book-card__title">${book.title}</h4><p class="book-card__meta"><strong>Autor:</strong> ${book.author}</p><p class="book-card__meta"><strong>Género:</strong> ${book.genre}</p><p class="book-card__meta"><strong>Estado:</strong> ${book.condition}</p><div class="book-card__price">${generatePriceHTML(book)}</div></div></article>`;
    }
    
    function generateBookDetailHTML(book) {
        const statusClass = book.status === 'available' ? 'status-badge--available' : 'status-badge--sold';
        const statusText = book.status === 'available' ? 'Disponible' : 'Vendido';
        // Portada y galería de imágenes (retrocompatible)
        let images = [];
        if (Array.isArray(book.images) && book.images.length > 0) {
            images = book.images;
        } else if (book.imageFile) {
            images = [book.imageFile];
        }
        // Portada
        let portadaSrc = PLACEHOLDER_IMAGE;
        if (images.length > 0) {
            portadaSrc = images[0].startsWith('data:') ? images[0] : `${BASE_PATH}/images/${images[0]}`;
        }

        // Galería simple de miniaturas (máx 5, sin navegación)
        let galleryHTML = '';
        if (images.length > 1) {
            galleryHTML = `<div class="book-detail-gallery">`;
            images.slice(0, 5).forEach((img, idx) => {
                const thumbSrc = img.startsWith('data:') ? img : `${BASE_PATH}/images/${img}`;
                galleryHTML += `<img src="${thumbSrc}" class="book-detail-thumb" data-idx="${idx}" alt="Imagen ${idx+1}" style="width:40px;height:40px;object-fit:contain;background:#fff;margin:2px;cursor:pointer;border:${idx===0?'2px solid #5D4037':'1px solid #ccc'};">`;
            });
            galleryHTML += `</div>`;
        }
        
        const defectsHTML = (book.defects && book.defects.trim() !== '' && book.defects.toLowerCase() !== 'ninguno') 
            ? `<div class="book-detail__defects"><strong>⚠️ Defectos:</strong><p>${book.defects}</p></div>` 
            : '';
        
        const facebookButtonHTML = (book.facebookUrl && book.facebookUrl.trim() !== '') 
            ? `<a href="${book.facebookUrl}" target="_blank" rel="noopener noreferrer" class="share-button share-button--facebook-link" title="Ver en Facebook Marketplace">📘 Ver en Facebook</a>` 
            : '';
        
        // Obtener libros relacionados de la serie
        const relatedBooks = getRelatedBooks(book);
        const seriesWarningHTML = generateSeriesWarningHTML(book, relatedBooks);
        const relatedBooksHTML = generateRelatedBooksHTML(relatedBooks);
        
         return `
            <div class="book-detail__images">
                <img src="${portadaSrc}" alt="Portada de ${book.title}" class="book-detail__cover" id="main-book-image" style="cursor:pointer;">
                ${galleryHTML}
            </div>
            <div class="book-detail__info">
                <h2 class="book-detail__title">${book.title}</h2>
                <h3 class="book-detail__author">por ${book.author}</h3>
                
                ${seriesWarningHTML}
                
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
                
                ${relatedBooksHTML}
                
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
    
    // --- 6. Punto de Entrada Principal ---
    document.addEventListener('DOMContentLoaded', () => {
        // (Eliminada la lógica de navegación y botones de la galería)
        async function main() {
            books = await fetchBooks();

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

            // Evento para galería: cambiar portada al hacer click en miniatura
            bookDetailContent.addEventListener('click', function(e) {
                if (e.target.classList.contains('book-detail-thumb')) {
                    const idx = parseInt(e.target.dataset.idx, 10);
                    const bookId = bookDetailContent.querySelector('.share-button--copy')?.dataset.bookId;
                    const book = books.find(b => b.id == bookId);
                    if (!book) return;
                    let images = [];
                    if (Array.isArray(book.images) && book.images.length > 0) {
                        images = book.images;
                    } else if (book.imageFile) {
                        images = [book.imageFile];
                    }
                    if (images[idx]) {
                        const mainImg = document.getElementById('main-book-image');
                        mainImg.src = images[idx].startsWith('data:') ? images[idx] : `${BASE_PATH}/images/${images[idx]}`;
                        // Restaurar borde inline
                        bookDetailContent.querySelectorAll('.book-detail-thumb').forEach((thumb, i) => {
                            thumb.style.border = (i === idx) ? '2px solid #5D4037' : '1px solid #ccc';
                        });
                    }
                }
            });

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
                const statusLabel = getStatusLabel(lowerCaseSearchTerm);
                const filteredBooks = books.filter(book => {
                    return (
                        book.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                        book.author.toLowerCase().includes(lowerCaseSearchTerm) ||
                        book.genre.toLowerCase().includes(lowerCaseSearchTerm) ||
                        (book.collection && book.collection.toLowerCase().includes(lowerCaseSearchTerm)) ||
                        (book.status && book.status.toLowerCase().includes(statusLabel))
                    );
                });

                if (filteredBooks.length > 0) {
                    bookGrid.innerHTML = filteredBooks.map(generateBookCardHTML).join('');
                } else {
                    bookGrid.innerHTML = `<p class="no-results-message">No se encontraron libros para tu búsqueda.</p>`;
                }
                
                isGridRendered = true;
            }

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

            function copyShareLink(bookId) {
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
                
                // Navegación a libro relacionado
                const relatedBook = event.target.closest('.related-book');
                if (relatedBook && relatedBook.dataset.bookId) {
                    const bookId = parseInt(relatedBook.dataset.bookId, 10);
                    router.navigateToBook(bookId);
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