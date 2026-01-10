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
    
    <!-- Redirección -->
    <meta http-equiv="refresh" content="0; url=${redirectUrl}">
    <script>
        window.location.href = '${redirectUrl}';
    </script>
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 { margin-bottom: 1rem; font-size: 2rem; }
        .spinner {
            border: 4px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 2rem auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        a {
            color: white;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Redirigiendo...</h1>
        <div class="spinner"></div>
        <p>Si no eres redirigido automáticamente, <a href="${redirectUrl}">haz clic aquí</a>.</p>
    </div>
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