// Файл для работы с профилем пользователя и админ-панелью

// Инициализация Firebase (использует общую конфигурацию)
function initializeFirebase() {
    if (typeof window.initializeFirebaseApp === 'function') {
        window.initializeFirebaseApp();
    } else {
        console.error('Firebase конфигурация не загружена. Убедитесь, что firebase-config.js подключен.');
    }
}

// Глобальные переменные для профиля
let profileCurrentUser = null;
let profileIsAdmin = false;
let currentTab = 'profile';

// Элементы DOM
const authRequired = document.getElementById('auth-required');
const profileContent = document.getElementById('profile-content');
const userDisplayName = document.getElementById('user-display-name');
const userEmail = document.getElementById('user-email');
const userRoleBadge = document.getElementById('user-role-badge');
const loginLink = document.getElementById('login-link');
const logoutLink = document.getElementById('logout-link');

// Элементы форм
const profileForm = document.getElementById('profile-form');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profilePhone = document.getElementById('profile-phone');
const profileSpecialization = document.getElementById('profile-specialization');
const profileBio = document.getElementById('profile-bio');

// Элементы вкладок
const tabLinks = document.querySelectorAll('[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeProfile();
    setupEventListeners();
});

// Инициализация профиля
function initializeProfile() {
    // Инициализируем Firebase
    initializeFirebase();
    
    // Проверяем состояние аутентификации
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                checkUserRoleAndLoadProfile();
            } else {
                showAuthRequired();
            }
        });
    } else {
        showAuthRequired();
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

// Проверка роли пользователя и загрузка профиля
async function checkUserRoleAndLoadProfile() {
    try {
        // Используем новую систему управления ролями, если доступна
        if (typeof RoleManager !== 'undefined') {
            const role = await RoleManager.getCurrentUserRole();
            profileIsAdmin = await RoleManager.profileIsAdmin();
        } else {
            // Fallback к старой системе
            const role = await checkUserRole(currentUser.uid);
            profileIsAdmin = role === 'admin';
        }
        
        loadUserProfile();
        showProfileContent();
        setupAdminFeatures();
    } catch (error) {
        console.error('Ошибка при проверке роли:', error);
        loadUserProfile();
        showProfileContent();
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Переключение вкладок
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = e.target.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Форма профиля
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Кнопка выхода
    if (logoutLink) {
        logoutLink.addEventListener('click', handleLogout);
    }
    
    // Кнопка входа
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }
    
    // Админские функции
    setupAdminEventListeners();
}

// Переключение вкладок
function switchTab(tabName) {
    // Убираем активный класс со всех ссылок
    tabLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Скрываем все вкладки
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Показываем нужную вкладку
    const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`tab-${tabName}`);
    
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    if (activeContent) {
        activeContent.style.display = 'block';
        currentTab = tabName;
        
        // Загружаем данные для вкладки
        loadTabData(tabName);
    }
}

// Загрузка данных для вкладки
function loadTabData(tabName) {
    switch (tabName) {
        case 'courses':
            loadUserCourses();
            break;
        case 'progress':
            loadUserProgress();
            break;
        case 'admin-users':
            if (profileIsAdmin) loadAdminUsers();
            break;
        case 'admin-courses':
            if (profileIsAdmin) loadAdminCourses();
            break;
        case 'admin-products':
            if (profileIsAdmin) loadAdminProducts();
            break;
        case 'admin-analytics':
            if (profileIsAdmin) loadAdminAnalytics();
            break;
    }
}

// Загрузка профиля пользователя
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Заполняем форму профиля
            if (profileName) profileName.value = userData.displayName || currentUser.displayName || '';
            if (profileEmail) profileEmail.value = currentUser.email || '';
            if (profilePhone) profilePhone.value = userData.phone || '';
            if (profileSpecialization) profileSpecialization.value = userData.specialization || '';
            if (profileBio) profileBio.value = userData.bio || '';
            
            // Обновляем отображение пользователя
            updateUserDisplay(userData);
        } else {
            // Создаем профиль пользователя по умолчанию
            await createDefaultUserProfile();
            updateUserDisplay({});
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showNotification('Ошибка загрузки профиля', 'error');
    }
}

