// generate-urls-facebook.js
const fs = require('fs');

const CONFIG = {
    githubUser: 'jaimeehd',
    repoName: 'bookstore',
    totalBooks: 55
};

const BASE_URL = `https://${CONFIG.githubUser}.github.io/${CONFIG.repoName}`;

// Generar lista con espacios
const urls = [];
for (let i = 1; i <= CONFIG.totalBooks; i++) {
    urls.push(`${BASE_URL}/libro-${i}.html`);
}

// Unir con espacios
const urlsWithSpaces = urls.join(' ');

console.log('📋 URLs para Facebook Batch Invalidator (separadas por espacio):\n');
console.log('='.repeat(70));
console.log(urlsWithSpaces);
console.log('='.repeat(70));
console.log(`\n✅ Total: ${CONFIG.totalBooks} URLs generadas`);

// Guardar en archivo
fs.writeFileSync('facebook-urls-spaces.txt', urlsWithSpaces, 'utf8');
console.log('\n💾 URLs guardadas en: facebook-urls-spaces.txt');

console.log('\n📝 Instrucciones:');
console.log('   1. Copia todo el contenido de arriba (entre las líneas)');
console.log('   2. Ve a: https://developers.facebook.com/tools/debug/sharing/batch/');
console.log('   3. Pega las URLs en el campo de texto');
console.log('   4. Haz clic en "Debug"');
console.log('   5. ESPERA 5 minutos');
console.log('   6. REPITE el proceso (mismo contenido, mismo botón)');
console.log('   7. ¡Listo! Todas las URLs estarán cacheadas\n');