const firebaseConfig = {
    apiKey: "AIzaSyBcAqXK3qFD8j1T7h6cjO0U3d5nBoVAgVk",
    authDomain: "procesador-56b7a.firebaseapp.com",
    projectId: "procesador-56b7a",
    storageBucket: "procesador-56b7a.firebasestorage.app",
    messagingSenderId: "1029072924025",
    appId: "1:1029072924025:web:c32d735e453416ecfd93a8",
    measurementId: "G-WCBZTBPXZ4"
};

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzIvOkpHvTPTKY-zvEJ_ab0tkqOOd0tRBkvPJNFM5PVf2Z0d0tRBkvPJNFM5PVrQ/exec';

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const sidebar = document.getElementById("mySidebar");
const menuOverlay = document.getElementById("menuOverlay");
const loginText = document.getElementById('loginText');
const profilePhoto = document.getElementById('profilePhoto');
const profileIcon = document.getElementById('profileIcon');
const logoutLink = document.getElementById('logoutLink');
const sidebarProfileSection = document.getElementById('sidebarProfileSection');
const views = document.querySelectorAll('.main-content');
const authModal = document.getElementById('authModal');
const backButton = document.querySelector('.back-button');

const contentGallery = document.getElementById('contentGallery');
const loadingMessage = document.getElementById('loadingMessage');
let allContentData = [];

const profileAvatar = document.getElementById('profileAvatar');
const profileBannerArea = document.getElementById('profileBannerArea');
const displayNameInput = document.getElementById('displayNameInput');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const profileStatus = document.getElementById('profileStatus');

const DEFAULT_AVATAR = "https://via.placeholder.com/70/363a45/FFFFFF?text=G";
const DEFAULT_BANNER_COLOR = "#444";

let screenHistory = ['home-screen'];

const GIF_DURATION = 120;
const MELI_GIF_CONTAINER = document.getElementById('meliGifContainer');
const LOCAL_CLOCK_DISPLAY = document.getElementById('localClock');
let intervalTimer;
let gifTimeout;


function updateMeliTimer() {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    if (LOCAL_CLOCK_DISPLAY) {
        LOCAL_CLOCK_DISPLAY.textContent = `${now.toLocaleTimeString()}`;
        LOCAL_CLOCK_DISPLAY.style.textAlign = 'right';
        LOCAL_CLOCK_DISPLAY.style.flexGrow = '1';
    }

    const isGifWindow = (minutes % 20) === 0 && seconds < GIF_DURATION;

    if (MELI_GIF_CONTAINER) {
        if (isGifWindow) {
            MELI_GIF_CONTAINER.style.display = 'block';

            const remainingGifTime = GIF_DURATION - seconds;

            if (!gifTimeout) {
                gifTimeout = setTimeout(() => {
                    MELI_GIF_CONTAINER.style.display = 'none';
                    gifTimeout = null;
                    updateMeliTimer();
                }, (remainingGifTime) * 1000);
            }
        } else {
            MELI_GIF_CONTAINER.style.display = 'none';
            clearTimeout(gifTimeout);
            gifTimeout = null;
        }
    }
}

function startMeliTimerLogic() {
    updateMeliTimer();
    intervalTimer = setInterval(updateMeliTimer, 1000);
}

function isMobile() {
    return window.innerWidth < 900;
}

function closeMenu() {
    if (isMobile() && sidebar.classList.contains('open')) {
        sidebar.style.width = "0";
        sidebar.classList.remove('open');
        menuOverlay.style.display = "none";
    }
}

function toggleMenu() {
    if (isMobile()) {
        if (sidebar.classList.contains('open')) {
            closeMenu();
        } else {
            sidebar.style.width = "250px";
            sidebar.classList.add('open');
            menuOverlay.style.display = "block";
        }
    }
}

