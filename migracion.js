const fs = require('fs');
const path = require('path');

// =====================================================
// Script para extraer imágenes base64 del JSON
// y guardarlas como archivos en /images/
// =====================================================

const CONFIG = {
    booksJsonPath: './books.json',
    outputDir: './images',
    backupJsonPath: './books.backup.json'
};

// Función para normalizar nombres de archivo
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

// Cargar books.json
function loadBooks() {
    try {
        const booksData = fs.readFileSync(CONFIG.booksJsonPath, 'utf8');
        return JSON.parse(booksData);
    } catch (error) {
        console.error('❌ Error al leer books.json:', error.message);
        process.exit(1);
    }
}

// Crear backup del JSON original
function createBackup(books) {
    try {
        fs.writeFileSync(
            CONFIG.backupJsonPath, 
            JSON.stringify(books, null, 2), 
            'utf8'
        );
        console.log('✅ Backup creado:', CONFIG.backupJsonPath);
    } catch (error) {
        console.error('❌ Error creando backup:', error.message);
        process.exit(1);
    }
}

// Crear directorio de imágenes si no existe
function ensureImagesDirectory() {
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        console.log('📁 Directorio creado:', CONFIG.outputDir);
    }
}

// Detectar el tipo MIME de la imagen base64
function detectMimeType(base64String) {
    const match = base64String.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/);
    return match ? match[1] : 'jpg';
}

// Extraer y guardar imágenes
function extractImages() {
    const books = loadBooks();
    
    console.log('\n🚀 Iniciando extracción de imágenes...\n');
    console.log(`📦 Total de libros: ${books.length}\n`);
    
    // Crear backup
    createBackup(books);
    
    // Asegurar directorio de imágenes
    ensureImagesDirectory();
    
    let totalImages = 0;
    let processedBooks = 0;
    const extractionLog = [];
    
    books.forEach((book, bookIndex) => {
        const titleNorm = normalizeFileName(book.title);
        const authorNorm = normalizeFileName(book.author);
        const baseName = `${titleNorm}_${authorNorm}`;
        
        let bookImages = [];
        
        // Caso 1: Array de imágenes (images)
        if (book.images && Array.isArray(book.images)) {
            bookImages = book.images;
        }
        // Caso 2: Imagen única (imageFile)
        else if (book.imageFile && typeof book.imageFile === 'string') {
            bookImages = [book.imageFile];
        }
        
        // Filtrar solo imágenes base64
        const base64Images = bookImages.filter(img => 
            typeof img === 'string' && img.startsWith('data:image')
        );
        
        if (base64Images.length === 0) {
            console.log(`⏭️  Libro #${book.id}: "${book.title}" - Sin imágenes base64`);
            return;
        }
        
        console.log(`📖 Libro #${book.id}: "${book.title}"`);
        processedBooks++;
        
        base64Images.forEach((base64Img, imgIndex) => {
            try {
                // Detectar tipo de imagen
                const extension = detectMimeType(base64Img);
                
                // Nombre del archivo
                const fileName = `${baseName}_${imgIndex + 1}.${extension}`;
                const filePath = path.join(CONFIG.outputDir, fileName);
                
                // Extraer datos base64
                const base64Data = base64Img.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Guardar archivo
                fs.writeFileSync(filePath, buffer);
                
                totalImages++;
                const fileSize = (buffer.length / 1024).toFixed(2);
                
                console.log(`   ✅ ${fileName} (${fileSize} KB)`);
                
                extractionLog.push({
                    bookId: book.id,
                    bookTitle: book.title,
                    fileName: fileName,
                    filePath: filePath,
                    size: fileSize
                });
                
            } catch (error) {
                console.error(`   ❌ Error extrayendo imagen ${imgIndex + 1}:`, error.message);
            }
        });
        
        console.log('');
    });
    
    // Resumen
    console.log('='.repeat(70));
    console.log(`✅ Extracción completada`);
    console.log(`📚 Libros procesados: ${processedBooks}`);
    console.log(`🖼️  Imágenes extraídas: ${totalImages}`);
    console.log(`📁 Directorio: ${CONFIG.outputDir}`);
    console.log('='.repeat(70));
    
    // Guardar log
    const logPath = './extraction-log.json';
    fs.writeFileSync(logPath, JSON.stringify(extractionLog, null, 2), 'utf8');
    console.log(`\n📄 Log detallado guardado en: ${logPath}`);
    
    // Generar nuevo JSON limpio (sin imágenes base64)
    generateCleanJson(books);
}

// Generar nuevo books.json sin imágenes base64
function generateCleanJson(books) {
    const cleanBooks = books.map(book => {
        // Eliminar campos de imágenes base64
        const { images, imageFile, ...cleanBook } = book;
        return cleanBook;
    });
    
    const cleanJsonPath = './books.clean.json';
    fs.writeFileSync(
        cleanJsonPath, 
        JSON.stringify(cleanBooks, null, 2), 
        'utf8'
    );
    
    console.log(`\n✅ JSON limpio generado: ${cleanJsonPath}`);
    console.log(`\n💡 Próximos pasos:`);
    console.log(`   1. Revisa las imágenes en ${CONFIG.outputDir}/`);
    console.log(`   2. Renombra si es necesario (ej: cambiar .jpeg a .jpg)`);
    console.log(`   3. Reemplaza books.json con books.clean.json`);
    console.log(`   4. cp books.clean.json books.json`);
    console.log(`   5. Actualiza el sitio con el nuevo script.js\n`);
}

// Ejecutar
try {
    extractImages();
} catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
}