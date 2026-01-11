const https = require('https');

// Configuración
const CONFIG = {
    githubUser: 'jaimeehd',
    repoName: 'bookstore',
    totalBooks: 15  // Ajusta según cuántos libros tengas
};

const BASE_URL = `https://${CONFIG.githubUser}.github.io/${CONFIG.repoName}`;

// Función para hacer scrape de una URL en Facebook
function scrapeFacebookURL(bookId) {
    return new Promise((resolve, reject) => {
        const bookUrl = `${BASE_URL}/libro-${bookId}.html`;
        const encodedUrl = encodeURIComponent(bookUrl);
        const fbUrl = `https://graph.facebook.com/?id=${encodedUrl}&scrape=true`;
        
        https.get(fbUrl, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ Libro ${bookId} - Cacheado correctamente`);
                    resolve({ bookId, success: true });
                } else {
                    console.log(`⚠️  Libro ${bookId} - Código: ${res.statusCode}`);
                    resolve({ bookId, success: false, code: res.statusCode });
                }
            });
        }).on('error', (err) => {
            console.error(`❌ Libro ${bookId} - Error:`, err.message);
            reject({ bookId, error: err.message });
        });
    });
}

// Función principal
async function precacheAllBooks() {
    console.log('🚀 Iniciando pre-caché en Facebook...\n');
    console.log(`📦 Total de libros: ${CONFIG.totalBooks}`);
    console.log(`🌐 URL base: ${BASE_URL}\n`);
    
    const results = [];
    
    // Procesar libros en lotes de 3 para no saturar
    for (let i = 1; i <= CONFIG.totalBooks; i += 3) {
        const batch = [];
        
        for (let j = i; j < i + 3 && j <= CONFIG.totalBooks; j++) {
            batch.push(scrapeFacebookURL(j));
        }
        
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
        
        // Pausa de 2 segundos entre lotes
        if (i + 3 <= CONFIG.totalBooks) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n' + '='.repeat(60));
    const successful = results.filter(r => r.success).length;
    console.log(`✅ URLs cacheadas exitosamente: ${successful}/${CONFIG.totalBooks}`);
    console.log('='.repeat(60));
    
    console.log('\n💡 Ahora puedes compartir cualquier libro en Facebook y se verá correctamente.\n');
}

// Ejecutar
precacheAllBooks().catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});