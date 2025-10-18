// Файл для работы с курсами

// Переменные (не объявляем заново, если уже объявлены в app.js)
let currentEditingCourse = null;
let contentBlocks = [];
let allCourses = []; // Храним все курсы для фильтрации

// Инициализация курсов
function initCourses() {
    loadCourses();
    setupCourseEventListeners();
}

// Настройка обработчиков событий
function setupCourseEventListeners() {
    // Обработчик формы создания курса
    const createCourseForm = document.getElementById('create-course-form');
    if (createCourseForm) {
        createCourseForm.addEventListener('submit', handleCourseSubmit);
    }
    
    // Обработчики фильтров (временно отключены)
    const filterBeginner = document.getElementById('filter-beginner');
    const filterAdvanced = document.getElementById('filter-advanced');
    const filterFree = document.getElementById('filter-free');
    const courseSearch = document.getElementById('course-search');
    
    // Пока что фильтры отключены
    console.log('Фильтры курсов временно отключены');
    
    // Обработчики кнопок на странице деталей курса
    const backToCoursesFromDetail = document.getElementById('back-to-courses-from-detail');
    const startCourseBtn = document.getElementById('start-course-btn');
    const editCourseBtn = document.getElementById('edit-course-btn');
    const deleteCourseBtn = document.getElementById('delete-course-btn');
    
    if (backToCoursesFromDetail) {
        backToCoursesFromDetail.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(coursesPage);
        });
    }
    
    if (startCourseBtn) {
        startCourseBtn.addEventListener('click', startCourse);
    }
    
    if (editCourseBtn) {
        editCourseBtn.addEventListener('click', editCourse);
    }
    
    if (deleteCourseBtn) {
        deleteCourseBtn.addEventListener('click', deleteCourse);
    }
}

// Загрузка курсов из Firebase
function loadCourses() {
    const coursesList = document.getElementById('courses-container');
    if (!coursesList) return;
    
    coursesList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    // Очищаем массив курсов
    allCourses = [];
    
    // Добавляем статичные курсы
    const staticCourses = [
        {
            id: 'intro-course',
            title: 'Введение в CODENT',
            description: 'Основы современной цифровой стоматологии, CAD/CAM системы и их применение в клинической практике.',
            category: 'Основы',
            level: 'Начальный',
            duration: '1 мин 30 сек',
            videoUrl: 'https://jumpshare.com/embed/Oujb8v8Qo5miQqg2b98m',
            isStatic: true,
            createdAt: new Date(),
            studentsCount: 0
        }
    ];
    
    // Добавляем все статичные курсы
    allCourses.push(...staticCourses);
    
    // Обновляем данные для поиска
    if (typeof allCoursesData !== 'undefined') {
        allCoursesData = [...allCourses];
        filteredCoursesData = [...allCourses];
    }
    
    // Отображаем статичные курсы напрямую
    displayCourses(allCourses);
    
    // Добавляем обработчики для кнопок просмотра деталей
    setupCourseButtons();
}

