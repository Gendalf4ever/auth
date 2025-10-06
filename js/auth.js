// Файл для работы с аутентификацией

// Элементы DOM для аутентификации
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const registerLink = document.getElementById('register-link');
const backToLoginLink = document.getElementById('back-to-login-link');

// Инициализация Firebase (использует общую конфигурацию)
function initializeFirebase() {
    if (typeof window.initializeFirebaseApp === 'function') {
        window.initializeFirebaseApp();
    } else {
        console.error('Firebase конфигурация не загружена. Убедитесь, что firebase-config.js подключен.');
    }
}

// Проверка роли пользователя
function checkUserRole(uid) {
    return firebase.firestore().collection('users').doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                return doc.data().role || 'user';
            } else {
                // Создать запись пользователя по умолчанию
                return firebase.firestore().collection('users').doc(uid).set({
                    role: 'user',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => 'user');
            }
        })
        .catch(error => {
            console.error('Ошибка при проверке роли:', error);
            return 'user';
        });
}

// Функции для управления состоянием загрузки
function showLoading() {
    const loadingState = document.getElementById('loading-state');
    if (loadingState) loadingState.style.display = 'flex';
}

function hideLoading() {
    const loadingState = document.getElementById('loading-state');
    if (loadingState) loadingState.style.display = 'none';
}

function showError(message) {
    hideLoading();
    alert(message); // В будущем можно заменить на более красивое уведомление
}

function showSuccess(message) {
    hideLoading();
    // Можно добавить красивое уведомление об успехе
}

// Обработчики форм аутентификации
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showError('Пожалуйста, заполните все поля');
            return;
        }
        
        showLoading();
        
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Вход успешен
                const user = userCredential.user;
                console.log('Пользователь вошел:', user);
                
                // Обновляем время последнего входа
                firebase.firestore().collection('users').doc(user.uid).update({
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(error => {
                    console.warn('Не удалось обновить время последнего входа:', error);
                });
                
                // Проверяем роль пользователя
                checkUserRole(user.uid).then(role => {
                    hideLoading();
                    if (role === 'admin') {
                        // Перенаправляем в админ панель
                        window.location.href = 'admin.html';
                    } else {
                        // Перенаправляем на главную страницу
                        window.location.href = 'index.html';
                    }
                });
            })
            .catch((error) => {
                const errorCode = error.code;
                let errorMessage = 'Произошла ошибка при входе';
                
                switch (errorCode) {
                    case 'auth/user-not-found':
                        errorMessage = 'Пользователь с таким email не найден';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Неверный пароль';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Неверный формат email';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Слишком много попыток входа. Попробуйте позже';
                        break;
                    default:
                        errorMessage = error.message;
                }
                
                showError(errorMessage);
            });
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        
        // Валидация
        if (!name || !email || !password || !confirmPassword) {
            showError('Пожалуйста, заполните все поля');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Пароли не совпадают');
            return;
        }
        
        if (password.length < 6) {
            showError('Пароль должен содержать минимум 6 символов');
            return;
        }
        
        showLoading();
        
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Регистрация успешна
                const user = userCredential.user;
                
                // Обновить профиль пользователя
                return user.updateProfile({
                    displayName: name
                }).then(() => {
                    // Создать запись пользователя в Firestore
                    return firebase.firestore().collection('users').doc(user.uid).set({
                        displayName: name,
                        email: email,
                        role: 'user',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
            })
            .then(() => {
                hideLoading();
                console.log('Пользователь зарегистрирован');
                showSuccess('Регистрация успешна! Перенаправляем...');
                
                // Перенаправляем на главную страницу
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            })
            .catch((error) => {
                const errorCode = error.code;
                let errorMessage = 'Произошла ошибка при регистрации';
                
                switch (errorCode) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'Пользователь с таким email уже существует';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Неверный формат email';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Слишком слабый пароль';
                        break;
                    default:
                        errorMessage = error.message;
                }
                
                showError(errorMessage);
            });
    });
}

// Функции для переключения форм
function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerLink = document.getElementById('register-link');
    const backToLoginLink = document.getElementById('back-to-login-link');
    
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (registerLink) registerLink.style.display = 'block';
    if (backToLoginLink) backToLoginLink.style.display = 'none';
}

function showRegisterForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerLink = document.getElementById('register-link');
    const backToLoginLink = document.getElementById('back-to-login-link');
    
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (registerLink) registerLink.style.display = 'none';
    if (backToLoginLink) backToLoginLink.style.display = 'block';
}

if (registerLink) {
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
}

if (backToLoginLink) {
    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
}