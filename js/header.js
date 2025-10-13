// Скрипт для управления единым хедером

// Инициализация хедера
document.addEventListener('DOMContentLoaded', function() {
    initializeHeader();
    setupScrollEffects();
    setupMobileMenu();
    setActiveNavItem();
});

// Инициализация хедера
function initializeHeader() {
    console.log('Инициализация хедера...');
    
    // Исправляем пути в зависимости от текущей папки
    fixNavigationPaths();
    
    // Синхронизируем состояние авторизации между основным и мобильным меню
    syncAuthState();
    
    // Настраиваем обработчики событий
    setupAuthHandlers();
}

// Исправление путей навигации в зависимости от текущей папки
function fixNavigationPaths() {
    const currentPath = window.location.pathname;
    const isInSubfolder = currentPath.includes('/introduction/');
    
    console.log('Текущий путь:', currentPath);
    console.log('В подпапке introduction:', isInSubfolder);
    
    if (isInSubfolder) {
        // Мы находимся в папке introduction/, нужно добавить "../" к путям
        const navItems = document.querySelectorAll('.nav-item[href], .mobile-nav-item[href]');
        
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            
            // Пропускаем якорные ссылки и внешние ссылки
            if (href.startsWith('#') || href.startsWith('http') || href.includes('://')) {
                return;
            }
            
            // Исправляем пути для основных страниц
            if (href === 'index.html') {
                item.setAttribute('href', '../index.html');
            } else if (href === 'courses.html') {
                item.setAttribute('href', '../courses.html');
            } else if (href === 'team.html') {
                item.setAttribute('href', '../team.html');
            } else if (href === 'educational-catalog.html') {
                item.setAttribute('href', '../educational-catalog.html');
            } else if (href === 'login.html') {
                item.setAttribute('href', '../login.html');
            } else if (href === 'profile.html') {
                item.setAttribute('href', '../profile.html');
            } else if (href === 'index.html' && item.getAttribute('data-page') === 'introduction') {
                // Ссылка "Введение" должна вести на корневой index.html
                item.setAttribute('href', '../index.html');
            }
        });
        
        // Исправляем логотип
        const logoLink = document.querySelector('.logo-link[href]');
        if (logoLink && logoLink.getAttribute('href') === 'index.html') {
            logoLink.setAttribute('href', '../index.html');
        }
        
        console.log('Пути исправлены для подпапки introduction/');
    }
}

// Настройка эффектов при скролле
function setupScrollEffects() {
    const header = document.querySelector('.main-header');
    if (!header) return;
    
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        // Добавляем класс при скролле
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    });
}