function showScreen(screenId) {
    if (isMobile()) {
        closeMenu();
    }

    document.querySelectorAll('.game-options').forEach(options => {
        options.style.display = 'none';
    });
    document.querySelectorAll('.game-item-container').forEach(container => {
        container.classList.remove('options-open');
    });

    views.forEach(view => {
        view.classList.remove('active');
    });
    const activeView = document.getElementById(screenId);
    activeView.classList.add('active');

    if (screenHistory[screenHistory.length - 1] !== screenId) {
        screenHistory.push(screenId);
    }

    if (screenId === 'home-screen' || screenHistory.length <= 1) {
        backButton.style.display = 'none';
    } else {
        backButton.style.display = 'block';
    }

    if (screenId === 'home-screen') {
        loadContent();
    }

    if (screenId === 'profile-screen') {
        if (auth.currentUser) {
            loadUserProfileData(auth.currentUser);
        } else {
            showScreen('home-screen');
            openAuthModal();
        }
    }
}

function goBack() {
    if (screenHistory.length > 1) {
        screenHistory.pop();
    }

    const previousScreenId = screenHistory[screenHistory.length - 1];

    views.forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(previousScreenId).classList.add('active');

    if (previousScreenId === 'home-screen' || screenHistory.length <= 1) {
        backButton.style.display = 'none';
    } else {
        backButton.style.display = 'block';
    }

    document.querySelectorAll('.game-options').forEach(options => {
        options.style.display = 'none';
    });
    document.querySelectorAll('.game-item-container').forEach(container => {
        container.classList.remove('options-open');
    });

    closeMenu();
}

function toggleGameOptions(gameId) {
    const optionsElement = document.getElementById(`${gameId}-options`);
    const containerElement = document.getElementById(`${gameId}-container`);

    if (!optionsElement || !containerElement) return;

    document.querySelectorAll('.game-options').forEach(options => {
        if (options.id !== optionsElement.id) {
            options.style.display = 'none';
        }
    });
    document.querySelectorAll('.game-item-container').forEach(container => {
        if (container.id !== containerElement.id) {
            container.classList.remove('options-open');
        }
    });

    const isVisible = optionsElement.style.display === 'flex';

    if (isVisible) {
        optionsElement.style.display = 'none';
        containerElement.classList.remove('options-open');
    } else {
        optionsElement.style.display = 'flex';
        containerElement.classList.add('options-open');
    }
}

function handleProfileClick() {
    const user = auth.currentUser;
    if (user) {
        showScreen('profile-screen');
    } else {
        openAuthModal();
    }
}

function closeModalOnOutsideClick(event) {
    if (event.target === authModal) {
        closeAuthModal();
    }

    const gameModals = document.querySelectorAll('.game-modal');
    gameModals.forEach(modal => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
}

function initializeApp() {
    if (window.innerWidth >= 900) {
        sidebar.style.width = "250px";
        sidebar.classList.add('open');
    }

    if (!document.querySelector('.main-content.active')) {
        showScreen('home-screen');
    }

    sidebar.addEventListener('click', (event) => {
        if (sidebar.classList.contains('open')) {
            event.stopPropagation();
        }
    });

    if (screenHistory[0] !== 'home-screen') {
        screenHistory = ['home-screen'];
    }

    startMeliTimerLogic();
}

function openAuthModal() {
    closeMenu();
    authModal.style.display = "flex";
    document.getElementById('modalTitle').textContent = 'Elige cómo iniciar sesión';
    document.getElementById('authMessage').style.display = 'none';
}

function closeAuthModal() {
    authModal.style.display = "none";
}

function displayAuthMessage(message, isError) {
    const authMessage = document.getElementById('authModal').querySelector('.auth-message');
    authMessage.textContent = message;
    authMessage.className = 'auth-message';
    if (isError) {
        authMessage.classList.add('error');
    }
    authMessage.style.display = 'block';
}

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
        .then(() => {
            closeAuthModal();
        })
        .catch((error) => {
            let errorMessage = 'Error al iniciar sesión con Google. Inténtalo de nuevo.';
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'La ventana de inicio de sesión fue cerrada.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = 'El inicio de sesión fue cancelado. No se permite abrir múltiples ventanas emergentes.';
            }
            console.error("Error de autenticación con Google:", error);
            displayAuthMessage(errorMessage, true);
        });
}

function logout() {
     auth.signOut()
        .then(() => {
            closeMenu();
            screenHistory = ['home-screen'];
            showScreen('home-screen');
        })
        .catch((error) => { console.error('Error al cerrar sesión:', error); });
}