// Отображение курсов
function displayCourses(courses) {
    const coursesList = document.getElementById('courses-container');
    if (!coursesList) return;
    
    coursesList.innerHTML = '';
    
    if (courses.length === 0) {
        if (currentSearchTerm && currentSearchTerm !== '') {
            coursesList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        <i class="fas fa-search fa-2x mb-3"></i>
                        <h5>Ничего не найдено</h5>
                        <p class="mb-0">По запросу "${currentSearchTerm}" курсы не найдены.</p>
                        <button class="btn btn-outline-primary mt-3" onclick="clearCourseSearch()">
                            <i class="fas fa-times me-2"></i>Очистить поиск
                        </button>
                    </div>
                </div>
            `;
        } else {
            coursesList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-book fa-3x text-muted mb-3"></i>
                    <h5>Курсы пока не добавлены</h5>
                    <p class="text-muted">Скоро здесь появятся новые курсы</p>
                </div>
            `;
        }
        return;
    }
    
    courses.forEach(course => {
        // Определяем иконку в зависимости от категории
        let categoryIcon = 'fas fa-graduation-cap';
        if (course.category === 'Сканирование') categoryIcon = 'fas fa-tooth';
        else if (course.category === 'CAD/CAM') categoryIcon = 'fas fa-cube';
        else if (course.category === '3D печать') categoryIcon = 'fas fa-print';
        else if (course.category === 'Фрезерование') categoryIcon = 'fas fa-cogs';
        else if (course.category === 'Материалы') categoryIcon = 'fas fa-gem';
        
        const courseCard = `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card course-card h-100 shadow-sm">
                    <div class="course-image">
                        <i class="${categoryIcon}"></i>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="course-badges mb-2">
                            <span class="badge bg-primary">${course.category}</span>
                            <span class="badge bg-secondary">${course.level}</span>
                        </div>
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text flex-grow-1">${course.description}</p>
                        <div class="course-meta mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>${course.duration}
                                </small>
                                ${course.videoUrl ? '<span class="badge bg-success">Видеокурс</span>' : '<span class="badge bg-info">Практический</span>'}
                            </div>
                            <button class="btn btn-primary w-100 view-course-detail" data-course-id="${course.id}">
                                <i class="fas fa-play me-2"></i>Начать курс
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        coursesList.innerHTML += courseCard;
    });
}

// Настройка кнопок курсов
function setupCourseButtons() {
    document.querySelectorAll('.view-course-detail').forEach(button => {
        button.addEventListener('click', (e) => {
            const courseId = e.target.getAttribute('data-course-id');
            showCourseDetail(courseId);
        });
    });
}

// Показать детали курса
function showCourseDetail(courseId) {
    // Ищем курс в локальном массиве
    const localCourse = allCourses.find(course => course.id === courseId);
    
    if (localCourse) {
        displayCourseDetail(localCourse, courseId);
    } else {
        console.error('Курс не найден:', courseId);
        alert('Курс не найден');
    }
}

// Отображение деталей курса
function displayCourseDetail(course, courseId) {
    currentEditingCourse = courseId;
    
    // Заполняем информацию о курсе
    const courseDetailTitle = document.getElementById('course-detail-title');
    const detailCourseTitle = document.getElementById('detail-course-title');
    const detailCourseDescription = document.getElementById('detail-course-description');
    const detailCourseCategory = document.getElementById('detail-course-category');
    const detailCourseLevel = document.getElementById('detail-course-level');
    const detailCourseDuration = document.getElementById('detail-course-duration');
    
    if (courseDetailTitle) courseDetailTitle.textContent = course.title;
    if (detailCourseTitle) detailCourseTitle.textContent = course.title;
    if (detailCourseDescription) detailCourseDescription.textContent = course.description;
    if (detailCourseCategory) detailCourseCategory.textContent = course.category;
    if (detailCourseLevel) detailCourseLevel.textContent = course.level;
    if (detailCourseDuration) detailCourseDuration.textContent = course.duration || 1;
    
    // Заполняем содержание курса
    const detailCourseContent = document.getElementById('detail-course-content');
    if (detailCourseContent) {
        detailCourseContent.innerHTML = '';
        
        // Если это статичный курс с видео
        if (course.isStatic && course.videoUrl) {
            const videoContent = `
                <div class="course-video-section mb-4">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas fa-play-circle text-primary me-2" style="font-size: 1.5rem;"></i>
                        <h5 class="mb-0">Видеоурок</h5>
                    </div>
                    <div class="video-container border rounded overflow-hidden shadow-sm" style="position: relative; padding-bottom: 56.25%; height: 0;">
                        <iframe src="${course.videoUrl}" 
                                frameborder="0" 
                                webkitallowfullscreen 
                                mozallowfullscreen 
                                allowfullscreen 
                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                                title="Видеокурс: ${course.title}">
                        </iframe>
                    </div>
                    <div class="mt-3 text-muted small">
                        <i class="fas fa-info-circle me-1"></i>
                        Для полноэкранного просмотра используйте кнопку в плеере.
                    </div>
                </div>
            `;
            detailCourseContent.innerHTML = videoContent;
        } else if (course.content && course.content.length > 0) {
            // Обычное содержание курса
            course.content.forEach((block, index) => {
                const contentBlock = createContentBlockHTML(block, index);
                detailCourseContent.innerHTML += contentBlock;
            });
        } else {
            detailCourseContent.innerHTML = '<p class="text-muted">Содержание курса пока не добавлено.</p>';
        }
    }
    
    // Показываем кнопки редактирования для админов (только для не-статичных курсов)
    const editBtn = document.getElementById('edit-course-btn');
    const deleteBtn = document.getElementById('delete-course-btn');
    if (typeof isAdmin !== 'undefined' && isAdmin && !course.isStatic) {
        if (editBtn) editBtn.style.display = 'block';
        if (deleteBtn) deleteBtn.style.display = 'block';
    } else {
        if (editBtn) editBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
    
    // Открываем модальное окно
    const courseDetailModal = document.getElementById('courseDetailModal');
    if (courseDetailModal) {
        const modal = new bootstrap.Modal(courseDetailModal);
        modal.show();
    } else {
        // Если модального окна нет, пытаемся переключиться на страницу деталей
        const courseDetailPage = document.getElementById('course-detail-page');
        if (courseDetailPage && typeof showPage !== 'undefined') {
            showPage(courseDetailPage);
        }
    }
}

// Создание HTML для блока контента
function createContentBlockHTML(block, index) {
    return `
        <div class="content-block mb-4">
            <h5>${block.title}</h5>
            <div class="content-text">${formatContentText(block.content)}</div>
        </div>
    `;
}

// Форматирование текста контента
function formatContentText(text) {
    // Заменяем маркированные списки
    text = text.replace(/\n• /g, '\n• ');
    // Заменяем переносы строк на параграфы
    const paragraphs = text.split('\n\n');
    return paragraphs.map(p => {
        if (p.trim()) {
            // Если строка начинается с •, это список
            if (p.includes('•')) {
                const listItems = p.split('\n').filter(item => item.trim());
                const listHTML = listItems.map(item => 
                    `<li>${item.replace('•', '').trim()}</li>`
                ).join('');
                return `<ul>${listHTML}</ul>`;
            } else {
                return `<p>${p}</p>`;
            }
        }
        return '';
    }).join('');
}

// Добавление блока контента при создании курса
function addContentBlock() {
    const blockId = 'block_' + Date.now();
    contentBlocks.push({ id: blockId, title: '', content: '' });
    
    const blockHTML = `
        <div class="content-block card mb-3" id="${blockId}">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Раздел контента</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeContentBlock('${blockId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Заголовок раздела</label>
                    <input type="text" class="form-control content-title" placeholder="Введите заголовок">
                </div>
                <div class="mb-3">
                    <label class="form-label">Содержание</label>
                    <textarea class="form-control content-text" rows="6" placeholder="Введите содержание раздела"></textarea>
                    <small class="form-text text-muted">
                        Используйте • для маркированных списков. Разделяйте абзацы пустой строкой.
                    </small>
                </div>
            </div>
        </div>
    `;
    
    const courseContent = document.getElementById('course-content');
    if (courseContent) {
        courseContent.insertAdjacentHTML('beforeend', blockHTML);
    }
}

// Удаление блока контента
function removeContentBlock(blockId) {
    contentBlocks = contentBlocks.filter(block => block.id !== blockId);
    const blockElement = document.getElementById(blockId);
    if (blockElement) {
        blockElement.remove();
    }
}

// Обработчик отправки формы курса
function handleCourseSubmit(e) {
    e.preventDefault();
    // Разрешено только администраторам
    if (!isAdmin) {
        alert('Создание и редактирование курсов доступно только администраторам');
        return;
    }
    
    // Собираем данные из блоков контента
    const contentBlocksElements = document.querySelectorAll('.content-block');
    const courseContentData = [];
    
    contentBlocksElements.forEach(block => {
        const titleInput = block.querySelector('.content-title');
        const contentInput = block.querySelector('.content-text');
        
        if (titleInput && contentInput) {
            const title = titleInput.value;
            const content = contentInput.value;
            
            if (title && content) {
                courseContentData.push({
                    title: title,
                    content: content
                });
            }
        }
    });
    
    if (courseContentData.length === 0) {
        alert('Добавьте хотя бы один раздел контента');
        return;
    }
    
    const courseTitle = document.getElementById('course-title');
    const courseDescription = document.getElementById('course-description');
    const courseCategory = document.getElementById('course-category');
    const courseLevel = document.getElementById('course-level');
    const courseDuration = document.getElementById('course-duration');
    
    if (!courseTitle || !courseDescription) {
        alert('Заполните обязательные поля');
        return;
    }
    
    const courseData = {
        title: courseTitle.value,
        description: courseDescription.value,
        category: courseCategory ? courseCategory.value : 'Общий',
        level: courseLevel ? courseLevel.value : 'Начальный',
        duration: courseDuration ? parseInt(courseDuration.value) || 1 : 1,
        content: courseContentData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: currentUser ? currentUser.uid : 'unknown'
    };
    
    // Сохраняем в Firebase
    const db = firebase.firestore();
    const promise = currentEditingCourse ? 
        db.collection('courses').doc(currentEditingCourse).update(courseData) :
        db.collection('courses').add(courseData);
    
    promise
        .then(() => {
            alert(currentEditingCourse ? 'Курс обновлен!' : 'Курс создан!');
            resetCourseForm();
            showPage(coursesPage);
            loadCourses();
        })
        .catch((error) => {
            console.error('Ошибка сохранения курса:', error);
            alert('Ошибка сохранения курса');
        });
}

// Сброс формы курса
function resetCourseForm() {
    const createCourseForm = document.getElementById('create-course-form');
    if (createCourseForm) {
        createCourseForm.reset();
    }
    const courseContent = document.getElementById('course-content');
    if (courseContent) {
        courseContent.innerHTML = '';
    }
    contentBlocks = [];
    currentEditingCourse = null;
}

// Начать обучение
function startCourse() {
    // Здесь можно добавить логику отслеживания прогресса
    alert('Обучение начато! Прогресс будет сохраняться автоматически.');
}

// Редактировать курс
function editCourse() {
    if (!currentEditingCourse) return;
    
    firebase.firestore().collection('courses').doc(currentEditingCourse).get()
        .then((doc) => {
            if (doc.exists) {
                const course = doc.data();
                
                // Заполняем форму данными курса
                const courseTitle = document.getElementById('course-title');
                const courseDescription = document.getElementById('course-description');
                const courseCategory = document.getElementById('course-category');
                const courseLevel = document.getElementById('course-level');
                const courseDuration = document.getElementById('course-duration');
                
                if (courseTitle) courseTitle.value = course.title;
                if (courseDescription) courseDescription.value = course.description;
                if (courseCategory) courseCategory.value = course.category;
                if (courseLevel) courseLevel.value = course.level;
                if (courseDuration) courseDuration.value = course.duration || 1;
                
                // Заполняем блоки контента
                const courseContent = document.getElementById('course-content');
                if (courseContent) {
                    courseContent.innerHTML = '';
                    if (course.content && course.content.length > 0) {
                        course.content.forEach((block, index) => {
                            const blockId = 'block_' + index;
                            contentBlocks.push({ id: blockId, title: block.title, content: block.content });
                            
                            const blockHTML = `
                                <div class="content-block card mb-3" id="${blockId}">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">Раздел контента</h6>
                                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeContentBlock('${blockId}')">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <label class="form-label">Заголовок раздела</label>
                                            <input type="text" class="form-control content-title" value="${block.title}">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Содержание</label>
                                            <textarea class="form-control content-text" rows="6">${block.content}</textarea>
                                        </div>
                                    </div>
                                </div>
                            `;
                            courseContent.insertAdjacentHTML('beforeend', blockHTML);
                        });
                    }
                }
                
                showPage(createCoursePage);
            }
        })
        .catch((error) => {
            console.error('Ошибка загрузки курса для редактирования:', error);
            alert('Ошибка загрузки курса');
        });
}

// Удалить курс
function deleteCourse() {
    if (!currentEditingCourse) return;
    
    if (confirm('Вы уверены, что хотите удалить этот курс? Это действие нельзя отменить.')) {
        firebase.firestore().collection('courses').doc(currentEditingCourse).delete()
            .then(() => {
                alert('Курс удален!');
                showPage(coursesPage);
                loadCourses();
            })
            .catch((error) => {
                console.error('Ошибка удаления курса:', error);
                alert('Ошибка удаления курса');
            });
    }
}

// Функция для быстрого создания курса про сканеры
function createScannersCourse() {
    const courseData = {
        title: "Сканеры в стоматологии",
        description: "Изучение современных интраоральных сканеров, их принципов работы и применения в различных областях стоматологии",
        category: "Сканирование",
        level: "Средний",
        duration: 2,
        content: [
            {
                title: "Введение",
                content: "В стоматологии используют интраоральные (внутриротовые) сканеры, которые создают цифровые модели зубов и дёсен. Принцип работы: сканер проецирует свет на сканируемый объект, принимает отражённый световой сигнал и передаёт его на компьютер для создания трёхмерной модели. Программное обеспечение обрабатывает изображения, полученные сканером, и создаёт облако точек, которое затем используется для создания модели. Эта модель служит основой для физической копии, которую можно изготовить на фрезерном станке или распечатать на 3D-принтере."
            },
            {
                title: "Виды сканеров",
                content: "Некоторые типы интраоральных сканеров в стоматологии:\n\n• Оптические — сканируют зубы с помощью световых волн, без контакта.\n• Лазерные — используют лазерный луч для построения модели.\n• Сканеры с технологией структурированного освещения — проецируют световые полосы для анализа формы зубов."
            },
            {
                title: "Процедура сканирования",
                content: "Процесс сканирования с помощью интраорального сканера включает несколько этапов:\n\n1. Подготовка — стоматолог очищает и высушивает зубы, чтобы обеспечить чёткое изображение.\n2. Сканирование — сканер перемещается по зубной дуге, захватывая изображения с разных углов.\n3. Обработка данных — полученные данные передаются в программное обеспечение, которое обрабатывает изображения для создания 3D-цифровой модели.\n4. Проверка — стоматолог просматривает цифровую модель в режиме реального времени на экране сканера. Любые области, требующие дополнительного сканирования, идентифицируются и немедленно повторно сканируются."
            },
            {
                title: "Сфера применения",
                content: "Интраоральные сканеры используются в разных областях стоматологии, например:\n\n• Ортодонтия — цифровой оттиск позволяет оценить состояние прикуса и спланировать лечение с применением ортодонтических аппаратов, брекетов или элайнеров.\n• Имплантология — сканирование используется для оценки состояния тканей полости рта перед имплантацией, на основе сканов можно изготовить шаблон, который позволит установить имплантанты максимально точно.\n• Ортопедия — на основе полученной цифровой модели конструируют и изготавливают виниры, коронки, мосты, вкладки."
            },
            {
                title: "Критерии выбора",
                content: "При выборе интраорального сканера для стоматологии стоит учитывать следующие параметры:\n\n• Точность сканирования — сканер должен обеспечивать максимальную точность.\n• Скорость работы — чем быстрее устройство собирает данные, тем комфортнее процесс для пациента.\n• Простота и удобство использования — современные модели отличаются интуитивно понятным интерфейсом и эргономичной конструкцией.\n• Интеграция с программным обеспечением — важно, чтобы сканер был совместим с популярными CAD/CAM-системами и поддерживал универсальные форматы файлов (STL, PLY, OBJ)."
            }
        ],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: "system"
    };
    
    firebase.firestore().collection('courses').add(courseData)
        .then(() => {
            alert('Курс "Сканеры в стоматологии" создан!');
            loadCourses();
        })
        .catch((error) => {
            console.error('Ошибка создания курса:', error);
            alert('Ошибка создания курса');
        });
}

// Переменные для поиска курсов
let allCoursesData = [];
let filteredCoursesData = [];
let currentSearchTerm = '';

// Обработка поиска курсов
function handleCourseSearch() {
    const searchInput = document.getElementById('course-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    console.log(`🔍 Поиск курсов: "${searchTerm}"`);
    currentSearchTerm = searchTerm;
    
    applyCourseFilters();
}

// Применение фильтров курсов
function applyCourseFilters() {
    let result = [...allCoursesData];
    
    // Применяем поиск
    if (currentSearchTerm !== '') {
        result = result.filter(course => {
            const title = (course.title || course.название || '').toLowerCase();
            const description = (course.description || course.описание || '').toLowerCase();
            const category = (course.category || course.категория || '').toLowerCase();
            const level = (course.level || course.уровень || '').toLowerCase();
            const tags = (course.tags || course.теги || '').toLowerCase();
            
            return title.includes(currentSearchTerm) ||
                   description.includes(currentSearchTerm) ||
                   category.includes(currentSearchTerm) ||
                   level.includes(currentSearchTerm) ||
                   tags.includes(currentSearchTerm);
        });
    }
    
    filteredCoursesData = result;
    displayCourses(result);
    updateCourseSearchResultsInfo();
}

// Отображение отфильтрованных курсов
function displayFilteredCourses() {
    const coursesContainer = document.getElementById('courses-container');
    if (!coursesContainer) return;
    
    if (filteredCoursesData.length === 0) {
        if (currentSearchTerm !== '') {
            coursesContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        <i class="fas fa-search fa-2x mb-3"></i>
                        <h5>Ничего не найдено</h5>
                        <p class="mb-0">По запросу "${currentSearchTerm}" курсы не найдены.</p>
                        <button class="btn btn-outline-primary mt-3" onclick="clearCourseSearch()">
                            <i class="fas fa-times me-2"></i>Очистить поиск
                        </button>
                    </div>
                </div>
            `;
        } else {
            coursesContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning text-center">
                        <i class="fas fa-graduation-cap fa-2x mb-3"></i>
                        <h5>Курсы не найдены</h5>
                        <p class="mb-0">Курсы пока не загружены.</p>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    const coursesHTML = filteredCoursesData.map(course => createCourseCard(course)).join('');
    coursesContainer.innerHTML = coursesHTML;
    
    console.log(`Отображено ${filteredCoursesData.length} курсов`);
}


// Очистка поиска курсов
function clearCourseSearch() {
    const searchInput = document.getElementById('course-search');
    if (searchInput) {
        searchInput.value = '';
    }
    
    currentSearchTerm = '';
    applyCourseFilters();
}

// Обновление информации о результатах поиска курсов
function updateCourseSearchResultsInfo() {
    const resultsInfo = document.getElementById('search-results-info');
    const resultsCount = document.getElementById('results-count');
    
    if (resultsInfo && resultsCount) {
        if (currentSearchTerm !== '') {
            resultsInfo.style.display = 'block';
            resultsCount.textContent = filteredCoursesData.length;
        } else {
            resultsInfo.style.display = 'none';
        }
    }
}

// Создание карточки курса для поиска
function createCourseCard(course) {
    const title = course.title || course.название || 'Без названия';
    const description = course.description || course.описание || 'Описание отсутствует';
    const category = course.category || course.категория || 'Общий';
    const level = course.level || course.уровень || 'Начальный';
    const duration = course.duration || course.длительность || '30';
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card course-card h-100">
                <div class="course-image">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${title}</h5>
                    <p class="card-text flex-grow-1">${description}</p>
                    <div class="course-badges mb-3">
                        <span class="badge bg-primary">${category}</span>
                        <span class="badge bg-secondary">${level}</span>
                    </div>
                    <div class="course-meta">
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>${duration} мин
                        </small>
                        <button class="btn btn-primary btn-sm" onclick="showCourseDetail('${course.id}')">
                            Подробнее
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Настройка обработчиков событий для поиска курсов
function setupCourseSearchEventListeners() {
    const searchInput = document.getElementById('course-search');
    if (searchInput) {
        // Debounced поиск
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleCourseSearch();
            }, 300);
        });
        
        // Поиск по Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCourseSearch();
            }
        });
    }
}

// Обновляем инициализацию курсов для поддержки поиска
function initCoursesWithSearch() {
    console.log('Инициализация курсов с поиском');
    
    // Настраиваем поиск курсов
    setupCourseSearchEventListeners();
    
    // Инициализируем данные для поиска
    allCoursesData = [...allCourses];
    filteredCoursesData = [...allCourses];
    
    // Загружаем курсы
    loadCourses();
    setupCourseEventListeners();
}

// Обновляем функцию загрузки курсов для поддержки поиска
const originalLoadCourses = loadCourses;
loadCourses = function() {
    originalLoadCourses();
    
    // Обновляем данные для поиска после загрузки
    setTimeout(() => {
        allCoursesData = [...allCourses];
        filteredCoursesData = [...allCourses];
        
        // Если есть активный поиск, применяем его
        if (currentSearchTerm !== '') {
            applyCourseFilters();
        }
    }, 500);
};