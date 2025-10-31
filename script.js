// --- ELEMENTOS HTML ---
const menu = document.getElementById("menuLinks");
const closeIcon = document.getElementById("closeMenuIcon");
const openIcon = document.getElementById("openMenuIcon");
const views = document.querySelectorAll('.page-view'); 

const gameModal = document.getElementById('gameModal');
const modalContent = document.getElementById('modalContent');

const secretClockModal = document.getElementById('secretClockModal');
const secretTimeInput = document.getElementById('secretTimeInput');
const secretMessage = document.getElementById('secretMessage');

const meliGif = document.getElementById('meliGif');

// Variables para la nueva funcionalidad de recompensa
const rewardButton = document.getElementById('rewardButton');
const videoRewardModal = document.getElementById('videoRewardModal');
const secretVideoPlayer = document.getElementById('secretVideoPlayer');
const secretCodeDisplay = document.getElementById('secretCodeDisplay');
const copyMessage = document.getElementById('copyMessage');
const copyButton = document.getElementById('copyButton'); 

// Variables del sistema de movimiento avanzado del GIF
let meliState = 'hidden'; // 'hidden', 'moving', 'disappearing', 'clicked'
let meliAnimationId = null;
let meliMoveStartTime = 0;

// 🚨 CONSTANTES MODIFICADAS
const MELI_VISIBLE_DURATION = 6 * 1000; // 6 segundos visible
const MELI_REAPPEAR_DELAY = 16 * 60 * 1000; // 16 minutos de espera para reaparecer
const MELI_SIZE = 100; // Debe coincidir con el CSS

let meliTargetX = 0;
let meliTargetY = 0;
let meliCurrentX = 0;
let meliCurrentY = 0;


// ====================================================================
// --- MANEJO DE VISTAS Y MENÚ ---
// ====================================================================

function toggleMenu() {
    if (window.innerWidth >= 768) return; 
    menu.classList.toggle('open');
    openIcon.style.display = menu.classList.contains('open') ? 'none' : 'block';
    closeIcon.style.display = menu.classList.contains('open') ? 'block' : 'none';
}

function closeMenu() {
    if (window.innerWidth < 768) { 
        menu.classList.remove('open');
        openIcon.style.display = 'block';
        closeIcon.style.display = 'none';
    }
}

function showView(viewId) {
    views.forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    closeMenu(); // Cierra el menú en móvil después de la navegación
}

function reloadIframe(iframeId) {
    const iframe = document.getElementById(iframeId);
    if (iframe) {
        iframe.src = iframe.src; 
    }
}

window.addEventListener('resize', function() {
    if (window.innerWidth >= 768) {
        menu.classList.remove('open');
        openIcon.style.display = 'none';
        closeIcon.style.display = 'none';
    } else {
         if(menu.classList.contains('open')) {
            openIcon.style.display = 'none';
            closeIcon.style.display = 'block';
        } else {
            openIcon.style.display = 'block';
            closeIcon.style.display = 'none';
        }
    }
});

// --- MANEJO DE MODALES Y CLIC FUERA ---
function openGameModal(htmlContent) {
     modalContent.innerHTML = htmlContent; 
    gameModal.style.display = "block";    
    document.body.style.overflow = "hidden"; 
}

function closeGameModal() { 
     gameModal.style.display = "none";     
    document.body.style.overflow = "auto";  
} 

window.onclick = function(event) {
    if (event.target === gameModal) { 
        closeGameModal();
    } else if (event.target === secretClockModal) {
        closeSecretClockModal();
    } 
}


// ====================================================================
// --- LÓGICA DEL RELOJ SECRETO (Meli GIF) - MOVIMIENTO AVANZADO ---
// ====================================================================

function closeSecretClockModal() {
    secretClockModal.style.display = "none";
    document.body.style.overflow = "auto";
    secretMessage.textContent = ""; 
    secretTimeInput.value = ""; 
}

function checkSecretTime() {
    const secretTime = secretTimeInput.value;
    const targetTime = "03:30"; // La hora mágica
    
    if (secretTime === targetTime) {
        secretMessage.textContent = "¡Hora mágica encontrada! Recompensa desbloqueada...";
        secretMessage.style.color = "#4CAF50"; 
        
        // 🚨 Acción CLAVE: Llama a la función de desbloqueo del botón
        unlockRewardButton(); 
        
        setTimeout(() => {
            closeSecretClockModal();
            showView('home'); 
        }, 1500); 
        
    } else {
        secretMessage.textContent = "¡Hora incorrecta! Inténtalo de nuevo.";
        secretMessage.style.color = "#E74C3C"; 
    }
}

