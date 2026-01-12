(function() {
    
    // --- 1. Estado y Constantes ---
    const BASE_PATH = window.BASE_PATH || '';
    const PLACEHOLDER_IMAGE = `${BASE_PATH}/images/placeholder.jpg`;

    let books = [];
    let filteredBooks = [];

    // --- 2. Funciones de Carga y Renderizado ---
    async function fetchBooks() {
        try {
            const response = await fetch(`${BASE_PATH}/books.json`);
            if (!response.ok) throw new Error(`Error en la red: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error('No se pudieron cargar los libros:', error);
            alert("Error: No se pudo cargar el archivo books.json. Asegúrese de estar usando un servidor local (Live Server en VSCode es recomendado) y que el archivo exista. Revise la consola para más detalles.");
            return [];
        }
    }
    
    function generatePriceHTML(book) {
        const hasDiscount = book.discountPrice && book.discountPrice > 0 && book.discountPrice < book.price;
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

    // --- 3. LÓGICA DEL FORMULARIO DE EDICIÓN Y CREACIÓN ---
   function generateEditFormHTML(book = {}) {
        const isNew = !book.id;
        const bookId = isNew ? Date.now() : book.id;

        return `
            <input type="hidden" name="id" value="${bookId}">
            <input type="hidden" name="isNew" value="${isNew}">
            
            <div class="form-group">
                <label for="title">Título</label>
                <input type="text" id="title" name="title" value="${book.title || ''}" required>
            </div>
            
            <div class="form-group">
                <label for="author">Autor</label>
                <input type="text" id="author" name="author" value="${book.author || ''}" required>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="price">Precio</label>
                    <input type="number" id="price" name="price" value="${book.price || 0}" min="0" step="1" required>
                </div>
                <div class="form-group">
                    <label for="discountPrice">Precio Descuento (0 si no aplica)</label>
                    <input type="number" id="discountPrice" name="discountPrice" value="${book.discountPrice || 0}" min="0" step="1" required>
                </div>
                 <div class="form-group">
                    <label for="status">Disponibilidad</label>
                    <select id="status" name="status">
                        <option value="available" ${book.status === 'available' || !book.status ? 'selected' : ''}>Disponible</option>
                        <option value="sold" ${book.status === 'sold' ? 'selected' : ''}>Agotado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="condition">Estado</label>
                    <select id="condition" name="condition" required>
                        <option value="Usado - Como nuevo" ${book.condition === 'Usado - Como nuevo' ? 'selected' : ''}>Usado - Como nuevo</option>
                        <option value="Usado - Buen estado" ${book.condition === 'Usado - Buen estado' || !book.condition ? 'selected' : ''}>Usado - Buen estado</option>
                        <option value="Usado - Aceptable" ${book.condition === 'Usado - Aceptable' ? 'selected' : ''}>Usado - Aceptable</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="promoTag">Etiqueta Promocional</label>
                    <input type="text" id="promoTag" name="promoTag" value="${book.promoTag || ''}">
                </div>
            </div>

            <div class="form-group">
                <label for="imageFile">Nombre Archivo Imagen (ej: autor-titulo.jpg)</label>
                <input type="text" id="imageFile" name="imageFile" value="${book.imageFile || ''}">
            </div>

            <div class="form-group">
                <label for="description">Descripción</label>
                <textarea id="description" name="description" rows="4" required>${book.description || ''}</textarea>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="genre">Género(s)</label>
                    <input type="text" id="genre" name="genre" value="${book.genre || ''}" required>
                </div>
                <div class="form-group">
                    <label for="collection">Colección</label>
                    <input type="text" id="collection" name="collection" value="${book.collection || ''}">
                </div>
                 <div class="form-group">
                    <label for="isbn">ISBN</label>
                    <input type="text" id="isbn" name="isbn" value="${book.isbn || 'S/I'}">
                </div>
                
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="publisher">Editorial</label>
                    <input type="text" id="publisher" name="publisher" value="${book.publisher || 'Editorial Planeta'}">
                </div>
                <div class="form-group">
                    <label for="pages">Número de Páginas</label>
                    <input type="number" id="pages" name="pages" value="${book.pages || 0}" min="0" step="1">
                </div>
                <div class="form-group">
                    <label for="format">Formato</label>
                    <select id="format" name="format">
                        <option value="Tapa Blanda" ${book.format === 'Tapa Blanda' || !book.format ? 'selected' : ''}>Tapa Blanda</option>
                        <option value="Tapa Dura" ${book.format === 'Tapa Dura' ? 'selected' : ''}>Tapa Dura</option>
                        <option value="Bolsillo" ${book.format === 'Bolsillo' ? 'selected' : ''}>Bolsillo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="publicationYear">Año de Publicación</label>
                    <input type="number" id="publicationYear" name="publicationYear" value="${book.publicationYear || 0}" min="0" max="${new Date().getFullYear()}" step="1">
                </div>
                <div class="form-group">
                    <label for="language">Idioma</label>
                    <select id="language" name="language">
                        <option value="Español" ${book.language === 'Español' || !book.language ? 'selected' : ''}>Español</option>
                        <option value="Inglés" ${book.language === 'Inglés' ? 'selected' : ''}>Inglés</option>
                        <option value="Francés" ${book.language === 'Francés' ? 'selected' : ''}>Francés</option>
                        <option value="Alemán" ${book.language === 'Alemán' ? 'selected' : ''}>Alemán</option>
                        <option value="Italiano" ${book.language === 'Italiano' ? 'selected' : ''}>Italiano</option>
                        <option value="Portugués" ${book.language === 'Portugués' ? 'selected' : ''}>Portugués</option>
                        <option value="Otro" ${book.language === 'Otro' ? 'selected' : ''}>Otro</option>
                    </select>
                </div>
            </div>

            <div class="form-grid">

                <div class="form-group">
                    <label for="location">Ubicación</label>
                    <input type="text" id="location" name="location" value="${book.location || 'Bogotá'}">
                </div>
                <div class="form-group">
                    <label for="shippingClass">Clase de Envío</label>
                    <select id="shippingClass" name="shippingClass">
                        <option value="Estándar" ${book.shippingClass === 'Estándar' || !book.shippingClass ? 'selected' : ''}>Estándar</option>
                        <option value="Express" ${book.shippingClass === 'Express' ? 'selected' : ''}>Express</option>
                        <option value="Internacional" ${book.shippingClass === 'Internacional' ? 'selected' : ''}>Internacional</option>
                    </select>
                </div>
                 <div class="form-group">
                    <label for="deliveryPreference">Preferencias de Entrega</label>
                    <select id="deliveryPreference" name="deliveryPreference">
                    <option value="Encuentro en un lugar público" ${book.deliveryPreference === 'Encuentro en un lugar público' || !book.deliveryPreference ? 'selected' : ''}>Encuentro en un lugar público</option>
                    <option value="Retiro en la puerta" ${book.deliveryPreference === 'Retiro en la puerta' ? 'selected' : ''}>Retiro en la puerta</option>
                    <option value="Entrega en la puerta" ${book.deliveryPreference === 'Entrega en la puerta' ? 'selected' : ''}>Entrega en la puerta</option>
                </select>
                </div>
            </div>
            <div class="form-group">
                    <label for="facebookUrl">URL de Facebook</label>
                    <input type="url" id="facebookUrl" name="facebookUrl" value="${book.facebookUrl || ''}" placeholder="https://facebook.com/...">
                </div>
            <div class="form-group">
                <label for="defects">Defectos</label>
                <textarea id="defects" name="defects" rows="2">${book.defects || 'Ninguno'}</textarea>
            </div>

            <button type="submit" class="form-submit-btn">${isNew ? 'Añadir Libro' : 'Guardar Cambios'}</button>
        `;
    }

    // --- 4. PUNTO DE ENTRADA PRINCIPAL ---
    document.addEventListener('DOMContentLoaded', () => {
        const bookGrid = document.getElementById('book-grid');
        const editModal = document.getElementById('edit-modal');
        const editForm = document.getElementById('edit-book-form');
        const modalCloseButton = editModal.querySelector('.modal-close');
        const exportBtn = document.getElementById('export-json-btn');
        const jsonOutput = document.getElementById('json-output');
        const addBookBtn = document.getElementById('add-book-btn');
        const modalTitle = document.getElementById('modal-title');
        const searchInput = document.getElementById('search-input');
        const clearSearchBtn = document.getElementById('clear-search');

        const modalManager = {
            open: (book = null) => {
                const isNew = !book;
                modalTitle.textContent = isNew ? 'Añadir Nuevo Libro' : 'Editar Libro';
                editForm.innerHTML = generateEditFormHTML(book || {});
                editModal.classList.add('visible');
                document.body.classList.add('no-scroll');
                
                // Reiniciar scroll del contenido del modal a la parte superior
                const modalContent = editModal.querySelector('.edit-modal-content');
                if (modalContent) {
                    modalContent.scrollTop = 0;
                }
                
                // Agregar event listeners para seleccionar contenido al hacer foco
                const formInputs = editForm.querySelectorAll('input[type="text"], input[type="number"], input[type="url"], textarea');
                formInputs.forEach(input => {
                    input.addEventListener('focus', function() {
                        this.select();
                    });
                });
            },
            close: () => {
                editModal.classList.remove('visible');
                document.body.classList.remove('no-scroll');
            }
        };

        function renderGrid() {
            const booksToRender = filteredBooks.length > 0 || document.getElementById('search-input').value.trim() !== '' 
                ? filteredBooks 
                : books;
            bookGrid.innerHTML = booksToRender.map(generateBookCardHTML).join('');
        }

        function filterBooks(searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            
            if (term === '') {
                filteredBooks = [];
                return books;
            }
            
            filteredBooks = books.filter(book => {
                return (
                    book.title.toLowerCase().includes(term) ||
                    book.author.toLowerCase().includes(term) ||
                    book.genre.toLowerCase().includes(term) ||
                    (book.collection && book.collection.toLowerCase().includes(term))
                );
            });
            
            return filteredBooks;
        }

        function updateSearchInfo(searchTerm) {
            const searchInfo = document.getElementById('search-results-info');
            const clearBtn = document.getElementById('clear-search');
            
            if (searchTerm.trim() === '') {
                searchInfo.textContent = '';
                clearBtn.style.display = 'none';
            } else {
                const count = filteredBooks.length;
                searchInfo.textContent = `Se encontraron ${count} resultado${count !== 1 ? 's' : ''} para "${searchTerm}"`;
                clearBtn.style.display = 'block';
            }
        }

        // Click en una tarjeta para editar
        bookGrid.addEventListener('click', (event) => {
            const card = event.target.closest('.book-card');
            if (card && card.dataset.bookId) {
                const bookId = parseInt(card.dataset.bookId, 10);
                const bookToEdit = books.find(b => b.id === bookId);
                if (bookToEdit) modalManager.open(bookToEdit);
            }
        });
        
        // Click en el botón flotante para añadir
        addBookBtn.addEventListener('click', () => {
            modalManager.open();
        });

        // Búsqueda en tiempo real
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            filterBooks(searchTerm);
            updateSearchInfo(searchTerm);
            renderGrid();
        });

        // Limpiar búsqueda
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            filteredBooks = [];
            updateSearchInfo('');
            renderGrid();
            searchInput.focus();
        });

        // Submit del formulario (crear o editar)
        editForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const isNew = formData.get('isNew') === 'true';
            const bookId = parseInt(formData.get('id'), 10);
            
            const bookData = {
                id: bookId,
                title: formData.get('title'),
                author: formData.get('author'),
                genre: formData.get('genre'),
                condition: formData.get('condition'),
                isbn: formData.get('isbn'),
                collection: formData.get('collection'),
                publisher: formData.get('publisher'),
                pages: parseInt(formData.get('pages'), 10) || 0,
                format: formData.get('format'),
                publicationYear: parseInt(formData.get('publicationYear'), 10) || 0,
                language: formData.get('language'),
                defects: formData.get('defects'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                discountPrice: parseFloat(formData.get('discountPrice')) || null,
                promoTag: formData.get('promoTag'),
                status: formData.get('status'),
                imageFile: formData.get('imageFile'),
                facebookUrl: formData.get('facebookUrl'),
                location: formData.get('location'),
                shippingClass: formData.get('shippingClass'),
                deliveryPreference: formData.get('deliveryPreference') 
            };

            if (isNew) {
                books.push(bookData);
                alert('¡Libro añadido en memoria! No olvide exportar el JSON para guardar los cambios permanentemente.');
            } else {
                const bookIndex = books.findIndex(b => b.id === bookId);
                if (bookIndex !== -1) {
                    books[bookIndex] = bookData;
                    alert('¡Libro actualizado en memoria! No olvide exportar el JSON para guardar los cambios permanentemente.');
                }
            }

            // Actualizar filtros si hay búsqueda activa
            const currentSearch = searchInput.value;
            if (currentSearch.trim() !== '') {
                filterBooks(currentSearch);
                updateSearchInfo(currentSearch);
            }

            renderGrid();
            modalManager.close();
        });
        
        exportBtn.addEventListener('click', () => {
            const jsonString = JSON.stringify(books, null, 2);
            jsonOutput.value = jsonString;
            navigator.clipboard.writeText(jsonString).then(() => {
                alert('¡JSON generado y copiado al portapapeles!');
            }).catch(err => {
                alert('JSON generado. No se pudo copiar al portapapeles, por favor cópielo manualmente.');
                console.error('Error al copiar: ', err);
            });
            jsonOutput.select();
        });

        modalCloseButton.addEventListener('click', modalManager.close);
        editModal.addEventListener('click', (e) => { if (e.target === editModal) modalManager.close(); });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && editModal.classList.contains('visible')) modalManager.close(); });

        async function init() {
            books = await fetchBooks();
            if (books.length > 0) {
                renderGrid();
            }
        }
        
        init();
    });
})();