function getLocalStorageKey(uid, type) {
    if (type === 'avatar') {
        return `user_${uid}_avatarDataURL`;
    } else if (type === 'banner') {
        return `user_${uid}_bannerDataURL`;
    }
    return null;
}

function displayLocalImage(file, elementId, type) {
    const user = auth.currentUser;
    if (!file || !user) {
        displayProfileStatus('Error: Debes iniciar sesión para subir imágenes.', true);
        return;
    }

    const reader = new FileReader();
    const storageKey = getLocalStorageKey(user.uid, type);

    reader.onload = function(e) {
        const dataUrl = e.target.result;

        if (type === 'avatar') {
            profileAvatar.src = dataUrl;

            profilePhoto.src = dataUrl;
            profilePhoto.classList.remove('hidden');
            profileIcon.style.display = 'none';
        } else if (type === 'banner') {
            profileBannerArea.style.backgroundImage = `url('${dataUrl}')`;
            profileBannerArea.style.backgroundColor = 'transparent';
        }

        localStorage.setItem(storageKey, dataUrl);
        displayProfileStatus(`✅ ${type === 'avatar' ? 'Ícono' : 'Banner'} de perfil actualizado localmente.`, false);
    };

    reader.onerror = function() {
        displayProfileStatus('❌ Error al leer el archivo local. Intenta con otra imagen.', true);
    }

    reader.readAsDataURL(file);
}

async function loadUserProfileData(user) {
    if (!user) return;

    const uid = user.uid;
    const displayName = user.displayName || user.email.split('@')[0];
    displayNameInput.value = displayName;
    userEmailDisplay.textContent = user.email;

    displayProfileStatus('', false);

    const initialChar = displayName.charAt(0).toUpperCase();

    const localAvatarKey = getLocalStorageKey(uid, 'avatar');
    const localBannerKey = getLocalStorageKey(uid, 'banner');

    const localAvatarUrl = localStorage.getItem(localAvatarKey);
    const localBannerUrl = localStorage.getItem(localBannerKey);

    const avatarUrl = localAvatarUrl || user.photoURL || null;

    if (avatarUrl) {
        profilePhoto.src = avatarUrl;
        profilePhoto.classList.remove('hidden');
        profileIcon.style.display = 'none';
    } else {
        profilePhoto.src = '';
        profilePhoto.classList.add('hidden');
        profileIcon.style.display = 'block';
    }

    profileAvatar.src = avatarUrl || `https://via.placeholder.com/100/363a45/FFFFFF?text=${initialChar}`;

    if (localBannerUrl) {
        profileBannerArea.style.backgroundImage = `url('${localBannerUrl}')`;
        profileBannerArea.style.backgroundColor = 'transparent';
    } else {
        profileBannerArea.style.backgroundImage = 'none';
        profileBannerArea.style.backgroundColor = DEFAULT_BANNER_COLOR;
    }
}

async function updateUserProfile() {
    const user = auth.currentUser;
    const newName = displayNameInput.value.trim();

    if (!user) {
        displayProfileStatus('Error: Debes iniciar sesión para actualizar tu perfil.', true);
        return;
    }

    try {
        await user.updateProfile({ displayName: newName });
        loginText.textContent = newName;

        loadUserProfileData(user);

        displayProfileStatus('✅ Nombre de usuario actualizado con éxito.', false);
    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        displayProfileStatus(`❌ Error al actualizar el perfil: ${error.message}`, true);
    }
}

function displayProfileStatus(message, isError) {
    profileStatus.textContent = message;
    profileStatus.className = 'status-' + (isError ? 'error' : 'success');
    profileStatus.style.display = message ? 'block' : 'none';
}

function renderContentCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';

    const fileURL = item.fileURL || '';

    let mediaElement;
    const isVideo = item.fileType && item.fileType.startsWith('video/');
    const defaultPreview = `https://via.placeholder.com/300x250/333/ccc?text=${isVideo ? 'Video' : 'Media'}`;

    if (isVideo) {
        mediaElement = `<div class="card-media" style="background-image: url('${defaultPreview}'); display: flex; align-items: center; justify-content: center;">
                            <a href="${item.fileURL.replace('=s300', '')}" target="_blank" style="color: white; font-size: 2em;"><i class="fas fa-play-circle"></i></a>
                        </div>`;
    } else {
        mediaElement = `<img class="card-media" src="${fileURL}" alt="${item.title}" onclick="window.open('${item.fileURL.replace('=s300', '')}', '_blank')">`;
    }

    const tagsHTML = Array.isArray(item.tags) ? item.tags.map(tag => `<span class="tag-button">${tag}</span>`).join('') : '';

    const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Desconocida';
    const defaultAuthorPhoto = 'https://via.placeholder.com/25/EA7900/FFFFFF?text=A';

    card.innerHTML = `
        ${mediaElement}
        <div class="card-details">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div class="card-tags">${tagsHTML}</div>
            <div class="card-footer">
                <div class="card-author">
                    <img class="author-photo" src="${item.authorPhotoURL || defaultAuthorPhoto}" alt="Foto de autor">
                    <span>${item.authorName}</span>
                </div>
                <span><i class="far fa-clock"></i> ${date}</span>
            </div>
        </div>
    `;

    return card;
}

async function loadContent() {
    contentGallery.innerHTML = '';
    loadingMessage.style.display = 'block';

    try {
        const response = await fetch(APPS_SCRIPT_URL);
        const files = await response.json();

        loadingMessage.style.display = 'none';
        allContentData = files;

        if (files.length === 0) {
            contentGallery.innerHTML = '<p style="color: #999; width: 100%; text-align: center;">Aún no hay contenido indexado. ¡Sube algo!</p>';
            return;
        }

        allContentData.forEach((item) => {
            const cardElement = renderContentCard(item);
            contentGallery.appendChild(cardElement);
        });

    } catch (error) {
        console.error("Error al cargar el contenido: ", error);
        loadingMessage.textContent = 'Error al cargar el contenido. Revisa el código y despliegue del Apps Script.';
        loadingMessage.style.color = '#f44336';
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'flex';
    modal.classList.remove('exiting');
    modal.classList.remove('entering');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('entering');
    modal.classList.remove('exiting');
}

auth.onAuthStateChanged(async (user) => {

    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];

        loginText.textContent = displayName;
        logoutLink.style.display = 'flex';
        sidebarProfileSection.onclick = handleProfileClick;

        await loadUserProfileData(user);

    } else {
        loginText.textContent = 'Iniciar Sesión';
        profilePhoto.src = '';
        profilePhoto.classList.add('hidden');
        profileIcon.style.display = 'block';

        logoutLink.style.display = 'none';
        sidebarProfileSection.onclick = openAuthModal;

        profileAvatar.src = 'https://via.placeholder.com/100/363a45/FFFFFF?text=G';
        profileBannerArea.style.backgroundImage = 'none';
        profileBannerArea.style.backgroundColor = DEFAULT_BANNER_COLOR;
        displayNameInput.value = '';
        userEmailDisplay.textContent = '';
        displayProfileStatus('', false);

        if (document.getElementById('profile-screen')?.classList.contains('active')) {
            showScreen('home-screen');
        }
    }
});

document.addEventListener('DOMContentLoaded', initializeApp);

window.addEventListener('resize', () => {
     if (window.innerWidth >= 900) {
         sidebar.style.width = "250px";
         sidebar.classList.add('open');
         menuOverlay.style.display = "none";
     } else {
          if (sidebar.classList.contains('open')) {
             closeMenu();
          }
     }
});

document.addEventListener('DOMContentLoaded', () => {

});

window.showScreen = showScreen;
window.goBack = goBack;
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
window.handleProfileClick = handleProfileClick;
window.signInWithGoogle = signInWithGoogle;
window.logout = logout;
window.updateUserProfile = updateUserProfile;
window.displayLocalImage = displayLocalImage;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.closeModalOnOutsideClick = closeModalOnOutsideClick;
window.toggleGameOptions = toggleGameOptions;
window.openModal = openModal;
window.closeModal = closeModal;
