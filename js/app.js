// Основной файл приложения - инициализация и навигация

// Глобальные переменные состояния приложения
let currentUser = null;
let isAdmin = false;

// Элементы DOM (объявляем только если они существуют)
const homePage = document.getElementById('home-page');
const coursesPage = document.getElementById('courses-page');
const adminPage = document.getElementById('admin-page');
const loginPage = document.getElementById('login-page');
const registerPage = document.getElementById('register-page');
const videoPlayerPage = document.getElementById('video-player-page');
const createCoursePage = document.getElementById('create-course-page');
const courseDetailPage = document.getElementById('course-detail-page');

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

// Элементы навигации
const profileLink = document.getElementById('profile-link');

// Функции навигации
function showPage(page) {
    if (!page) return;
    
    // Массив всех страниц для скрытия
    const allPages = [homePage, coursesPage, adminPage, loginPage, registerPage, videoPlayerPage, createCoursePage, courseDetailPage];
    
    // Скрыть все страницы
    allPages.forEach(pageElement => {
        if (pageElement) {
            pageElement.classList.add('hidden');
        }
    });
    
    // Показать нужную страницу
    page.classList.remove('hidden');
    
    // Прокрутить к верху страницы
    window.scrollTo(0, 0);
    
    // Обновить активную ссылку в навигации
    updateActiveNavLink(page);
}

function updateActiveNavLink(activePage) {
    if (!activePage) return;
    
    // Убрать активный класс со всех ссылок
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Добавить активный класс к соответствующей ссылке
    if (activePage === homePage && homeLink) {
        homeLink.classList.add('active');
    } else if (activePage === coursesPage && coursesLink) {
        coursesLink.classList.add('active');
    } else if (activePage === adminPage && adminLink) {
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
        if (newUserWelcome) newUserWelcome.classList.add('hidden');
        if (returningUserWelcome) returningUserWelcome.classList.add('hidden');
        return;
    }
    
    if (checkIfNewUser()) {
        if (newUserWelcome) newUserWelcome.classList.remove('hidden');
        if (returningUserWelcome) returningUserWelcome.classList.add('hidden');
    } else {
        if (newUserWelcome) newUserWelcome.classList.add('hidden');
        if (returningUserWelcome) returningUserWelcome.classList.remove('hidden');
    }
}

