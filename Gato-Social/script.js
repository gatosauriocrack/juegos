const chatListView = document.getElementById('chat-list-view');
const conversationView = document.getElementById('conversation-view');
const settingsView = document.getElementById('settings-view');
const attachmentMenu = document.getElementById('attachment-menu');
const mainMenu = document.getElementById('main-menu');
const messagesArea = document.getElementById('messages-area');
const globalBgSwatch = document.getElementById('chat-bg-color-swatch');
const authStatusText = document.getElementById('auth-status-text');
const fileExplorerInput = document.getElementById('file-explorer-input');
const messageInput = document.getElementById('message-input'); 
const sendButton = document.getElementById('send-button'); 
const chatsContainer = document.querySelector('.chats-container');

// --- CONSTANTES DEL WORKER Y CHAT (AJUSTADAS) ---
const WORKER_URL = 'https://gatosauriocrack-social.gatosauriocrackgames.workers.dev/send-message'; 
let USER_DRIVE_TOKEN = 'SIMULATED_DRIVE_TOKEN_12345'; 
let ACTIVE_CHAT_ID = null; 

// --- CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBcAqXK3qFD8j1T7h6cjO0U3d5nBoVAgVk", 
    authDomain: "procesador-56b7a.firebaseapp.com", 
    projectId: "procesador-56b7a", 
    storageBucket: "procesador-56b7a.firebasestorage.app", 
    messagingSenderId: "1029072924025", 
    appId: "1:1029072924025:web:c32d735e453416ecfd93a8", 
    measurementId: "G-WCBZTBPXZ4"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); 
const db = firebase.firestore(); // ¡INICIALIZACIÓN DE FIRESTORE AÑADIDA!

// --- LÓGICA DE FIREBASE Y AUTH ---

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => {
            console.log("Inicio de sesión con Google exitoso.");
            mainMenu.classList.remove('active');
        })
        .catch((error) => {
            console.error("Error de autenticación con Google:", error);
            alert(`Error al iniciar sesión: ${error.message}`);
        });
}

function logout() {
    auth.signOut()
        .then(() => { 
            console.log("Sesión cerrada.");
            mainMenu.classList.remove('active');
            loadChatList(null); // Recargar la lista al cerrar sesión
        })
        .catch((error) => { console.error('Error al cerrar sesión:', error); });
}

function handleLoginLogout() {
    if (auth.currentUser) {
        logout();
    } else {
        signInWithGoogle();
    }
}

auth.onAuthStateChanged((user) => {
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        authStatusText.textContent = `Cerrar Sesión (${displayName})`;
        loadChatList(user.uid); 
    } else {
        authStatusText.textContent = 'Iniciar Sesión';
        loadChatList(null); 
    }
});


// --- LÓGICA DE LISTA DE CHATS DINÁMICA ---

function renderChatItem(userId, name) {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.setAttribute('onclick', `openChat('${userId}', '${name}')`);

    chatItem.innerHTML = `
        <div class="profile-icon-wrapper">
            <i class="fas fa-user profile-icon-fa"></i>
        </div>
        <span class="username">${name}</span>
    `;
    chatsContainer.appendChild(chatItem);
}

function loadChatList(currentUserId) {
    chatsContainer.innerHTML = ''; 

    if (!currentUserId) {
        chatsContainer.innerHTML = '<p style="text-align: center; margin-top: 20px;">Inicia sesión para ver tus chats.</p>';
        return;
    }
    
    // NOTA: Esta sección debería escuchar a la colección de chats del usuario.
    // Por ahora, solo ponemos el mensaje dinámico.
    chatsContainer.innerHTML = '<p style="text-align: center; margin-top: 20px;">Tus chats aparecerán aquí cuando aceptes una invitación.</p>';
}

// --- LÓGICA DE SOLICITUD DE AMISTAD (NUEVO) ---

