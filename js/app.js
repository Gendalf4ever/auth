// Основной файл приложения - инициализация и навигация

// Глобальные переменные состояния приложения
let currentUser = null;
let isAdmin = false;

// Элементы DOM
const homePage = document.getElementById('home-page');
const coursesPage = document.getElementById('courses-page');
const adminPage = document.getElementById('admin-page');
const loginPage = document.getElementById('login-page');
const registerPage = document.getElementById('register-page');
const videoPlayerPage = document.getElementById('video-player-page');

const newUserWelcome = document.getElementById('new-user-welcome');
const returningUserWelcome = document.getElementById('returning-user-welcome');

// Навигационные элементы
const homeLink = document.getElementById('home-link');
const coursesLink = document.getElementById('courses-link');
const adminLink = document.getElementById('admin-link');
const loginLink = document.getElementById('login-link');
const logoutLink = document.getElementById('logout-link');
const startLearningBtn = document.getElementById('start-learning-btn');
const continueLearningBtn = document.getElementById('continue-learning-btn');
const viewAllCoursesBtn = document.getElementById('view-all-courses-btn');
const userInfo = document.getElementById('user-info');

// Элементы для курсов
const featuredCourses = document.getElementById('featured-courses');
const coursesList = document.getElementById('courses-list');
const categoryList = document.getElementById('category-list');
const courseSearch = document.getElementById('course-search');

// Функции навигации
function showPage(page) {
    // Скрыть все страницы
    homePage.classList.add('hidden');
    coursesPage.classList.add('hidden');
    adminPage.classList.add('hidden');
    loginPage.classList.add('hidden');
    registerPage.classList.add('hidden');
    videoPlayerPage.classList.add('hidden');
    
    // Показать нужную страницу
    page.classList.remove('hidden');
    
    // Прокрутить к верху страницы
    window.scrollTo(0, 0);
    
    // Обновить активную ссылку в навигации
    updateActiveNavLink(page);
}

function updateActiveNavLink(activePage) {
    // Убрать активный класс со всех ссылок
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Добавить активный класс к соответствующей ссылке
    if (activePage === homePage) {
        homeLink.classList.add('active');
    } else if (activePage === coursesPage) {
        coursesLink.classList.add('active');
    } else if (activePage === adminPage) {
        adminLink.classList.add('active');
    }
}

// Проверка, является ли пользователь новым
function checkIfNewUser() {
    const introductionCompleted = localStorage.getItem('introductionCompleted');
    return !introductionCompleted;
}

// Показать соответствующее приветствие
function showUserWelcome() {
    if (!currentUser) {
        newUserWelcome.classList.add('hidden');
        returningUserWelcome.classList.add('hidden');
        return;
    }
    
    if (checkIfNewUser()) {
        newUserWelcome.classList.remove('hidden');
        returningUserWelcome.classList.add('hidden');
    } else {
        newUserWelcome.classList.add('hidden');
        returningUserWelcome.classList.remove('hidden');
    }
}

// Загрузка популярных курсов на главную
function loadFeaturedCourses() {
    featuredCourses.innerHTML = '';
    
    // Временные данные для примера
    const featured = sampleCourses.slice(0, 3);
    
    featured.forEach(course => {
        const courseCard = `
            <div class="col-md-4">
                <div class="card course-card">
                    <div class="course-image">
                        <i class="fas fa-play-circle"></i>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text">${course.description}</p>
                        <div class="course-meta">
                            <span class="lessons"><i class="fas fa-play-circle me-1"></i>${course.videos.length} уроков</span>
                            <span class="level"><i class="fas fa-signal me-1"></i>${course.level}</span>
                        </div>
                        <button class="btn btn-primary w-100 mt-3 view-course-btn" data-course-id="${course.id}">
                            Начать курс
                        </button>
                    </div>
                </div>
            </div>
        `;
        featuredCourses.innerHTML += courseCard;
    });
    
    // Добавить обработчики для кнопок
    document.querySelectorAll('.view-course-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            if (currentUser) {
                const courseId = e.target.getAttribute('data-course-id');
                openCourse(courseId);
            } else {
                showPage(loginPage);
            }
        });
    });
}

