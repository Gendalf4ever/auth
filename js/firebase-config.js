// Общая конфигурация Firebase для всего приложения
window.firebaseConfig = {
    apiKey: "AIzaSyBPn3QTnKQ9a3s42A3OkumIR0IjXpIYKeE",
    authDomain: "codent-education.firebaseapp.com",
    projectId: "codent-education",
    storageBucket: "codent-education.firebasestorage.app",
    messagingSenderId: "622995236555",
    appId: "1:622995236555:web:1dada1c102be46ea361d4e"
};

// Настройки для GitHub Pages
window.isGitHubPages = window.location.hostname === 'gendalf4ever.github.io';

// Общая функция инициализации Firebase
window.initializeFirebaseApp = function() {
    if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
        
        // Настройка Firestore с правильными параметрами
        const db = firebase.firestore();
        
        // Применяем настройки только если они еще не были применены
        if (!window.firestoreSettingsApplied) {
            try {
                db.settings({
                    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
                    merge: true // Исправляет предупреждение о host override
                });
                window.firestoreSettingsApplied = true;
            } catch (e) {
                console.warn('Не удалось применить настройки Firestore:', e);
            }
        }
        
        // Настройка Auth для GitHub Pages
        if (window.isGitHubPages) {
            const auth = firebase.auth();
            // Добавляем домен GitHub Pages в список разрешенных
            console.log('Настройка Firebase Auth для GitHub Pages');
        }
        
        console.log('Firebase успешно инициализирован');
    }
    return firebase.app();
};