function promptAddContact() {
    if (!auth.currentUser) {
        alert("Debes iniciar sesión para agregar contactos.");
        return;
    }
    
    const targetAlias = prompt("Ingresa el apodo (alias) del usuario que deseas agregar:");

    if (targetAlias) {
        findAndSendRequest(targetAlias.toLowerCase());
    }
}

async function findAndSendRequest(alias) {
    const currentUser = auth.currentUser;
    const currentUserName = currentUser.displayName || currentUser.email.split('@')[0];
    
    try {
        // 1. Buscar el usuario en la colección 'usernames' por el campo 'alias'.
        const usersRef = db.collection('usernames'); 
        const querySnapshot = await usersRef.where('alias', '==', alias).limit(1).get();

        if (querySnapshot.empty) {
            alert(`No se encontró ningún usuario con el apodo (alias): ${alias}`);
            return;
        }

        const contactDoc = querySnapshot.docs[0];
        const contactId = contactDoc.id; 
        const contactAlias = contactDoc.data().alias; 

        if (currentUser.uid === contactId) {
             alert("No puedes enviarte una solicitud a ti mismo.");
             return;
        }
        
        // 2. Verificar si ya existe una solicitud (para evitar duplicados)
        const existingRequest = await db.collection('invitaciones-social')
            .where('fromId', '==', currentUser.uid)
            .where('toId', '==', contactId)
            .where('status', '==', 'pending')
            .get();

        if (!existingRequest.empty) {
            alert(`Ya existe una solicitud pendiente para ${contactAlias}.`);
            return;
        }

        // 3. Crear el documento de Solicitud de Amistad
        await db.collection('invitaciones-social').add({
            toId: contactId,
            fromId: currentUser.uid,
            fromName: currentUserName,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`¡Solicitud de amistad enviada a ${contactAlias}! Esperando confirmación.`);
        
    } catch (error) {
        console.error("Error al buscar/enviar solicitud:", error);
        alert("Ocurrió un error al intentar enviar la solicitud.");
    }
}

// --- LÓGICA DE NAVEGACIÓN Y AJUSTES (RESTO SIN CAMBIOS) ---

function toggleMainMenu(event) {
    if (event) event.stopPropagation();
    mainMenu.classList.toggle('active');
}

document.addEventListener('click', function(event) {
    const isClickInside = mainMenu.contains(event.target) || document.querySelector('.menu-btn').contains(event.target);
    if (!isClickInside) {
        mainMenu.classList.remove('active');
    }
});

function openChat(chatId, chatName) {
    chatListView.classList.remove('active');
    conversationView.classList.add('active');
    document.getElementById('current-chat-name').textContent = chatName;
    mainMenu.classList.remove('active');
    messagesArea.style.backgroundImage = 'none';
    
    ACTIVE_CHAT_ID = chatId; 
    console.log(`Chat Abierto: ${chatId}`);
}

function closeChat() {
    conversationView.classList.remove('active');
    chatListView.classList.add('active');
    attachmentMenu.classList.remove('open');
    ACTIVE_CHAT_ID = null; 
}

function openSettingsView() {
    chatListView.classList.remove('active');
    settingsView.classList.add('active');
    mainMenu.classList.remove('active');
}

function closeSettingsView() {
    settingsView.classList.remove('active');
    chatListView.classList.add('active');
}

function toggleAttachmentMenu() {
    attachmentMenu.classList.toggle('open');
}

function changeThemeColor(color) {
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--color-separator', color);
    console.log(`Color del Banner cambiado a: ${color}`);
}

function promptForBannerColor() {
    const currentColor = document.documentElement.style.getPropertyValue('--color-primary') || '#EA7900';
    const selectedColor = prompt(
        "Ingresa un código de color HEX (ej: #FF0000) o un nombre (ej: red, blue):",
        currentColor
    );

    if (selectedColor) {
        changeThemeColor(selectedColor);
    }
}

function changeGlobalBackground(color) {
    document.documentElement.style.setProperty('--color-background', color);
    globalBgSwatch.style.backgroundColor = color;
    console.log(`Fondo global cambiado a color: ${color}`);
}

function promptForGlobalBackground() {
    const currentColor = document.documentElement.style.getPropertyValue('--color-background') || '#000000';
    const selectedColor = prompt(
        "Elige el Fondo Global:\n\n1. Negro (#000000)\n2. Gris Claro (#DDDDDD)\n3. Ingresar código HEX (#RRGGBB) o nombre:", 
        currentColor
    );

    if (selectedColor === '1') {
        changeGlobalBackground('#000000');
    } else if (selectedColor === '2') {
        changeGlobalBackground('#DDDDDD');
    } else if (selectedColor) {
        changeGlobalBackground(selectedColor);
    }
}

function setChatBackgroundImage() {
    if (!conversationView.classList.contains('active')) {
        alert("Por favor, abre un chat primero para establecer la imagen de fondo.");
        return;
    }
    
    const imageUrl = prompt("Introduce la URL de la imagen de fondo (solo para este chat):");
    
    if (imageUrl) {
        messagesArea.style.backgroundImage = `url('${imageUrl}')`;
        messagesArea.style.backgroundSize = 'cover';
        messagesArea.style.backgroundRepeat = 'no-repeat';
        messagesArea.style.backgroundPosition = 'center';
        console.log(`Fondo del Chat cambiado a imagen: ${imageUrl}`);
    } else if (imageUrl === "") {
        messagesArea.style.backgroundImage = 'none';
        console.log("Imagen de fondo del chat eliminada.");
    }
}

// --- LÓGICA DE ENVÍO DE MENSAJES AL WORKER ---

function displayMessage(body, isOwnMessage) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message ' + (isOwnMessage ? 'own-message' : 'contact-message');
    messageElement.innerHTML = `<p>${body}</p>`;
    
    messagesArea.appendChild(messageElement);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

async function sendMessage() {
    const messageBody = messageInput.value.trim();
    const currentUser = auth.currentUser; 

    if (messageBody === "") return;

    if (!currentUser) {
        alert("Debes iniciar sesión para enviar mensajes.");
        messageInput.value = '';
        return;
    }
    
    if (!ACTIVE_CHAT_ID) {
        alert("Por favor, selecciona un chat para enviar mensajes.");
        return;
    }

    displayMessage(messageBody, true);
    messageInput.value = '';
    
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: ACTIVE_CHAT_ID,
                content: messageBody,
                userId: currentUser.uid, 
                driveToken: USER_DRIVE_TOKEN 
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Mensaje y Respaldo enviados al Worker:", result);
            setTimeout(() => {
                displayMessage("¡Recibido! (Worker OK)", false);
            }, 1500);

        } else {
            console.error("Error del Worker:", result);
            displayMessage(`Error al enviar: ${result.error || 'Desconocido'}`, true);
        }

    } catch (error) {
        console.error("Error de red al contactar al Worker:", error);
        displayMessage("Error de conexión al servidor (Worker).", true);
    }
}

// --- LÓGICA DE EXPLORADOR DE ARCHIVOS ---

function openFileExplorer(acceptType) {
    if (!auth.currentUser) {
        alert("Debes iniciar sesión para adjuntar archivos.");
        toggleAttachmentMenu();
        return;
    }
    
    fileExplorerInput.setAttribute('accept', acceptType);
    fileExplorerInput.click();
    toggleAttachmentMenu();
}

fileExplorerInput.addEventListener('change', (event) => {
    const files = event.target.files;
    if (files.length > 0) {
        console.log(`Archivos seleccionados: ${files.length}`);
        alert(`Listo para subir ${files.length} archivos. ¡Implementa Firebase Storage!`);
    }
    fileExplorerInput.value = ''; 
});


// --- EVENT LISTENERS FINALES ---

if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
}

if (messageInput) {
    messageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}