// Настройка мобильного меню
function setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (!mobileToggle || !mobileNav) return;
    
    mobileToggle.addEventListener('click', function() {
        const isExpanded = mobileNav.classList.contains('show');
        
        if (isExpanded) {
            mobileNav.classList.remove('show');
            mobileToggle.setAttribute('aria-expanded', 'false');
        } else {
            mobileNav.classList.add('show');
            mobileToggle.setAttribute('aria-expanded', 'true');
        }
    });
    
    // Закрываем меню при клике на ссылку
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
            mobileNav.classList.remove('show');
            mobileToggle.setAttribute('aria-expanded', 'false');
        });
    });
    
    // Закрываем меню при клике вне его
    document.addEventListener('click', function(event) {
        if (!mobileToggle.contains(event.target) && !mobileNav.contains(event.target)) {
            mobileNav.classList.remove('show');
            mobileToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Установка активного элемента навигации
function setActiveNavItem() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    
    // Убираем активный класс со всех элементов
    navItems.forEach(item => item.classList.remove('active'));
    
    // Определяем активную страницу
    let activePage = 'home'; // по умолчанию
    
    if (currentPath.includes('courses.html')) {
        activePage = 'courses';
    } else if (currentPath.includes('/introduction/')) {
        // Страницы в папке introduction/ больше не связаны с кнопкой "Введение"
        // Кнопка "Введение" теперь ведет на главную страницу
        activePage = 'home';
    } else if (currentPath.includes('team.html')) {
        activePage = 'team';
    } else if (currentPath.includes('educational-catalog.html')) {
        activePage = 'equipment';
    } else if (currentPath.includes('index.html') || currentPath === '/' || currentPath === '') {
        activePage = 'home';
    }
    
    // Устанавливаем активный класс
    const activeNavItem = document.querySelector(`.nav-item[data-page="${activePage}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

// Синхронизация состояния авторизации
function syncAuthState() {
    // Получаем элементы основного меню
    const loginLink = document.getElementById('login-link');
    const profileLink = document.getElementById('profile-link');
    const logoutLink = document.getElementById('logout-link');
    const userInfo = document.getElementById('user-info');
    
    // Получаем элементы мобильного меню
    const mobileLoginLink = document.getElementById('mobile-login-link');
    const mobileProfileLink = document.getElementById('mobile-profile-link');
    const mobileLogoutLink = document.getElementById('mobile-logout-link');
    
    // Проверяем состояние авторизации (если есть Firebase Auth)
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            updateAuthUI(user, {
                loginLink,
                profileLink,
                logoutLink,
                userInfo,
                mobileLoginLink,
                mobileProfileLink,
                mobileLogoutLink
            });
        });
    }
}

// Обновление UI авторизации
function updateAuthUI(user, elements) {
    const {
        loginLink,
        profileLink,
        logoutLink,
        userInfo,
        mobileLoginLink,
        mobileProfileLink,
        mobileLogoutLink
    } = elements;
    
    if (user) {
        // Пользователь авторизован
        if (loginLink) loginLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'flex';
        if (logoutLink) logoutLink.style.display = 'flex';
        if (userInfo) {
            userInfo.style.display = 'block';
            userInfo.textContent = user.email || 'Пользователь';
        }
        
        // Мобильное меню
        if (mobileLoginLink) mobileLoginLink.style.display = 'none';
        if (mobileProfileLink) mobileProfileLink.style.display = 'flex';
        if (mobileLogoutLink) mobileLogoutLink.style.display = 'flex';
    } else {
        // Пользователь не авторизован
        if (loginLink) loginLink.style.display = 'flex';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        
        // Мобильное меню
        if (mobileLoginLink) mobileLoginLink.style.display = 'flex';
        if (mobileProfileLink) mobileProfileLink.style.display = 'none';
        if (mobileLogoutLink) mobileLogoutLink.style.display = 'none';
    }
}

// Настройка обработчиков авторизации
function setupAuthHandlers() {
    // Обработчик выхода для основного меню
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Обработчик выхода для мобильного меню
    const mobileLogoutLink = document.getElementById('mobile-logout-link');
    if (mobileLogoutLink) {
        mobileLogoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
}

// Обработка выхода
function handleLogout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().then(function() {
            console.log('Пользователь вышел из системы');
            // Перенаправляем на главную страницу
            window.location.href = 'index.html';
        }).catch(function(error) {
            console.error('Ошибка при выходе:', error);
        });
    } else {
        // Если Firebase не подключен, просто перенаправляем
        window.location.href = 'index.html';
    }
}

// Утилиты для работы с хедером
window.HeaderUtils = {
    // Показать/скрыть элементы авторизации
    setAuthState: function(isLoggedIn, userEmail = '') {
        const elements = {
            loginLink: document.getElementById('login-link'),
            profileLink: document.getElementById('profile-link'),
            logoutLink: document.getElementById('logout-link'),
            userInfo: document.getElementById('user-info'),
            mobileLoginLink: document.getElementById('mobile-login-link'),
            mobileProfileLink: document.getElementById('mobile-profile-link'),
            mobileLogoutLink: document.getElementById('mobile-logout-link')
        };
        
        const user = isLoggedIn ? { email: userEmail } : null;
        updateAuthUI(user, elements);
    },
    
    // Установить активную страницу
    setActivePage: function(pageName) {
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        navItems.forEach(item => item.classList.remove('active'));
        
        const activeItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    },
    
    // Показать уведомление в хедере
    showNotification: function(message, type = 'info') {
        // Можно добавить систему уведомлений в хедере
        console.log(`${type.toUpperCase()}: ${message}`);
    }
};
