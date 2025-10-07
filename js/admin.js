/**
 * Панель администратора
 * Управление видео, пользователями и настройками
 */

// Инициализация Firebase (использует общую конфигурацию)
function initializeFirebase() {
    if (typeof window.initializeFirebaseApp === 'function') {
        window.initializeFirebaseApp();
        console.log('Firebase инициализирован для админ панели');
    } else {
        console.error('Firebase конфигурация не загружена. Убедитесь, что firebase-config.js подключен.');
    }
}

// Глобальные переменные для админ панели
let adminCurrentUser = null;
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
async function initializeAdmin() {
    console.log('Инициализация панели администратора...');
    
    try {
        // Ждем загрузки системы управления ролями
        if (typeof RoleManager === 'undefined') {
            console.warn('Система управления ролями не загружена, используем базовую проверку');
        }
        
        // Настройка навигации
        setupNavigation();
        
        // Загрузка статистики
        await loadStatistics();
        
        // Загрузка видео
        await loadVideos();
        
        // Загрузка пользователей при переходе в соответствующий раздел
        setupUsersSection();
        
        console.log('Панель администратора успешно инициализирована');
    } catch (error) {
        console.error('Ошибка инициализации админ панели:', error);
        showError('Ошибка инициализации панели администратора: ' + error.message);
    }
}

// Показать ошибку
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
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
    // Сначала проверяем текущего пользователя синхронно
    const user = firebase.auth().currentUser;
    
        if (user) {
            // Пользователь уже авторизован (возврат на страницу)
            adminCurrentUser = user;
            console.log('Пользователь уже авторизован:', user.email);
            checkUserRole(user.uid);
        } else {
            // Ждем события авторизации (первая загрузка)
            const unsubscribe = firebase.auth().onAuthStateChanged((authUser) => {
                // Отписываемся сразу после первой проверки
                unsubscribe();
                
                if (authUser) {
                    // Пользователь вошел в систему
                    adminCurrentUser = authUser;
                    console.log('Пользователь авторизован:', authUser.email);
                    checkUserRole(authUser.uid);
                } else {
                    // Пользователь не вошел в систему - показываем сообщение
                    console.log('Пользователь не авторизован');
                    showAuthRequired();
                }
            });
        }
}

// Проверка роли пользователя
async function checkUserRole(uid) {
    try {
        const doc = await firebase.firestore().collection('users').doc(uid).get();
        
        if (doc.exists) {
            const role = doc.data().role || 'user';
            
            if (role === 'admin') {
                // Пользователь - администратор
                if (adminName) {
                    adminName.textContent = adminCurrentUser.displayName || adminCurrentUser.email;
                }
                console.log('Доступ к панели администратора разрешен');
            } else {
                // Пользователь не администратор
                showAccessDenied('У вас нет прав доступа к панели администратора. Требуется роль администратора.');
            }
        } else {
            // Пользователь не найден в базе данных
            showAccessDenied('Ваш профиль не найден в системе. Обратитесь к администратору.');
        }
    } catch (error) {
        console.error('Ошибка проверки роли:', error);
        showAccessDenied('Ошибка при проверке прав доступа: ' + error.message);
    }
}