function getNewRandomTarget() {
    const maxX = window.innerWidth - MELI_SIZE;
    const maxY = window.innerHeight - MELI_SIZE;

    meliTargetX = Math.max(0, Math.floor(Math.random() * maxX));
    meliTargetY = Math.max(0, Math.floor(Math.random() * maxY));
}

function animateMeli() {
    if (meliState !== 'moving') {
        cancelAnimationFrame(meliAnimationId);
        return;
    }

    meliCurrentX += (meliTargetX - meliCurrentX) * 0.05; 
    meliCurrentY += (meliTargetY - meliCurrentY) * 0.05; 

    meliGif.style.transform = `translate(${meliCurrentX}px, ${meliCurrentY}px)`;

    const distance = Math.sqrt(Math.pow(meliTargetX - meliCurrentX, 2) + Math.pow(meliTargetY - meliCurrentY, 2));
    
    if (distance < 5) { 
        getNewRandomTarget();
    }
    
    // 🚨 NOTA: Se mantiene esta verificación, pero el setTimeout en startMeliAppearance
    // es más preciso para los 6 segundos fijos.
    if (Date.now() - meliMoveStartTime > MELI_VISIBLE_DURATION) {
        startMeliDisappearance();
        return;
    }

    meliAnimationId = requestAnimationFrame(animateMeli);
}


function startMeliAppearance() {
    if (meliState === 'clicked') return;
    
    meliState = 'moving';
    
    getNewRandomTarget();
    meliCurrentX = meliTargetX;
    meliCurrentY = meliTargetY;
    
    meliGif.style.transition = 'none'; 
    meliGif.style.transform = `translate(${meliCurrentX}px, ${meliCurrentY}px) scale(1)`; 
    meliGif.style.opacity = '1';
    meliGif.style.display = 'block';
    
    meliMoveStartTime = Date.now();
    animateMeli();

    // 🚨 CAMBIO CLAVE: Fuerza la desaparición después de los 6 segundos
    setTimeout(() => {
        if (meliState === 'moving') {
            startMeliDisappearance();
        }
    }, MELI_VISIBLE_DURATION);
}

function startMeliDisappearance() {
    // Evita bucles si ya está en proceso o en estado 'clicked'
    if (meliState === 'disappearing' || meliState === 'clicked') return; 

    meliState = 'disappearing';
    cancelAnimationFrame(meliAnimationId);
    
    meliGif.style.transition = 'opacity 0.5s ease-out'; 
    meliGif.style.opacity = '0';

    setTimeout(() => {
        meliGif.style.display = 'none';
        
        // 🚨 CAMBIO CLAVE: Usa el retardo fijo de 16 minutos
        const nextAppearanceTime = MELI_REAPPEAR_DELAY; 
        
        meliState = 'hidden';
        
        setTimeout(() => {
            startMeliAppearance();
        }, nextAppearanceTime);
        
        console.log(`Meli desaparecerá por ${nextAppearanceTime / 60000} minutos.`);
    }, 500); 
}

function meliClickInteraction() {
    if (meliState === 'clicked' || meliState === 'disappearing') return; 

    meliState = 'clicked';
    cancelAnimationFrame(meliAnimationId);
    
    const centerX = window.innerWidth / 2 - MELI_SIZE / 2;
    const centerY = window.innerHeight / 2 - MELI_SIZE / 2;
    
    meliGif.style.transition = 'transform 0.5s ease-in, opacity 0.5s ease-in';
    meliGif.style.transform = `translate(${centerX}px, ${centerY}px) scale(1.5)`;
    meliGif.style.opacity = '0';
    
    setTimeout(() => {
        meliGif.style.display = 'none';
        meliGif.style.transform = `translate(0px, 0px) scale(1)`; 
        meliGif.style.transition = 'none'; 

        if (gameModal.style.display !== 'block') {
            secretClockModal.style.display = "block";
            document.body.style.overflow = "hidden";
        }
        
        // 🚨 NOTA: Se mantiene la lógica de reaparición aleatoria (2-6 min) 
        // después de una interacción (clic), diferente a la lógica de tiempo fijo (16 min).
        const minDelay = 2 * 60 * 1000; 
        const maxDelay = 6 * 60 * 1000; 
        const nextAppearanceTime = Math.random() * (maxDelay - minDelay) + minDelay;
        
        meliState = 'hidden'; 
        
        setTimeout(() => {
            startMeliAppearance();
        }, nextAppearanceTime);

    }, 500); 
}

meliGif.addEventListener('click', meliClickInteraction);


