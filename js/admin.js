/**
 * Панель администратора
 * Управление видео, пользователями и настройками
 */

// Конфигурация Firebase
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
        console.log('Firebase инициализирован для админ панели');
    }
}

// Глобальные переменные
let currentUser = null;
let videos = [];

// Элементы DOM
const adminName = document.getElementById('admin-name');
const totalVideos = document.getElementById('total-videos');
const totalUsers = document.getElementById('total-users');
const totalEquipment = document.getElementById('total-equipment');
const totalDownloads = document.getElementById('total-downloads');
const videosTbody = document.getElementById('videos-tbody');
const uploadVideoForm = document.getElementById('upload-video-form');
const uploadVideoBtn = document.getElementById('upload-video-btn');
const uploadProgress = document.getElementById('upload-progress');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase();
    initializeAdmin();
    setupEventListeners();
    checkAuth();
});

// Инициализация админ панели
function initializeAdmin() {
    console.log('Инициализация панели администратора...');
    
    // Настройка навигации
    setupNavigation();
    
    // Загрузка статистики
    loadStatistics();
    
    // Загрузка видео
    loadVideos();
}

// Настройка навигации
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Убираем активный класс со всех ссылок
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Добавляем активный класс к текущей ссылке
            link.classList.add('active');
            
            // Показываем соответствующую секцию
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });
}

// Показать секцию
function showSection(sectionId) {
    // Скрываем все секции
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Показываем нужную секцию
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Загрузка видео
    if (uploadVideoBtn) {
        uploadVideoBtn.addEventListener('click', handleVideoUpload);
    }
    
    // Обработка изменения файла
    const videoFileInput = document.getElementById('video-file');
    if (videoFileInput) {
        videoFileInput.addEventListener('change', handleFileSelect);
    }
}

// Проверка аутентификации
function checkAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Пользователь вошел в систему
            currentUser = user;
            checkUserRole(user.uid);
        } else {
            // Пользователь не вошел в систему
            redirectToLogin();
        }
    });
}

// Проверка роли пользователя
async function checkUserRole(uid) {
    try {
        const doc = await firebase.firestore().collection('users').doc(uid).get();
        
        if (doc.exists) {
            const role = doc.data().role || 'user';
            
            if (role === 'admin') {
                // Пользователь - администратор
                adminName.textContent = currentUser.displayName || currentUser.email;
                console.log('Доступ к панели администратора разрешен');
            } else {
                // Пользователь не администратор
                alert('У вас нет прав доступа к панели администратора');
                redirectToLogin();
            }
        } else {
            // Пользователь не найден в базе данных
            alert('Пользователь не найден в системе');
            redirectToLogin();
        }
    } catch (error) {
        console.error('Ошибка проверки роли:', error);
        redirectToLogin();
    }
}

// Перенаправление на страницу входа
function redirectToLogin() {
    window.location.href = 'login.html';
}

// Выход из системы
function logout() {
    firebase.auth().signOut().then(() => {
        console.log('Пользователь вышел из системы');
        redirectToLogin();
    }).catch((error) => {
        console.error('Ошибка выхода:', error);
    });
}