// Показать сообщение о необходимости авторизации
function showAuthRequired() {
    const content = document.querySelector('main');
    if (content) {
        content.innerHTML = `
            <div class="container-fluid">
                <div class="row justify-content-center align-items-center" style="min-height: 70vh;">
                    <div class="col-md-6 text-center">
                        <div class="card shadow-lg">
                            <div class="card-body p-5">
                                <div class="mb-4">
                                    <i class="fas fa-lock fa-5x text-warning"></i>
                                </div>
                                <h2 class="mb-3">Требуется авторизация</h2>
                                <p class="text-muted mb-4">
                                    Для доступа к панели администратора необходимо войти в систему.
                                </p>
                                <a href="login.html" class="btn btn-primary btn-lg">
                                    <i class="fas fa-sign-in-alt me-2"></i>
                                    Войти в систему
                                </a>
                                <br><br>
                                <a href="index.html" class="btn btn-outline-secondary">
                                    <i class="fas fa-home me-2"></i>
                                    Вернуться на главную
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Показать сообщение об отказе в доступе
function showAccessDenied(message) {
    const content = document.querySelector('main');
    if (content) {
        content.innerHTML = `
            <div class="container-fluid">
                <div class="row justify-content-center align-items-center" style="min-height: 70vh;">
                    <div class="col-md-6 text-center">
                        <div class="card shadow-lg border-danger">
                            <div class="card-body p-5">
                                <div class="mb-4">
                                    <i class="fas fa-exclamation-triangle fa-5x text-danger"></i>
                                </div>
                                <h2 class="mb-3 text-danger">Доступ запрещен</h2>
                                <p class="text-muted mb-4">
                                    ${message}
                                </p>
                                <a href="index.html" class="btn btn-primary btn-lg">
                                    <i class="fas fa-home me-2"></i>
                                    Вернуться на главную
                                </a>
                                <br><br>
                                <button onclick="logout()" class="btn btn-outline-secondary">
                                    <i class="fas fa-sign-out-alt me-2"></i>
                                    Выйти и войти с другой учетной записью
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Перенаправление на страницу входа (используется только при явном действии)
function redirectToLogin() {
    window.location.href = 'login.html';
}

// Выход из системы
function logout() {
    firebase.auth().signOut().then(() => {
        console.log('Пользователь вышел из системы');
        // После выхода показываем экран авторизации
        showAuthRequired();
    }).catch((error) => {
        console.error('Ошибка выхода:', error);
        alert('Ошибка при выходе из системы: ' + error.message);
    });
}

// Загрузка статистики
async function loadStatistics() {
    try {
        // Подсчет видео
        const videosSnapshot = await firebase.firestore().collection('videos').get();
        if (totalVideos) totalVideos.textContent = videosSnapshot.size;
        
        // Подсчет пользователей
        const usersSnapshot = await firebase.firestore().collection('users').get();
        if (totalUsers) totalUsers.textContent = usersSnapshot.size;
        
        // Подсчет оборудования (примерное значение)
        if (totalEquipment) totalEquipment.textContent = '0';
        
        // Подсчет загрузок (примерное значение)
        if (totalDownloads) totalDownloads.textContent = '0';
        
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

// ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ====================

// Настройка раздела пользователей
function setupUsersSection() {
    // Добавляем обработчик для загрузки пользователей при переходе в раздел
    const usersNavLink = document.querySelector('[data-section="users"]');
    if (usersNavLink) {
        usersNavLink.addEventListener('click', () => {
            setTimeout(() => {
                loadUsers();
            }, 100);
        });
    }
}

// Загрузка пользователей
async function loadUsers() {
    console.log('Загрузка пользователей...');
    
    try {
        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) {
            console.error('Элемент users-table-body не найден');
            return;
        }

        // Показываем индикатор загрузки
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="mt-2">Загрузка пользователей...</p>
                </td>
            </tr>
        `;

        let users = [];
        
        // Используем систему управления ролями, если доступна
        if (typeof RoleManager !== 'undefined') {
            users = await RoleManager.getAllUsersWithRoles();
        } else {
            // Fallback к прямому запросу Firestore
            const usersSnapshot = await firebase.firestore()
                .collection('users')
                .orderBy('createdAt', 'desc')
                .get();
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                users.push({
                    id: doc.id,
                    displayName: userData.displayName || 'Без имени',
                    email: userData.email || '',
                    role: userData.role || 'user',
                    createdAt: userData.createdAt,
                    lastLoginAt: userData.lastLoginAt
                });
            });
        }

        // Обновляем статистику
        updateUsersStatistics(users);

        // Отображаем пользователей
        displayUsers(users);

    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        
        const tableBody = document.getElementById('users-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Ошибка загрузки пользователей: ${error.message}
                        <br>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="loadUsers()">
                            <i class="fas fa-retry me-1"></i>
                            Попробовать снова
                        </button>
                    </td>
                </tr>
            `;
        }
        
        showError('Ошибка загрузки пользователей: ' + error.message);
    }
}

// Отображение пользователей в таблице
function displayUsers(users) {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;

    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="fas fa-users fa-3x mb-3"></i>
                    <h5>Пользователи не найдены</h5>
                    <p>В системе пока нет зарегистрированных пользователей</p>
                </td>
            </tr>
        `;
        return;
    }

    let tableHTML = '';
    
    users.forEach(user => {
        const createdAt = user.createdAt ? formatDate(user.createdAt) : 'Неизвестно';
        const lastLoginAt = user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Никогда';
        
        // Создаем аватар
        const avatar = `
            <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle" 
                 style="width: 40px; height: 40px; font-weight: bold;">
                ${user.displayName.charAt(0).toUpperCase()}
            </div>
        `;

        // Создаем селект ролей
        const roleSelect = typeof RoleManager !== 'undefined' 
            ? RoleManager.createRoleSelect(user.role, user.id)
            : createBasicRoleSelect(user.role, user.id);

        tableHTML += `
            <tr>
                <td class="text-center">${avatar}</td>
                <td>
                    <div class="fw-bold">${user.displayName}</div>
                    <small class="text-muted">ID: ${user.id}</small>
                </td>
                <td>${user.email}</td>
                <td>${roleSelect}</td>
                <td>
                    <small>${createdAt}</small>
                </td>
                <td>
                    <small>${lastLoginAt}</small>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewUserDetails('${user.id}')" title="Просмотр">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="editUser('${user.id}')" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.id}', '${user.displayName}')" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableHTML;
}

// Создание базового селекта ролей (fallback)
function createBasicRoleSelect(currentRole, userId) {
    return `
        <select class="form-select form-select-sm" onchange="handleRoleChange('${userId}', this.value)">
            <option value="user" ${currentRole === 'user' ? 'selected' : ''}>Пользователь</option>
            <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Администратор</option>
        </select>
    `;
}

// Обновление статистики пользователей
function updateUsersStatistics(users) {
    const totalCount = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    
    // Подсчет активных пользователей (вошедших за последние 24 часа)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const activeCount = users.filter(u => {
        if (!u.lastLoginAt) return false;
        const lastLogin = u.lastLoginAt.toDate ? u.lastLoginAt.toDate() : new Date(u.lastLoginAt);
        return lastLogin > oneDayAgo;
    }).length;

    // Обновляем элементы статистики
    updateElement('users-total-count', totalCount);
    updateElement('users-admin-count', adminCount);
    updateElement('users-active-count', activeCount);
    
    // Также обновляем общую статистику
    updateElement('total-users', totalCount);
}