// Загрузка популярных курсов на главную
function loadFeaturedCourses() {
    if (!featuredCourses) return;
    
    featuredCourses.innerHTML = '';
    
    // Загрузка курсов из Firebase
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        firebase.firestore().collection('courses').limit(3).get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    // Показываем демо-курсы если нет реальных
                    showDemoFeaturedCourses();
                    return;
                }
                
                querySnapshot.forEach((doc) => {
                    const course = doc.data();
                    const courseId = doc.id;
                    
                    const courseCard = `
                        <div class="col-md-4">
                            <div class="card course-card h-100">
                                <div class="course-image">
                                    <i class="fas fa-graduation-cap"></i>
                                </div>
                                <div class="card-body d-flex flex-column">
                                    <div class="course-badges mb-2">
                                        <span class="badge bg-primary">${course.category}</span>
                                        <span class="badge bg-secondary">${course.level}</span>
                                    </div>
                                    <h5 class="card-title">${course.title}</h5>
                                    <p class="card-text flex-grow-1">${course.description}</p>
                                    <div class="course-meta mt-auto">
                                        <small class="text-muted">
                                            <i class="fas fa-clock me-1"></i>${course.duration || 1} час
                                        </small>
                                    </div>
                                    <button class="btn btn-primary mt-3 view-course-detail" data-course-id="${courseId}">
                                        Подробнее
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    featuredCourses.innerHTML += courseCard;
                });
                
                // Добавляем обработчики для кнопок просмотра деталей
                document.querySelectorAll('.view-course-detail').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const courseId = e.target.getAttribute('data-course-id');
                        showCourseDetail(courseId);
                    });
                });
            })
            .catch((error) => {
                console.error('Ошибка загрузки популярных курсов:', error);
                showDemoFeaturedCourses();
            });
    } else {
        showDemoFeaturedCourses();
    }
}

// Показать демо-курсы при ошибке загрузки
function showDemoFeaturedCourses() {
    if (!featuredCourses) return;
    
    const demoCourses = [
        {
            id: 1,
            title: "Основы CAD/CAM технологий",
            description: "Изучите базовые принципы работы с цифровыми стоматологическими системами",
            category: "CAD/CAM",
            level: "Начальный",
            duration: 2
        },
        {
            id: 2,
            title: "3D моделирование в стоматологии",
            description: "Освойте создание цифровых моделей зубов и реставраций",
            category: "3D Моделирование",
            level: "Продвинутый",
            duration: 3
        },
        {
            id: 3,
            title: "Цифровая имплантология",
            description: "Современные подходы к планированию и проведению имплантации",
            category: "Имплантология",
            level: "Профессиональный",
            duration: 4
        }
    ];
    
    demoCourses.forEach(course => {
        const courseCard = `
            <div class="col-md-4">
                <div class="card course-card h-100">
                    <div class="course-image">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="course-badges mb-2">
                            <span class="badge bg-primary">${course.category}</span>
                            <span class="badge bg-secondary">${course.level}</span>
                        </div>
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text flex-grow-1">${course.description}</p>
                        <div class="course-meta mt-auto">
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>${course.duration} час
                            </small>
                        </div>
                        <button class="btn btn-primary mt-3" onclick="${loginPage ? 'showPage(loginPage)' : 'alert(\"Требуется авторизация\")'}">
                            Начать обучение
                        </button>
                    </div>
                </div>
            </div>
        `;
        featuredCourses.innerHTML += courseCard;
    });
}

// Обработчики событий (добавляем только если элементы существуют)
if (homeLink) {
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(homePage);
    });
}

if (coursesLink) {
    coursesLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            showPage(coursesPage);
            if (typeof loadCourses === 'function') loadCourses();
        } else {
            showPage(loginPage);
        }
    });
}

if (adminLink) {
    adminLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(adminPage);
        if (typeof loadAdminData === 'function') loadAdminData();
    });
}

if (loginLink) {
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(loginPage);
    });
}

if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
    });
}

if (startLearningBtn) {
    startLearningBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleStartLearning();
    });
}

if (continueLearningBtn) {
    continueLearningBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(coursesPage);
        if (typeof loadCourses === 'function') loadCourses();
    });
}

if (viewAllCoursesBtn) {
    viewAllCoursesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            showPage(coursesPage);
            if (typeof loadCourses === 'function') loadCourses();
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
            if (typeof loadCourses === 'function') loadCourses();
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
    if (loginLink) loginLink.style.display = 'none';
    if (profileLink) profileLink.style.display = 'block';
    if (logoutLink) logoutLink.style.display = 'block';
    if (userInfo) {
        userInfo.style.display = 'block';
        userInfo.textContent = `Привет, ${user.displayName || user.email}`;
    }
    
    if (isAdmin && adminLink) {
        adminLink.style.display = 'block';
        // Добавляем кнопку создания курса в навигацию
        addCreateCourseButton();
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
        if (loginLink) loginLink.style.display = 'block';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        
        // Удалить кнопку создания курса
        removeCreateCourseButton();
        
        // Скрыть приветствия
        showUserWelcome();
        
        // Вернуться на главную
        showPage(homePage);
    }).catch((error) => {
        console.error('Ошибка при выходе:', error);
    });
}

// Добавить кнопку создания курса для админов
function addCreateCourseButton() {
    // Проверяем, не добавлена ли уже кнопка
    if (document.getElementById('create-course-link')) return;
    
    const createCourseLink = document.createElement('li');
    createCourseLink.className = 'nav-item';
    createCourseLink.id = 'create-course-link';
    createCourseLink.innerHTML = `
        <a class="nav-link" href="#" id="create-course-btn">
            <i class="fas fa-plus-circle me-1"></i>Создать курс
        </a>
    `;
    
    // Вставляем перед кнопкой админ-панели
    if (adminLink && adminLink.parentNode) {
        adminLink.parentNode.parentNode.insertBefore(createCourseLink, adminLink.parentNode);
    }
    
    // Добавляем обработчик
    const createCourseBtn = document.getElementById('create-course-btn');
    if (createCourseBtn) {
        createCourseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showCreateCoursePage();
        });
    }
}

// Удалить кнопку создания курса
function removeCreateCourseButton() {
    const createCourseLink = document.getElementById('create-course-link');
    if (createCourseLink) {
        createCourseLink.remove();
    }
}

// Показать страницу создания курса
function showCreateCoursePage() {
    if (createCoursePage) {
        resetCourseForm();
        showPage(createCoursePage);
    }
}

// Сброс формы курса
function resetCourseForm() {
    const createCourseForm = document.getElementById('create-course-form');
    if (createCourseForm) {
        createCourseForm.reset();
        const courseContent = document.getElementById('course-content');
        if (courseContent) {
            courseContent.innerHTML = '';
        }
        // Используем window для глобальных переменных
        if (window.contentBlocks) window.contentBlocks = [];
        if (window.currentEditingCourse) window.currentEditingCourse = null;
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Firebase
    if (typeof initializeFirebase === 'function') {
        initializeFirebase();
    }
    
    // Инициализация курсов
    if (typeof initCourses === 'function') {
        initCourses();
    }
    
    // Проверить состояние аутентификации
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // Пользователь вошел в систему
                if (typeof checkUserRole === 'function') {
                    checkUserRole(user.uid).then(role => {
                        loginUser(user, role === 'admin');
                    });
                } else {
                    loginUser(user, false);
                }
            } else {
                // Пользователь вышел из системы
                logoutUser();
            }
        });
    }
    
    // Загрузить популярные курсы для гостей
    loadFeaturedCourses();
    
    // По умолчанию показываем главную страницу
    if (homePage) {
        showPage(homePage);
    }
});

// Глобальные переменные для курсов (для обратной совместимости)
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