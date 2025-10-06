// Общая конфигурация Firebase для всего приложения
window.firebaseConfig = {
    apiKey: "AIzaSyBPn3QTnKQ9a3s42A3OkumIR0IjXpIYKeE",
    authDomain: "codent-education.firebaseapp.com",
    projectId: "codent-education",
    storageBucket: "codent-education.firebasestorage.app",
    messagingSenderId: "622995236555",
    appId: "1:622995236555:web:1dada1c102be46ea361d4e"
};

// Общая функция инициализации Firebase
window.initializeFirebaseApp = function() {
    if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
        
        // Настройка Firestore с исправленными параметрами
        const db = firebase.firestore();
        try {
            // Убираем конфликтующие настройки
            db.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
            });
        } catch (e) {
            console.warn('Не удалось применить настройки Firestore:', e);
        }
        
        console.log('Firebase успешно инициализирован');
    }
    return firebase.app();
};
