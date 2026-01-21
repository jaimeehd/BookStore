const fs = require('fs');
const path = require('path');

// =====================================================
// Configuración
// =====================================================
const CONFIG = {
    siteName: 'El Rincón del Lector',
    booksJsonPath: './books.json',
    outputDir: './'
};

// =====================================================
// Funciones de Utilidad
// =====================================================

// Normalizar nombres de archivo
function normalizeFileName(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .replace(/[^a-z0-9\s-]/g, "")     // Eliminar caracteres especiales
        .replace(/\s+/g, "-")              // Espacios a guiones
        .replace(/-+/g, "-")               // Múltiples guiones a uno
        .trim();
}

// Obtener nombre de la primera imagen de un libro
function getBookImageName(book) {
    const titleNorm = normalizeFileName(book.title);
    const authorNorm = normalizeFileName(book.author);
    return `${titleNorm}_${authorNorm}_1.jpg`;
}

// Leer books.json
function loadBooks() {
    try {
        const booksData = fs.readFileSync(CONFIG.booksJsonPath, 'utf8');
        return JSON.parse(booksData);
    } catch (error) {
        console.error('❌ Error al leer books.json:', error.message);
        process.exit(1);
    }
}

// Formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    }).format(price);
}

// Generar descripción del libro (escapando comillas para HTML)
function generateDescription(book) {
    const price = book.discountPrice && book.discountPrice < book.price 
        ? formatPrice(book.discountPrice) 
        : formatPrice(book.price);
    
    const desc = `${book.author} - ${book.genre}. ${book.condition}. Precio: ${price}. ${book.description.substring(0, 120)}...`;
    return desc.replace(/"/g, '&quot;');
}

// Generar URL de imagen (relativa)
function getImageUrl(book) {
    const imageName = getBookImageName(book);
    return `./images/${imageName}`;
}

// Generar HTML para defectos (solo si existen)
function generateDefectsHTML(book) {
    if (!book.defects || book.defects.trim() === '' || book.defects.toLowerCase() === 'ninguno') {
        return '';
    }
    
    return `
        <div class="book-defects">
            <strong>⚠️ Defectos:</strong>
            <p>${book.defects}</p>
        </div>`;
}

// Generar HTML para precios (con descuento si aplica)
function generatePriceHTML(book) {
    const hasDiscount = book.discountPrice && book.discountPrice < book.price;
    
    if (hasDiscount) {
        return `
            <div class="price-container">
                <span class="price-original">${formatPrice(book.price)}</span>
                <span class="price-current">${formatPrice(book.discountPrice)}</span>
                ${book.promoTag ? `<span class="promo-tag">${book.promoTag}</span>` : ''}
            </div>`;
    }
    
    return `
        <div class="price-container">
            <span class="price-current">${formatPrice(book.price)}</span>
            ${book.promoTag ? `<span class="promo-tag">${book.promoTag}</span>` : ''}
        </div>`;
}

// =====================================================
// Plantilla HTML
// =====================================================
function generateBookPage(book) {
    const description = generateDescription(book);
    const imageUrl = getImageUrl(book);
    const defectsHTML = generateDefectsHTML(book);
    const priceHTML = generatePriceHTML(book);
    const redirectUrl = `./index.html#libro/${book.id}`;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>${book.title} - ${CONFIG.siteName}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph para Facebook -->
    <meta property="og:type" content="book">
    <meta property="og:site_name" content="${CONFIG.siteName}">
    <meta property="og:title" content="${book.title} - ${CONFIG.siteName}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Portada de ${book.title}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${book.title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Roboto:wght@300;400&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --primary-color: #5D4037;
            --secondary-color: #D7CCC8;
            --background-color: #F5F5F5;
            --accent-color: #8D6E63;
            --warning-bg: #fff3cd;
            --warning-border: #ff9800;
            --warning-text: #856404;
            --promo-color: #FF8F00;
            --font-primary: 'Merriweather', serif;
            --font-secondary: 'Roboto', sans-serif;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-secondary);
            background-color: var(--background-color);
            color: #3E2723;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            line-height: 1.3;
        }
        
        .header {
            background-color: var(--primary-color);
            color: white;
            padding: 0.87rem 1.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-family: var(--font-primary);
            font-size: 1.25rem;
            margin: 0;
        }
        
        .container {
            max-width: 1000px;
            margin: 1rem auto;
            padding: 1rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .book-info {
            display: flex;
            gap: 2rem;
            margin-bottom: 1rem;
            align-items: flex-start;
        }
        
        .book-cover {
            flex-shrink: 0;
            width: 250px;
        }
        
        .book-cover img {
            width: 100%;
            height: auto;
            max-height: 375px;
            object-fit: contain;
            border-radius: 5px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            background-color: var(--background-color);
        }
        
        .book-details {
            flex-grow: 1;
            min-width: 0;
        }
        
        .book-title {
            font-family: var(--font-primary);
            font-size: 1.3rem;
            color: var(--primary-color);
            margin: 0 0 0.5rem 0;
            line-height: 1.3;
        }
        
        .book-author {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 1.25rem;
        }
        
        .book-meta {
            list-style: none;
            padding: 0;
            margin-bottom: 1.2rem;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem 1rem;
        }
        
        .book-meta li {
            padding: 0.3rem 0;
            color: #444;
            font-size: 0.95rem;
        }
        
        .book-meta strong {
            color: var(--primary-color);
        }
        
        .book-defects {
            background-color: var(--warning-bg);
            border-left: 4px solid var(--warning-border);
            padding: 0.75rem 1rem;
            margin: 0.75rem 0;
            border-radius: 4px;
        }
        
        .book-defects strong {
            color: var(--warning-text);
            display: block;
            margin-bottom: 0.5rem;
        }
        
        .book-defects p {
            margin: 0;
            color: var(--warning-text);
        }
        
        .book-description {
            line-height: 1.25;
            color: #333;
            margin-bottom: 1rem;
        }
        
        .price-section {
            margin: 1rem 0;
            padding: 0.75rem;
            background-color: #f9f9f9;
            border-radius: 8px;
            border: 2px solid var(--secondary-color);
        }
        
        .price-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }
        
        .price-original {
            font-size: 1rem;
            color: #888;
            text-decoration: line-through;
        }
        
        .price-current {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--primary-color);
        }
        
        .promo-tag {
            background-color: var(--promo-color);
            color: white;
            font-size: 0.85rem;
            font-weight: bold;
            padding: 0.3rem 0.8rem;
            border-radius: 15px;
        }
        
        .cta-button {
            display: inline-block;
            background-color: var(--accent-color);
            color: white;
            padding: 0.7rem 2rem;
            border-radius: 5px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        
        .cta-button:hover {
            background-color: var(--primary-color);
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.3);
        }
        
        .footer {
            margin-top: auto;
            background-color: #3E2723;
            color: var(--secondary-color);
            text-align: center;
            padding: 1rem;
        }
        
        @media (max-width: 768px) {
            .book-info {
                flex-direction: column;
                align-items: center;
            }
            
            .book-cover {
                width: 200px;
            }
            
            .book-meta {
                grid-template-columns: 1fr;
            }
            
            .book-title {
                font-size: 1.5rem;
                text-align: center;
            }
            
            .book-author {
                text-align: center;
            }
            
            .container {
                margin: 1rem;
                padding: 1.5rem;
            }
            
            .price-current {
                font-size: 1.6rem;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>${CONFIG.siteName}</h1>
    </header>
    
    <main class="container">
        <div class="book-info">
            <div class="book-cover">
                <img src="${imageUrl}" alt="Portada de ${book.title}" onerror="this.onerror=null; this.src='./images/placeholder.jpg';">
            </div>
            <div class="book-details">
                <h2 class="book-title">${book.title}</h2>
                <p class="book-author">por ${book.author}</p>
                <ul class="book-meta">
                    <li><strong>ISBN:</strong> ${book.isbn}</li>
                    <li><strong>Colección:</strong> ${book.collection}</li>
                    <li><strong>Género:</strong> ${book.genre}</li>
                    <li><strong>Editorial:</strong> ${book.publisher}</li>
                    <li><strong>Formato:</strong> ${book.format}</li>
                    ${book.pages > 0 ? `<li><strong>Páginas:</strong> ${book.pages}</li>` : ''}
                    <li><strong>Estado:</strong> ${book.condition}</li>
                    <li><strong>Ubicación:</strong> ${book.location}</li>
                    <li><strong>Entrega:</strong> ${book.deliveryPreference}</li>
                </ul>
            </div>
        </div>
        
        ${defectsHTML}
        
        <div class="book-description">
            <p>${book.description}</p>
        </div>
        
        <div class="price-section">
            ${priceHTML}
        </div>
        
        <a href="${redirectUrl}" class="cta-button">Ver en la tienda completa →</a>
    </main>
    
    <footer class="footer">
        <p>&copy; 2025 ${CONFIG.siteName}. Todos los derechos reservados.</p>
    </footer>
</body>
</html>`;
}

// =====================================================
// Generación de Archivos
// =====================================================
function generatePages() {
    const books = loadBooks();
    let successCount = 0;
    let errorCount = 0;
    
    console.log('\n🚀 Generando páginas HTML con rutas relativas...\n');
    console.log(`📦 Total de libros: ${books.length}\n`);
    
    // Generar lista de imágenes requeridas
    console.log('📸 Imágenes requeridas por libro:\n');
    books.forEach(book => {
        const imageName = getBookImageName(book);
        console.log(`   ${imageName} -> "${book.title}"`);
    });
    console.log('\n' + '='.repeat(70) + '\n');
    
    books.forEach(book => {
        try {
            const html = generateBookPage(book);
            const filename = path.join(CONFIG.outputDir, `libro-${book.id}.html`);
            fs.writeFileSync(filename, html, 'utf8');
            console.log(`✅ ${filename} - "${book.title}"`);
            successCount++;
        } catch (error) {
            console.error(`❌ Error generando libro ${book.id}:`, error.message);
            errorCount++;
        }
    });
    
    console.log('\n' + '='.repeat(70));
    console.log(`✅ Páginas generadas exitosamente: ${successCount}`);
    if (errorCount > 0) {
        console.log(`❌ Errores: ${errorCount}`);
    }
    console.log('='.repeat(70));
    
    console.log('\n💡 Páginas generadas con rutas relativas');
    console.log('   ✅ Compatible con GitHub Pages');
    console.log('   ✅ Compatible con Netlify');
    console.log('   ✅ Compatible con Vercel');
    console.log('   ✅ Compatible con cualquier hosting\n');
    
    console.log('📋 Características:');
    console.log('   • Rutas de imágenes: ./images/');
    console.log('   • Redirección: ./index.html#libro/ID');
    console.log('   • Meta tags Open Graph optimizados');
    console.log('   • Fallback a placeholder.jpg automático\n');
    
    console.log('💡 Próximos pasos:');
    console.log('   1. Verifica que todas las imágenes estén en /images/');
    console.log('   2. git add libro-*.html images/');
    console.log('   3. git commit -m "Páginas con rutas relativas"');
    console.log('   4. git push');
    console.log('   5. Probar en Facebook Debugger');
    console.log('   6. https://developers.facebook.com/tools/debug/\n');
}

// =====================================================
// Ejecutar
// =====================================================
try {
    generatePages();
} catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
}