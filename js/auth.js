// Файл для работы с аутентификацией

// Элементы DOM для аутентификации
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const registerLink = document.getElementById('register-link');
const backToLoginLink = document.getElementById('back-to-login-link');

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBPn3QTnKQ9a3s42A3OkumIR0IjXpIYKeE",
    authDomain: "codent-education.firebaseapp.com",
    projectId: "codent-education",
    storageBucket: "codent-education.firebasestorage.app",
    messagingSenderId: "622995236555",
    appId: "1:622995236555:web:1dada1c102be46ea361d4e"
  };


// Инициализация Firebase
function initializeFirebase() {
    // Проверяем, не инициализирован ли Firebase уже
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        // Настройка Firestore для стабильной работы в ограниченных сетях
        const db = firebase.firestore();
        try {
            db.settings({ experimentalForceLongPolling: true, useFetchStreams: false });
        } catch (e) {
            console.warn('Не удалось применить настройки Firestore:', e);
        }
        // Включаем офлайн-персистентность (грейсфулл-фолбэк при конфликте вкладок)
        db.enablePersistence().catch((err) => {
            console.warn('Persistence недоступна:', err && err.code ? err.code : err);
        });
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

// Обработчики форм аутентификации
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Вход успешен
                const user = userCredential.user;
                console.log('Пользователь вошел:', user);
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert(`Ошибка входа: ${errorMessage}`);
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
        
        if (password !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }
        
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
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
            })
            .then(() => {
                console.log('Пользователь зарегистрирован');
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert(`Ошибка регистрации: ${errorMessage}`);
            });
    });
}

if (registerLink) {
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(registerPage);
    });
}

if (backToLoginLink) {
    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(loginPage);
    });
}