// Вспомогательная функция для обновления элементов
function updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Обновление списка пользователей
function refreshUsersList() {
    loadUsers();
}

// Просмотр деталей пользователя
function viewUserDetails(userId) {
    console.log('Просмотр пользователя:', userId);
    // TODO: Реализовать модальное окно с деталями пользователя
    showNotification('Функция просмотра деталей пользователя в разработке', 'info');
}

// Редактирование пользователя
async function editUser(userId) {
    console.log('Редактирование пользователя:', userId);
    
    try {
        // Получаем данные пользователя из Firestore
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            throw new Error('Пользователь не найден');
        }
        
        const userData = userDoc.data();
        
        // Заполняем форму данными пользователя
        document.getElementById('edit-user-id').value = userId;
        document.getElementById('edit-user-displayName').value = userData.displayName || '';
        document.getElementById('edit-user-email').value = userData.email || '';
        document.getElementById('edit-user-phone').value = userData.phone || '';
        document.getElementById('edit-user-role').value = userData.role || 'user';
        document.getElementById('edit-user-specialization').value = userData.specialization || '';
        document.getElementById('edit-user-bio').value = userData.bio || '';
        
        // Форматируем и заполняем даты
        const createdAt = userData.createdAt ? formatDate(userData.createdAt) : 'Неизвестно';
        const lastLoginAt = userData.lastLoginAt ? formatDate(userData.lastLoginAt) : 'Никогда';
        
        document.getElementById('edit-user-createdAt').value = createdAt;
        document.getElementById('edit-user-lastLoginAt').value = lastLoginAt;
        
        // Показываем модальное окно (Bootstrap 5)
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
        
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        showNotification(`Ошибка загрузки данных: ${error.message}`, 'danger');
    }
}