// Обработчики событий
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(homePage);
});

coursesLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser) {
        showPage(coursesPage);
        loadCourses();
    } else {
        showPage(loginPage);
    }
});

adminLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(adminPage);
    loadAdminData();
});

loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(loginPage);
});

logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    logoutUser();
});

startLearningBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleStartLearning();
});

if (continueLearningBtn) {
    continueLearningBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(coursesPage);
        loadCourses();
    });
}

if (viewAllCoursesBtn) {
    viewAllCoursesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            showPage(coursesPage);
            loadCourses();
        } else {
            showPage(loginPage);
        }
    });
}

// Обработчик начала обучения
function handleStartLearning() {
    if (currentUser) {
        if (checkIfNewUser()) {
            // Новый пользователь - перенаправляем на введение
            window.location.href = 'introduction.html';
        } else {
            // Существующий пользователь - показываем курсы
            showPage(coursesPage);
            loadCourses();
        }
    } else {
        // Не авторизован - показываем страницу входа
        showPage(loginPage);
    }
}

// Функции для работы с пользователями
function loginUser(user, admin = false) {
    currentUser = user;
    isAdmin = admin;
    
    // Обновить интерфейс
    loginLink.style.display = 'none';
    logoutLink.style.display = 'block';
    userInfo.style.display = 'block';
    userInfo.textContent = `Привет, ${user.displayName || user.email}`;
    
    if (isAdmin) {
        adminLink.style.display = 'block';
    }
    
    // Показать соответствующее приветствие
    showUserWelcome();
    
    // Загрузить популярные курсы
    loadFeaturedCourses();
    
    // Вернуться на главную
    showPage(homePage);
}

function logoutUser() {
    // Выйти из Firebase
    firebase.auth().signOut().then(() => {
        currentUser = null;
        isAdmin = false;
        
        // Обновить интерфейс
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';
        adminLink.style.display = 'none';
        userInfo.style.display = 'none';
        
        // Скрыть приветствия
        showUserWelcome();
        
        // Вернуться на главную
        showPage(homePage);
    }).catch((error) => {
        console.error('Ошибка при выходе:', error);
    });
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Firebase
    initializeFirebase();
    
    // Проверить состояние аутентификации
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Пользователь вошел в систему
            checkUserRole(user.uid).then(role => {
                loginUser(user, role === 'admin');
            });
        } else {
            // Пользователь вышел из системы
            logoutUser();
        }
    });
    
    // Загрузить популярные курсы для гостей
    loadFeaturedCourses();
    
    // По умолчанию показываем главную страницу
    showPage(homePage);
});

// Обновить sampleCourses с дополнительными полями
const sampleCourses = [
    {
        id: 1,
        title: "Основы CAD/CAM технологий",
        description: "Изучите базовые принципы работы с цифровыми стоматологическими системами",
        thumbnail: "cadcam-basics.jpg",
        level: "Начальный",
        category: "CAD/CAM",
        videos: [
            { id: 1, title: "Введение в CAD/CAM", duration: "15:30", url: "videos/cadcam-intro.mp4" },
            { id: 2, title: "Оборудование и материалы", duration: "22:15", url: "videos/equipment.mp4" }
        ]
    },
    {
        id: 2,
        title: "3D моделирование в стоматологии",
        description: "Освойте создание цифровых моделей зубов и реставраций",
        thumbnail: "3d-modeling.jpg",
        level: "Продвинутый",
        category: "3D Моделирование",
        videos: [
            { id: 1, title: "Основы 3D моделирования", duration: "20:10", url: "videos/3d-basics.mp4" }
        ]
    },
    {
        id: 3,
        title: "Цифровая имплантология",
        description: "Современные подходы к планированию и проведению имплантации",
        thumbnail: "digital-implantology.jpg",
        level: "Профессиональный",
        category: "Имплантология",
        videos: [
            { id: 1, title: "Цифровое планирование", duration: "25:30", url: "videos/planning.mp4" }
        ]
    }
];