// Загрузка статистики
async function loadStatistics() {
    try {
        // Подсчет видео
        const videosSnapshot = await firebase.firestore().collection('videos').get();
        totalVideos.textContent = videosSnapshot.size;
        
        // Подсчет пользователей
        const usersSnapshot = await firebase.firestore().collection('users').get();
        totalUsers.textContent = usersSnapshot.size;
        
        // Подсчет оборудования (примерное значение)
        totalEquipment.textContent = '0';
        
        // Подсчет загрузок (примерное значение)
        totalDownloads.textContent = '0';
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Загрузка видео
async function loadVideos() {
    try {
        const videosSnapshot = await firebase.firestore().collection('videos').get();
        videos = [];
        
        videosSnapshot.forEach(doc => {
            videos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderVideosTable();
        
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
    }
}

// Отображение таблицы видео
function renderVideosTable() {
    if (!videosTbody) return;
    
    videosTbody.innerHTML = '';
    
    if (videos.length === 0) {
        videosTbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fas fa-video fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Видео не найдены</p>
                </td>
            </tr>
        `;
        return;
    }
    
    videos.forEach(video => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="video-preview me-3">
                        <i class="fas fa-video fa-2x text-muted"></i>
                    </div>
                    <div>
                        <strong>${video.title}</strong>
                        <br>
                        <small class="text-muted">${video.category}</small>
                    </div>
                </div>
            </td>
            <td>${video.description || 'Без описания'}</td>
            <td>${formatFileSize(video.size || 0)}</td>
            <td>${formatDate(video.uploadedAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="playVideo('${video.id}')" title="Воспроизвести">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="downloadVideo('${video.id}')" title="Скачать">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteVideo('${video.id}')" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        videosTbody.appendChild(row);
    });
}

// Обработка выбора файла
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Проверяем размер файла (максимум 500MB)
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            alert('Размер файла не должен превышать 500MB');
            event.target.value = '';
            return;
        }
        
        // Проверяем тип файла
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
        if (!allowedTypes.includes(file.type)) {
            alert('Поддерживаются только видеофайлы (MP4, AVI, MOV, WMV)');
            event.target.value = '';
            return;
        }
        
        console.log('Выбран файл:', file.name, 'Размер:', formatFileSize(file.size));
    }
}

// Загрузка видео
async function handleVideoUpload() {
    const title = document.getElementById('video-title').value;
    const description = document.getElementById('video-description').value;
    const category = document.getElementById('video-category').value;
    const file = document.getElementById('video-file').files[0];
    
    if (!title || !category || !file) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    try {
        // Показываем прогресс
        uploadProgress.style.display = 'block';
        uploadVideoBtn.disabled = true;
        
        // Создаем уникальное имя файла
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        
        // Загружаем файл в Firebase Storage
        const storageRef = firebase.storage().ref();
        const videoRef = storageRef.child(`videos/${fileName}`);
        
        const uploadTask = videoRef.put(file);
        
        // Отслеживаем прогресс загрузки
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                const progressBar = uploadProgress.querySelector('.progress-bar');
                progressBar.style.width = progress + '%';
                progressBar.textContent = Math.round(progress) + '%';
            },
            (error) => {
                console.error('Ошибка загрузки:', error);
                alert('Ошибка загрузки файла');
                uploadProgress.style.display = 'none';
                uploadVideoBtn.disabled = false;
            },
            async () => {
                try {
                    // Получаем URL загруженного файла
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Сохраняем информацию о видео в Firestore
                    await firebase.firestore().collection('videos').add({
                        title: title,
                        description: description,
                        category: category,
                        fileName: fileName,
                        originalName: file.name,
                        size: file.size,
                        downloadURL: downloadURL,
                        uploadedBy: currentUser.uid,
                        uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'uploaded'
                    });
                    
                    // Скрываем прогресс
                    uploadProgress.style.display = 'none';
                    uploadVideoBtn.disabled = false;
                    
                    // Очищаем форму
                    uploadVideoForm.reset();
                    
                    // Закрываем модальное окно
                    const modal = bootstrap.Modal.getInstance(document.getElementById('uploadVideoModal'));
                    modal.hide();
                    
                    // Показываем уведомление
                    showNotification('Видео успешно загружено!', 'success');
                    
                    // Обновляем список видео
                    loadVideos();
                    loadStatistics();
                    
                } catch (error) {
                    console.error('Ошибка сохранения информации о видео:', error);
                    alert('Ошибка сохранения информации о видео');
                    uploadProgress.style.display = 'none';
                    uploadVideoBtn.disabled = false;
                }
            }
        );
        
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        alert('Ошибка загрузки видео');
        uploadProgress.style.display = 'none';
        uploadVideoBtn.disabled = false;
    }
}

// Воспроизведение видео
function playVideo(videoId) {
    const video = videos.find(v => v.id === videoId);
    if (video) {
        window.open(video.downloadURL, '_blank');
    }
}

// Скачивание видео
function downloadVideo(videoId) {
    const video = videos.find(v => v.id === videoId);
    if (video) {
        const link = document.createElement('a');
        link.href = video.downloadURL;
        link.download = video.originalName;
        link.click();
    }
}

// Удаление видео
async function deleteVideo(videoId) {
    if (!confirm('Вы уверены, что хотите удалить это видео?')) {
        return;
    }
    
    try {
        const video = videos.find(v => v.id === videoId);
        
        if (video) {
            // Удаляем файл из Storage
            const storageRef = firebase.storage().ref();
            const videoRef = storageRef.child(`videos/${video.fileName}`);
            await videoRef.delete();
            
            // Удаляем запись из Firestore
            await firebase.firestore().collection('videos').doc(videoId).delete();
            
            // Обновляем список
            loadVideos();
            loadStatistics();
            
            showNotification('Видео удалено!', 'success');
        }
    } catch (error) {
        console.error('Ошибка удаления видео:', error);
        alert('Ошибка удаления видео');
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Форматирование даты
function formatDate(timestamp) {
    if (!timestamp) return 'Неизвестно';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Экспорт функций для глобального использования
window.adminModule = {
    loadVideos,
    playVideo,
    downloadVideo,
    deleteVideo,
    showNotification
};