// Сохранение изменений пользователя
async function saveUserChanges() {
    const userId = document.getElementById('edit-user-id').value;
    
    if (!userId) {
        showNotification('Ошибка: ID пользователя не найден', 'danger');
        return;
    }
    
    try {
        // Собираем данные из формы
        const updatedData = {
            displayName: document.getElementById('edit-user-displayName').value.trim(),
            phone: document.getElementById('edit-user-phone').value.trim(),
            role: document.getElementById('edit-user-role').value,
            specialization: document.getElementById('edit-user-specialization').value,
            bio: document.getElementById('edit-user-bio').value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Валидация
        if (!updatedData.displayName) {
            throw new Error('Имя пользователя не может быть пустым');
        }
        
        // Проверяем права доступа
        if (typeof RoleManager !== 'undefined') {
            const isAdmin = await RoleManager.isAdmin();
            if (!isAdmin) {
                throw new Error('Недостаточно прав для редактирования пользователей');
            }
        }
        
        // Обновляем данные в Firestore
        await firebase.firestore().collection('users').doc(userId).update(updatedData);
        
        console.log('Данные пользователя обновлены:', userId);
        
        // Закрываем модальное окно (Bootstrap 5)
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        if (modal) {
            modal.hide();
        }
        
        // Показываем уведомление
        showNotification('Данные пользователя успешно обновлены', 'success');
        
        // Обновляем список пользователей
        setTimeout(() => {
            loadUsers();
        }, 500);
        
    } catch (error) {
        console.error('Ошибка сохранения данных пользователя:', error);
        showNotification(`Ошибка сохранения: ${error.message}`, 'danger');
    }
}

// Удаление пользователя
async function deleteUser(userId, userName) {
    const confirmMessage = `Вы уверены, что хотите удалить пользователя "${userName}"?\n\nЭто действие нельзя отменить!`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Проверяем права доступа
        if (typeof RoleManager !== 'undefined') {
            const isAdmin = await RoleManager.isAdmin();
            if (!isAdmin) {
                throw new Error('Недостаточно прав для удаления пользователей');
            }
        }
        
        // Удаляем пользователя из Firestore
        await firebase.firestore().collection('users').doc(userId).delete();
        
        showNotification(`Пользователь "${userName}" успешно удален`, 'success');
        
        // Обновляем список
        loadUsers();
        
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        showNotification(`Ошибка удаления пользователя: ${error.message}`, 'error');
    }
}

// Экспорт функций для глобального использования
window.adminModule = {
    loadVideos,
    playVideo,
    downloadVideo,
    deleteVideo,
    showNotification,
    loadUsers,
    refreshUsersList,
    viewUserDetails,
    editUser,
    saveUserChanges,
    deleteUser,
    logout
};

// Делаем функции глобальными для использования в HTML
window.refreshUsersList = refreshUsersList;
window.viewUserDetails = viewUserDetails;
window.editUser = editUser;
window.saveUserChanges = saveUserChanges;
window.deleteUser = deleteUser;
window.loadUsers = loadUsers;
window.logout = logout;