const fs = require('fs');
const path = require('path');

// Lee tu books.json
const books = require('./books.json');
const BASE_PATH = ''; // O '/tu-repo' si no es la raíz

// Plantilla HTML
function generateBookPage(book) {
    const priceFormatter = new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    });
    const price = book.discountPrice && book.discountPrice < book.price 
        ? priceFormatter.format(book.discountPrice) 
        : priceFormatter.format(book.price);
    
    const description = `${book.author} - ${book.genre}. ${book.condition}. Precio: ${price}. ${book.description.substring(0, 120)}...`;
    const imageUrl = book.imageFile 
        ? `https://jaimeehd.github.io${BASE_PATH}/images/${book.imageFile}`
        : `https://jaimeehd.github.io${BASE_PATH}/images/placeholder.jpg`;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>${book.title} - El Rincón del Lector</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph para Facebook -->
    <meta property="og:type" content="book">
    <meta property="og:site_name" content="El Rincón del Lector">
    <meta property="og:title" content="${book.title} - El Rincón del Lector">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="https://jaimeehd.github.io${BASE_PATH}/libro-${book.id}.html">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${book.title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Redirección inmediata a la página principal -->
    <meta http-equiv="refresh" content="0; url=${BASE_PATH}/index.html#libro/${book.id}">
    <script>
        // Redirección con JavaScript por si el meta refresh falla
        window.location.href = '${BASE_PATH}/index.html#libro/${book.id}';
    </script>
    
    <link rel="stylesheet" href="${BASE_PATH}/css/style.css">
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
            <h1>Redirigiendo...</h1>
            <p>Si no eres redirigido automáticamente, <a href="${BASE_PATH}/index.html#libro/${book.id}">haz clic aquí</a>.</p>
        </div>
    </div>
</body>
</html>`;
}

// Generar un archivo HTML por cada libro
books.forEach(book => {
    const html = generateBookPage(book);
    const filename = `libro-${book.id}.html`;
    fs.writeFileSync(filename, html, 'utf8');
    console.log(`✅ Generado: ${filename}`);
});

console.log(`\n🎉 Se generaron ${books.length} páginas HTML`);
console.log('\n📋 URLs para compartir en Facebook:');
books.forEach(book => {
    console.log(`   - https://jaimeehd.github.io${BASE_PATH}/libro-${book.id}.html`);
});