// Создание профиля пользователя по умолчанию
async function createDefaultUserProfile() {
    if (!currentUser) return;
    
    try {
        await firebase.firestore().collection('users').doc(currentUser.uid).set({
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            role: 'user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Ошибка создания профиля:', error);
    }
}

// Обновление отображения пользователя
function updateUserDisplay(userData) {
    if (userDisplayName) {
        userDisplayName.textContent = userData.displayName || currentUser.displayName || 'Пользователь';
    }
    
    if (userEmail) {
        userEmail.textContent = currentUser.email || '';
    }
    
    if (userRoleBadge) {
        const role = userData.role || 'user';
        if (typeof RoleManager !== 'undefined') {
            userRoleBadge.textContent = RoleManager.getRoleDisplayName(role);
            userRoleBadge.className = RoleManager.getRoleBadgeClass(role);
        } else {
            userRoleBadge.textContent = getRoleDisplayName(role);
            userRoleBadge.className = `badge ${getRoleBadgeClass(role)}`;
        }
    }
}

// Получение отображаемого имени роли
function getRoleDisplayName(role) {
    const roleNames = {
        'user': 'Пользователь',
        'admin': 'Администратор',
        'moderator': 'Модератор'
    };
    return roleNames[role] || 'Пользователь';
}

// Получение CSS класса для роли
function getRoleBadgeClass(role) {
    const roleClasses = {
        'user': 'bg-primary',
        'admin': 'bg-danger',
        'moderator': 'bg-warning'
    };
    return roleClasses[role] || 'bg-primary';
}

// Обработка обновления профиля
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const updateData = {
        displayName: profileName.value,
        phone: profilePhone.value,
        specialization: profileSpecialization.value,
        bio: profileBio.value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Обновляем в Firestore
        await firebase.firestore().collection('users').doc(currentUser.uid).update(updateData);
        
        // Обновляем в Firebase Auth
        await currentUser.updateProfile({
            displayName: profileName.value
        });
        
        // Обновляем отображение
        updateUserDisplay(updateData);
        
        showNotification('Профиль успешно обновлен', 'success');
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        showNotification('Ошибка обновления профиля', 'error');
    }
}

// Загрузка курсов пользователя
async function loadUserCourses() {
    const coursesList = document.getElementById('user-courses-list');
    if (!coursesList) return;
    
    try {
        // Получаем курсы пользователя из Firestore
        const userCoursesSnapshot = await firebase.firestore()
            .collection('userCourses')
            .where('userId', '==', currentUser.uid)
            .get();
        
        if (userCoursesSnapshot.empty) {
            coursesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-play-circle"></i>
                    <h5>Курсы не найдены</h5>
                    <p>Вы еще не записались ни на один курс</p>
                    <a href="index.html" class="btn btn-primary">Посмотреть курсы</a>
                </div>
            `;
            return;
        }
        
        let coursesHTML = '';
        
        for (const doc of userCoursesSnapshot.docs) {
            const userCourse = doc.data();
            const courseDoc = await firebase.firestore()
                .collection('courses')
                .doc(userCourse.courseId)
                .get();
            
            if (courseDoc.exists) {
                const course = courseDoc.data();
                const progress = userCourse.progress || 0;
                
                coursesHTML += `
                    <div class="course-card">
                        <h6>${course.title}</h6>
                        <p>${course.description}</p>
                        <div class="course-progress">
                            <div class="d-flex justify-content-between mb-1">
                                <small>Прогресс</small>
                                <small>${progress}%</small>
                            </div>
                            <div class="progress">
                                <div class="progress-bar" style="width: ${progress}%"></div>
                            </div>
                        </div>
                        <div class="course-actions">
                            <button class="btn btn-primary btn-sm" onclick="startCourse('${doc.id}')">
                                <i class="fas fa-play me-1"></i>Продолжить
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="viewCourseDetails('${doc.id}')">
                                <i class="fas fa-info-circle me-1"></i>Подробнее
                            </button>
                        </div>
                    </div>
                `;
            }
        }
        
        coursesList.innerHTML = coursesHTML;
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
        coursesList.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Ошибка загрузки курсов
            </div>
        `;
    }
}

// Загрузка прогресса пользователя
async function loadUserProgress() {
    try {
        // Получаем статистику пользователя
        const userStatsSnapshot = await firebase.firestore()
            .collection('userStats')
            .doc(currentUser.uid)
            .get();
        
        let stats = {
            coursesStarted: 0,
            coursesCompleted: 0,
            totalTime: 0
        };
        
        if (userStatsSnapshot.exists) {
            stats = userStatsSnapshot.data();
        }
        
        // Обновляем отображение
        const coursesStartedEl = document.getElementById('courses-started');
        const coursesCompletedEl = document.getElementById('courses-completed');
        const totalTimeEl = document.getElementById('total-time');
        
        if (coursesStartedEl) coursesStartedEl.textContent = stats.coursesStarted || 0;
        if (coursesCompletedEl) coursesCompletedEl.textContent = stats.coursesCompleted || 0;
        if (totalTimeEl) totalTimeEl.textContent = `${stats.totalTime || 0}ч`;
    } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
    }
}

