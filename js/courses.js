// Файл для работы с курсами

// Переменные (не объявляем заново, если уже объявлены в app.js)
let currentEditingCourse = null;
let contentBlocks = [];

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
    const coursesList = document.getElementById('courses-list');
    if (!coursesList) return;
    
    coursesList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    firebase.firestore().collection('courses').get()
        .then((querySnapshot) => {
            coursesList.innerHTML = '';
            
            if (querySnapshot.empty) {
                coursesList.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-book fa-3x text-muted mb-3"></i>
                        <h5>Курсы пока не добавлены</h5>
                        <p class="text-muted">Будьте первым, кто создаст обучающий курс</p>
                    </div>
                `;
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const course = doc.data();
                const courseId = doc.id;
                
                const courseCard = document.createElement('div');
                courseCard.className = 'col-md-6 col-lg-4 mb-4';
                courseCard.innerHTML = `
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
                `;
                
                coursesList.appendChild(courseCard);
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
            console.error('Ошибка загрузки курсов:', error);
            coursesList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h5>Ошибка загрузки курсов</h5>
                    <p class="text-muted">Попробуйте обновить страницу</p>
                </div>
            `;
        });
}

// Показать детали курса
function showCourseDetail(courseId) {
    firebase.firestore().collection('courses').doc(courseId).get()
        .then((doc) => {
            if (doc.exists) {
                const course = doc.data();
                currentEditingCourse = courseId;
                
                // Заполняем информацию о курсе
                document.getElementById('course-detail-title').textContent = course.title;
                document.getElementById('detail-course-title').textContent = course.title;
                document.getElementById('detail-course-description').textContent = course.description;
                document.getElementById('detail-course-category').textContent = course.category;
                document.getElementById('detail-course-level').textContent = course.level;
                document.getElementById('detail-course-duration').textContent = course.duration || 1;
                
                // Заполняем содержание курса
                const detailCourseContent = document.getElementById('detail-course-content');
                if (detailCourseContent) {
                    detailCourseContent.innerHTML = '';
                    if (course.content && course.content.length > 0) {
                        course.content.forEach((block, index) => {
                            const contentBlock = createContentBlockHTML(block, index);
                            detailCourseContent.innerHTML += contentBlock;
                        });
                    }
                }
                
                // Показываем кнопки редактирования для админов
                const editBtn = document.getElementById('edit-course-btn');
                const deleteBtn = document.getElementById('delete-course-btn');
                if (isAdmin) {
                    if (editBtn) editBtn.style.display = 'block';
                    if (deleteBtn) deleteBtn.style.display = 'block';
                } else {
                    if (editBtn) editBtn.style.display = 'none';
                    if (deleteBtn) deleteBtn.style.display = 'none';
                }
                
                showPage(courseDetailPage);
            }
        })
        .catch((error) => {
            console.error('Ошибка загрузки курса:', error);
            alert('Ошибка загрузки курса');
        });
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