// ====================================================================
// --- LÓGICA DEL BOTÓN DE RECOMPENSA SECRETO ($) ---
// ====================================================================

function unlockRewardButton() {
    // 🚨 CAMBIO CLAVE: Quita la clase 'hidden' para mostrar el botón
    rewardButton.classList.remove('hidden'); 
    // 2. Almacenar el estado para que persista
    localStorage.setItem('rewardUnlocked', 'true'); 
    // Opcional: Agregar una clase para darle un efecto visual al aparecer
    rewardButton.classList.add('unlocked-flash'); 
}

function openSecretReward() {
    closeMenu(); 
    
    // 1. Ocultar el contenido de texto antes de empezar el video
    document.getElementById('videoContent').style.display = 'block';
    // Oculta el mensaje "¡Sorpresa!" y el contenido de video para que solo el reproductor sea visible al inicio
    document.querySelector('#videoContent h2').style.display = 'none'; 
    secretCodeDisplay.style.display = 'none';
    copyMessage.style.display = 'none';
    
    videoRewardModal.style.display = "block";
    document.body.style.overflow = "hidden";
    
    // 🚨 CAMBIOS CLAVE PARA EL VIDEO:
    secretVideoPlayer.load();
    secretVideoPlayer.play().catch(error => {
        console.error("Error al intentar reproducir el video automáticamente:", error);
    });
    // Deshabilitar controles y la posibilidad de pausar haciendo clic
    secretVideoPlayer.controls = false; 
    secretVideoPlayer.addEventListener('click', preventVideoPause); // Evita pausa al clic
}

function preventVideoPause(event) {
    event.preventDefault();
    event.stopPropagation();
    secretVideoPlayer.play(); // Asegura que siga reproduciéndose si intentan pausar
}


function closeVideoRewardModal() {
    secretVideoPlayer.pause();
    secretVideoPlayer.currentTime = 0; 
    secretVideoPlayer.removeEventListener('click', preventVideoPause); // Limpia el listener
    
    videoRewardModal.style.display = "none";
    document.body.style.overflow = "auto";
    
    // Opcional: Volver al inicio después de cerrar el modal
    showView('home');
}

// Escuchar el evento de finalización del video para mostrar el código
secretVideoPlayer.addEventListener('ended', () => {
    document.getElementById('videoContent').style.display = 'none';
    secretCodeDisplay.style.display = 'block';
    
    // Opcional: Cerrar el modal de recompensa automáticamente después de X segundos de mostrar el código
    setTimeout(() => {
        closeVideoRewardModal();
    }, 5000); // Muestra el código por 5 segundos antes de cerrar
});

function copySecretCode() {
    const code = document.getElementById('secretCodeText').textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        copyMessage.textContent = '¡Copiado al portapapeles!';
        copyMessage.style.color = '#2ECC71'; 
        copyMessage.style.display = 'block';
        setTimeout(() => {
            copyMessage.style.display = 'none';
        }, 2000);
    }).catch(err => {
        console.error('Error al intentar copiar:', err);
        copyMessage.textContent = 'Error al copiar. Copie manualmente.';
        copyMessage.style.color = '#E74C3C'; 
        copyMessage.style.display = 'block';
    });
}

rewardButton.addEventListener('click', openSecretReward);
if (copyButton) {
    copyButton.addEventListener('click', copySecretCode);
}


