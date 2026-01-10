const fs = require('fs');
const path = require('path');

// Configuración - Solo esto se modifica según el proyecto
const CONFIG = {
    githubUser: 'jaimeehd',      // Tu usuario de GitHub
    repoName: 'bookstore',        // Nombre de tu repositorio
    siteName: 'El Rincón del Lector',
    booksJsonPath: './books.json',
    outputDir: './'               // Donde se guardarán los HTML generados
};

// Construir URLs base dinámicamente
const BASE_URL = `https://${CONFIG.githubUser}.github.io/${CONFIG.repoName}`;
const IMAGES_URL = `${BASE_URL}/images`;

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

// Generar descripción del libro
function generateDescription(book) {
    const price = book.discountPrice && book.discountPrice < book.price 
        ? formatPrice(book.discountPrice) 
        : formatPrice(book.price);
    
    return `${book.author} - ${book.genre}. ${book.condition}. Precio: ${price}. ${book.description.substring(0, 120)}...`;
}

// Generar URL de imagen
function getImageUrl(book) {
    return book.imageFile 
        ? `${IMAGES_URL}/${book.imageFile}`
        : `${IMAGES_URL}/placeholder.jpg`;
}

// Plantilla HTML
function generateBookPage(book) {
    const description = generateDescription(book);
    const imageUrl = getImageUrl(book);
    const pageUrl = `${BASE_URL}/libro-${book.id}.html`;
    const redirectUrl = `${BASE_URL}/index.html#libro/${book.id}`;
    
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
    <meta property="og:url" content="${pageUrl}">
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
            --font-primary: 'Merriweather', serif;
            --font-secondary: 'Roboto', sans-serif;
        }
        
        body {
            font-family: var(--font-secondary);
            background-color: var(--background-color);
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        
        .header {
            background-color: var(--primary-color);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-family: var(--font-primary);
            font-size: 1.8rem;
            margin: 0;
        }
        
        .container {
            max-width: 900px;
            margin: 2rem auto;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .book-info {
            display: flex;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .book-cover {
            flex-shrink: 0;
            width: 250px;
        }
        
        .book-cover img {
            width: 100%;
            height: auto;
            border-radius: 5px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        
        .book-details {
            flex-grow: 1;
        }
        
        .book-title {
            font-family: var(--font-primary);
            font-size: 2rem;
            color: var(--primary-color);
            margin: 0 0 0.5rem 0;
        }
        
        .book-author {
            font-size: 1.3rem;
            color: #666;
            margin-bottom: 1rem;
        }
        
        .book-meta {
            list-style: none;
            padding: 0;
            margin-bottom: 1.5rem;
        }
        
        .book-meta li {
            padding: 0.3rem 0;
            color: #444;
        }
        
        .book-description {
            line-height: 1.6;
            color: #333;
            margin-bottom: 2rem;
        }
        
        .cta-button {
            display: inline-block;
            background-color: var(--accent-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1rem;
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
            padding: 1.5rem;
        }
        
        @media (max-width: 768px) {
            .book-info {
                flex-direction: column;
                align-items: center;
            }
            
            .book-cover {
                width: 200px;
            }
            
            .container {
                margin: 1rem;
                padding: 1.5rem;
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
                <img src="${imageUrl}" alt="Portada de ${book.title}">
            </div>
            <div class="book-details">
                <h2 class="book-title">${book.title}</h2>
                <p class="book-author">por ${book.author}</p>
                <ul class="book-meta">
                    <li><strong>Género:</strong> ${book.genre}</li>
                    <li><strong>Estado:</strong> ${book.condition}</li>
                    <li><strong>Precio:</strong> ${formatPrice(book.price)}</li>
                </ul>
            </div>
        </div>
        
        <div class="book-description">
            <p>${book.description}</p>
        </div>
        
        <a href="${redirectUrl}" class="cta-button">Ver en la tienda completa →</a>
    </main>
    
    <footer class="footer">
        <p>&copy; 2023 ${CONFIG.siteName}. Todos los derechos reservados.</p>
    </footer>
</body>
</html>`;
}

// Generar archivos
function generatePages() {
    const books = loadBooks();
    let successCount = 0;
    let errorCount = 0;
    
    console.log('\n🚀 Generando páginas HTML...\n');
    console.log(`📦 Total de libros: ${books.length}`);
    console.log(`🌐 URL base: ${BASE_URL}\n`);
    
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
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Páginas generadas exitosamente: ${successCount}`);
    if (errorCount > 0) {
        console.log(`❌ Errores: ${errorCount}`);
    }
    console.log('='.repeat(60));
    
    console.log('\n📋 URLs para compartir en Facebook:\n');
    books.slice(0, 5).forEach(book => {
        console.log(`   ${BASE_URL}/libro-${book.id}.html`);
    });
    if (books.length > 5) {
        console.log(`   ... y ${books.length - 5} más`);
    }
    
    console.log('\n💡 Próximos pasos:');
    console.log('   1. git add libro-*.html');
    console.log('   2. git commit -m "Actualizar páginas de libros"');
    console.log('   3. git push origin main');
    console.log('   4. Probar en Facebook Debugger\n');
}

// Ejecutar
try {
    generatePages();
} catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
}