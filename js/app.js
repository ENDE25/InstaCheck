// Limpiar el campo ZIP al cargar la página
window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('zipfile').value = '';
});

let followersData = null;
let followingData = null;
const zipInput = document.getElementById('zipfile');
const compareBtn = document.getElementById('compare');
const resultsDiv = document.getElementById('results');

zipInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    resultsDiv.innerHTML = '';
    followersData = null;
    followingData = null;
    compareBtn.disabled = true;
    JSZip.loadAsync(file).then(function(zip) {
        // Buscar los archivos en cualquier subcarpeta
        let followersPromise = null;
        let followingPromise = null;
        zip.forEach(function (relativePath, zipEntry) {
            if (relativePath.endsWith('followers_1.json')) {
                followersPromise = zipEntry.async('string');
            }
            if (relativePath.endsWith('following.json')) {
                followingPromise = zipEntry.async('string');
            }
        });
        if (!followersPromise || !followingPromise) {
            resultsDiv.innerHTML = '<div class="alert alert-danger">No se encontraron ambos archivos followers_1.json y following.json en el ZIP.</div>';
            return;
        }
        Promise.all([followersPromise, followingPromise]).then(function([followersText, followingText]) {
            try {
                followersData = JSON.parse(followersText);
                followingData = JSON.parse(followingText);
                compareBtn.disabled = false;
                resultsDiv.innerHTML = '<div class="alert alert-success">Archivos cargados correctamente. Pulsa "Comparar" para ver los resultados.</div>';
            } catch {
                resultsDiv.innerHTML = '<div class="alert alert-danger">Error al leer los archivos JSON.</div>';
            }
        });
    }).catch(function() {
        resultsDiv.innerHTML = '<div class="alert alert-danger">No se pudo abrir el archivo ZIP.</div>';
    });
});

compareBtn.addEventListener('click', function() {
    if (!followersData || !followingData) return;
    const followers = new Set(followersData.map(obj => obj.string_list_data[0].value));
    const following = new Set(followingData.relationships_following.map(obj => obj.string_list_data[0].value));
    const notFollowedBack = Array.from(following).filter(user => !followers.has(user));
    const notFollowingBack = Array.from(followers).filter(user => !following.has(user));
    let html = '';
    html += '<div class="result mb-4"><h2 class="h6">Usuarios que sigues y no te siguen:</h2>';
    html += notFollowedBack.length ? '<ul>' + notFollowedBack.map(u => `<li><a href="https://www.instagram.com/${u}/" target="_blank" rel="noopener" class="link-dark">${u}</a></li>`).join('') + '</ul>' : '<p class="text-success">Ninguno</p>';
    html += '</div>';
    html += '<div class="result mb-4"><h2 class="h6">Usuarios que te siguen y no sigues:</h2>';
    html += notFollowingBack.length ? '<ul>' + notFollowingBack.map(u => `<li><a href="https://www.instagram.com/${u}/" target="_blank" rel="noopener" class="link-dark">${u}</a></li>`).join('') + '</ul>' : '<p class="text-success">Ninguno</p>';
    html += '</div>';
    resultsDiv.innerHTML = html;
});