// --- MODAL INFO DE JUEGOS (Contenido) --- 
function openSnakeInfoModal() { openGameModal(`<h1>¡Snake!</h1><h2>El Clásico Juego de la Víborita</h2><p>Este juego es el clásico de los teléfonos viejos con <strong>3 modalidades</strong> de velocidad para desafiar tu habilidad:</p><ul><li><strong>Lento</strong> (Fácil)</li><li><strong>Normal</strong> (Medio)</li><li><strong>Rápido</strong> (Difícil)</li></ul><h2>Clasificación Mundial (¡Récords Globales!)</h2><p>Para poder registrar tu puntuación en la tabla clasificatoria solo necesitas iniciar sesión. Solo se pide:</p><ul><li><strong>Nombre de usuario</strong></li><li><strong>Contraseña</strong> (Recuerden no olvidarlas)</li></ul><p class="important">* ¡Importante! Necesitas internet para el registro de récords. *</p><h2>Tabla Clasificatoria</h2><p>Puedes ver la tabla de clasificación completa en el menú principal de Snake.</p>`); } 
function openBuscaminasInfoModal() { openGameModal(`<h1>💣 Buscaminas | Modo Extremo</h1><h2>🚨 El Desafío de Récord</h2><p>Esta versión está configurada para una única, pero extrema, partida de alta dificultad:</p><ul><li>Dimensiones: 30 Columnas x 29 Filas</li><li>Minas: 99 Bombas Totales</li><li>Meta: Conseguir el menor tiempo posible para despejar todas las celdas seguras y establecer un nuevo récord mundial.</li></ul><h2>📱 Mecánica de Juego Táctil</h2><p>El juego está optimizado para pantallas táctiles y dispositivos móviles. Las acciones se realizan mediante un menú flotante al tocar una celda:</p><ul><li>Tocar Celda: Abre el menú de acciones.</li><li>⛏️ (Pico): Destapar. Destapa la celda seleccionada (equivalente al "clic izquierdo").</li><li>🚩 (Bandera): Marcar. Coloca o quita una bandera (equivalente al "clic derecho").</li></ul><h2>🏆 Envío de Tiempos a la Clasificación Global</h2><p>Para que tus victorias se registren en la tabla de récords mundial, solo necesitas iniciar sesión <strong>una única vez</strong>. Los datos necesarios son:</p><ul><li>Nombre de Usuario (El nombre que aparecerá en el ranking).</li><li>Contraseña (Recomendamos guardarla para futuros accesos).</li></ul><p class="important-buscaminas">🚩 ¡CLAVE! Solo los tiempos obtenidos en partidas ganadas mientras la sesión está activa serán enviados y validados en línea.</p><h2>🔗 Ver la Tabla de Récords</h2><p>¿Quién es el más rápido del mundo en esta configuración (30 x 29 / 99 Minas)? ¡Compruébalo en el ranking oficial!</p><p class="alert-mine-buscaminas">⚠️ ADVERTENCIA: Este modo es brutal. ¡Prepárate mentalmente para el sonido del "¡BOOM!" y no te rindas!</p>`); } 
function openTetrisInfoModal() { openGameModal(`<h1>¡Tetris!</h1><p class="tetris-status">Actualmente está en desarrollo</p><h2>Pronto Disponible</h2><p>El juego de Tetris es uno de los próximos proyectos que estará disponible en la web y como App descargable.</p><p>Podrás encontrar la información de sus récords y cómo jugarlo una vez esté finalizado.</p>`); } 
function openNavalInfoModal() { openGameModal(`<h1>Batalla Naval ONLINE</h1><p class="naval-status">En proceso de creación</p><h2>Objetivo: Multijugador en Línea</h2><p>Esta es una idea experimental y ambiciosa. La idea es hacer que puedas jugar en línea Batalla naval <strong>aleatoriamente</strong>, pero también podrías elegir con quién jugar (invitar a amigos).</p><h2>Implementación</h2><p>Los enlaces para jugar en la web y descargar la App se habilitarán una vez que la fase de desarrollo multijugador esté estable y lista para pruebas beta.</p>`); } 
function openWcoartlInfoModal() { openGameModal(`<h1>Wcoartl</h1><h2 style="color: var(--color-wcoartl); border-bottom: none; text-align: left; font-size: 1.3em;">Proyecto de Gran Ambición</h2><p style="font-size: 1.2em; font-style: italic;">Esta es una idea experimental y súper ambiciosa.</p><p>Tendrá un <strong>Lore profundo</strong> y su jugabilidad mezclará elementos de <a href="https://es.wikipedia.org/wiki/Geometry_Dash" target="_blank" style="color: var(--color-link-azul);">Geometry Dash</a> y <a href="https://es.wikipedia.com/wiki/Undertale" target="_blank" style="color: var(--color-link-azul);">Undertale</a>.</p><p class="wcoartl-status">¡El desarrollo de este juego es definitivo!</p><h2 style="color: var(--color-wcoartl);">Descarga y Web</h2><p>Los enlaces para jugar en la web y descargar la App están en <strong>implementación</strong>. Sigue las noticias en mis redes sociales para saber cuándo estarán disponibles.</p>`); }


// --- INICIALIZACIÓN FINAL ---
document.addEventListener('DOMContentLoaded', () => {
    const initialView = window.location.hash.substring(1) || 'home';
    showView(initialView);
    
    // 🚨 MANEJO DEL BOTÓN DE RECOMPENSA AL CARGAR
    if (localStorage.getItem('rewardUnlocked') === 'true') {
        rewardButton.classList.remove('hidden'); // Lo muestra si ya está desbloqueado
    } else {
        rewardButton.classList.add('hidden'); // Lo mantiene oculto por defecto
    }

    startMeliAppearance(); 
});
