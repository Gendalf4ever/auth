// ======================================
// КОНФИГУРАЦИЯ FIREBASE ДЛЯ ДВУХ ПРОЕКТОВ
// ======================================

// Конфигурация для АУТЕНТИФИКАЦИИ и ПОЛЬЗОВАТЕЛЕЙ (основной проект)
window.firebaseAuthConfig = {
    apiKey: "AIzaSyBPn3QTnKQ9a3s42A3OkumIR0IjXpIYKeE",
    authDomain: "codent-education.firebaseapp.com",
    projectId: "codent-education",
    storageBucket: "codent-education.firebasestorage.app",
    messagingSenderId: "622995236555",
    appId: "1:622995236555:web:1dada1c102be46ea361d4e"
};

// Конфигурация для ТОВАРОВ и КАТАЛОГА (второй проект с готовой базой)
window.firebaseProductsConfig = {
    apiKey: "AIzaSyDiZ1FBnSY4iBcSYM8ufWbRCoX99W3fW9Q",
    authDomain: "codent-7814d.firebaseapp.com",
    projectId: "codent-7814d",
    storageBucket: "codent-7814d.firebasestorage.app",
    messagingSenderId: "855160903983",
    appId: "1:855160903983:web:44401cc9d2ab5d79e0e9da"
};

// Для обратной совместимости (используется в старом коде)
window.firebaseConfig = window.firebaseAuthConfig;

// Настройки для GitHub Pages
window.isGitHubPages = window.location.hostname === 'gendalf4ever.github.io';

// ======================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЙ
// ======================================

// Общая функция инициализации ОСНОВНОГО Firebase приложения (Auth)
window.initializeFirebaseApp = function() {
    if (!firebase.apps.length) {
        // Инициализируем основное приложение (Auth)
        firebase.initializeApp(window.firebaseAuthConfig);
        
        // Настройка Firestore для основного приложения
        const db = firebase.firestore();
        
        // Применяем настройки только если они еще не были применены
        if (!window.firestoreSettingsApplied) {
            try {
                db.settings({
                    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
                    merge: true
                });
                window.firestoreSettingsApplied = true;
            } catch (e) {
                console.warn('Не удалось применить настройки Firestore:', e);
            }
        }
        
        // Настройка Auth для GitHub Pages
        if (window.isGitHubPages) {
            const auth = firebase.auth();
            console.log('Настройка Firebase Auth для GitHub Pages');
        }
        
        console.log('Firebase Auth успешно инициализирован');
    }
    return firebase.app();
};

// Инициализация ВТОРОГО Firebase приложения (Products)
window.initializeProductsApp = function() {
    // Проверяем, не инициализировано ли уже второе приложение
    let productsApp;
    try {
        productsApp = firebase.app('products');
    } catch (e) {
        // Приложение еще не инициализировано, создаем его
        productsApp = firebase.initializeApp(window.firebaseProductsConfig, 'products');
        console.log('Firebase Products успешно инициализирован');
    }
    return productsApp;
};

// ======================================
// ПОЛУЧЕНИЕ ИНСТАНСОВ FIRESTORE
// ======================================

// Получить Firestore для АУТЕНТИФИКАЦИИ (основной проект)
window.getAuthFirestore = function() {
    const app = window.initializeFirebaseApp();
    return firebase.firestore(app);
};

// Получить Firestore для ТОВАРОВ (второй проект)
window.getProductsFirestore = function() {
    const app = window.initializeProductsApp();
    return firebase.firestore(app);
};

// ======================================
// АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ
// ======================================

// Инициализируем оба приложения при загрузке
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.initializeFirebaseApp(); // Основное приложение (Auth)
        window.initializeProductsApp(); // Приложение с товарами
        console.log('Оба Firebase приложения успешно инициализированы');
    } catch (error) {
        console.error('Ошибка инициализации Firebase:', error);
    }
});