// Настройка админских функций
function setupAdminFeatures() {
    if (!profileIsAdmin) return;
    
    // Показываем админские вкладки
    document.querySelectorAll('.admin-only').forEach(element => {
        element.style.display = 'block';
    });
    
    // Показываем админские элементы в навигации
    document.querySelectorAll('.admin-only.list-group-item').forEach(element => {
        element.style.display = 'flex';
    });
}

// Настройка обработчиков для админских функций
function setupAdminEventListeners() {
    // Создание курса
    const createCourseBtn = document.getElementById('create-course-btn');
    if (createCourseBtn) {
        createCourseBtn.addEventListener('click', () => {
            window.location.href = 'index.html#create-course-page';
        });
    }
    
    // Синхронизация товаров
    const syncProductsBtn = document.getElementById('sync-products-btn');
    if (syncProductsBtn) {
        syncProductsBtn.addEventListener('click', syncProductsWithGoogleSheets);
    }
    
    // Добавление товара
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', showAddProductModal);
    }
}

// Загрузка пользователей для админки
async function loadAdminUsers() {
    const usersList = document.getElementById('admin-users-list');
    if (!usersList) return;
    
    try {
        let users = [];
        
        // Используем новую систему управления ролями, если доступна
        if (typeof RoleManager !== 'undefined') {
            users = await RoleManager.getAllUsersWithRoles();
        } else {
            // Fallback к старой системе
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
                    createdAt: userData.createdAt
                });
            });
        }
        
        let usersHTML = '';
        
        users.forEach(user => {
            const createdAt = user.createdAt ? user.createdAt.toDate() : new Date();
            
            // Используем новую систему для создания селекта ролей
            const roleSelect = typeof RoleManager !== 'undefined' 
                ? RoleManager.createRoleSelect(user.role, user.id)
                : `
                    <select class="form-select form-select-sm" onchange="updateUserRole('${user.id}', this.value)">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                        <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Модератор</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                    </select>
                `;
            
            usersHTML += `
                <tr>
                    <td>${user.displayName}</td>
                    <td>${user.email}</td>
                    <td>${roleSelect}</td>
                    <td>${createdAt.toLocaleDateString('ru-RU')}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editUser('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        usersList.innerHTML = usersHTML;
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        usersList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Ошибка загрузки пользователей: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Загрузка курсов для админки
async function loadAdminCourses() {
    const coursesList = document.getElementById('admin-courses-list');
    if (!coursesList) return;
    
    try {
        const coursesSnapshot = await firebase.firestore()
            .collection('courses')
            .orderBy('createdAt', 'desc')
            .get();
        
        let coursesHTML = '';
        
        coursesSnapshot.forEach(doc => {
            const course = doc.data();
            
            coursesHTML += `
                <tr>
                    <td>${course.title || 'Без названия'}</td>
                    <td>${course.category || 'Не указана'}</td>
                    <td>${course.level || 'Не указан'}</td>
                    <td>${course.studentsCount || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editCourse('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCourse('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        coursesList.innerHTML = coursesHTML;
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
        coursesList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Ошибка загрузки курсов
                </td>
            </tr>
        `;
    }
}

// Загрузка товаров для админки
async function loadAdminProducts() {
    const productsList = document.getElementById('admin-products-list');
    if (!productsList) return;
    
    try {
        // Загружаем товары из Google Sheets
        const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://docs.google.com/spreadsheets/d/1Hxmx_tznE64ifvKON4-waL6x7BYQ7plf1nWta5nsMlI/export?format=csv&gid=0'));
        const csvText = await response.text();
        const products = parseCSV(csvText);
        
        let productsHTML = '';
        
        products.slice(0, 10).forEach(product => { // Показываем только первые 10
            productsHTML += `
                <tr>
                    <td>${product['id'] || '-'}</td>
                    <td>${product['наименование'] || 'Без названия'}</td>
                    <td>${product['цена'] || 'Не указана'}</td>
                    <td>${getProductCategory(product)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editProduct('${product['id']}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${product['id']}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        productsList.innerHTML = productsHTML;
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        productsList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Ошибка загрузки товаров
                </td>
            </tr>
        `;
    }
}

// Загрузка аналитики для админки
async function loadAdminAnalytics() {
    try {
        // Получаем общую статистику
        const usersSnapshot = await firebase.firestore().collection('users').get();
        const coursesSnapshot = await firebase.firestore().collection('courses').get();
        
        const totalUsers = usersSnapshot.size;
        const totalCourses = coursesSnapshot.size;
        
        // Обновляем отображение
        const totalUsersEl = document.getElementById('total-users');
        const totalCoursesEl = document.getElementById('total-courses');
        const activeCoursesEl = document.getElementById('active-courses');
        const totalProductsEl = document.getElementById('total-products');
        
        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
        if (totalCoursesEl) totalCoursesEl.textContent = totalCourses;
        if (activeCoursesEl) activeCoursesEl.textContent = totalCourses; // Упрощенно
        if (totalProductsEl) totalProductsEl.textContent = 'Загружается...';
        
        // Загружаем количество товаров
        try {
            const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://docs.google.com/spreadsheets/d/1Hxmx_tznE64ifvKON4-waL6x7BYQ7plf1nWta5nsMlI/export?format=csv&gid=0'));
            const csvText = await response.text();
            const products = parseCSV(csvText);
            if (totalProductsEl) totalProductsEl.textContent = products.length;
        } catch (error) {
            if (totalProductsEl) totalProductsEl.textContent = 'Ошибка';
        }
    } catch (error) {
        console.error('Ошибка загрузки аналитики:', error);
    }
}

// Вспомогательные функции
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        
        if (values.length >= headers.length) {
            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index] || '';
            });
            
            if (product['наименование'] && product['наименование'].trim()) {
                products.push(product);
            }
        }
    }
    
    return products;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

function getProductCategory(product) {
    const name = (product['наименование'] || '').toLowerCase();
    if (name.includes('3d') || name.includes('принтер')) return '3D принтеры';
    if (name.includes('сканер')) return 'Сканеры';
    if (name.includes('фрезер') || name.includes('станок')) return 'Фрезерные станки';
    if (name.includes('материал') || name.includes('смола')) return 'Материалы';
    return 'Другое';
}

// Показ контента профиля
function showProfileContent() {
    if (authRequired) authRequired.style.display = 'none';
    if (profileContent) profileContent.style.display = 'block';
    if (loginLink) loginLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'block';
}

// Показ требования авторизации
function showAuthRequired() {
    if (authRequired) authRequired.style.display = 'block';
    if (profileContent) profileContent.style.display = 'none';
    if (loginLink) loginLink.style.display = 'block';
    if (logoutLink) logoutLink.style.display = 'none';
}

// Обработка выхода
function handleLogout() {
    if (typeof firebase !== 'undefined') {
        firebase.auth().signOut().then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Ошибка при выходе:', error);
        });
    }
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    const alertClass = type === 'error' ? 'alert-danger' : `alert-${type}`;
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
    `;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Админские функции (заглушки)
function updateUserRole(userId, newRole) {
    console.log(`Обновление роли пользователя ${userId} на ${newRole}`);
    // Реализация обновления роли
}

function editUser(userId) {
    console.log(`Редактирование пользователя ${userId}`);
    // Реализация редактирования пользователя
}

function deleteUser(userId) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        console.log(`Удаление пользователя ${userId}`);
        // Реализация удаления пользователя
    }
}

function editCourse(courseId) {
    console.log(`Редактирование курса ${courseId}`);
    // Реализация редактирования курса
}

function deleteCourse(courseId) {
    if (confirm('Вы уверены, что хотите удалить этот курс?')) {
        console.log(`Удаление курса ${courseId}`);
        // Реализация удаления курса
    }
}

function editProduct(productId) {
    console.log(`Редактирование товара ${productId}`);
    // Реализация редактирования товара
}

function deleteProduct(productId) {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
        console.log(`Удаление товара ${productId}`);
        // Реализация удаления товара
    }
}

function syncProductsWithGoogleSheets() {
    console.log('Синхронизация товаров с Google Sheets');
    // Реализация синхронизации
}

function showAddProductModal() {
    console.log('Показ модального окна добавления товара');
    // Реализация добавления товара
}

// Экспорт функций для глобального использования
window.profileModule = {
    switchTab,
    loadUserProfile,
    loadUserCourses,
    loadUserProgress
};

