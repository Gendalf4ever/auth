// Файл для работы с административной панелью

// Элементы DOM для админ-панели
const addCourseBtn = document.getElementById('add-course-btn');
const adminCoursesList = document.getElementById('admin-courses-list');
const adminUsersList = document.getElementById('admin-users-list');

// Пример данных пользователей
const sampleUsers = [
    { id: 1, name: "Иван Иванов", email: "ivan@example.com", role: "user" },
    { id: 2, name: "Петр Петров", email: "petr@example.com", role: "admin" },
    { id: 3, name: "Мария Сидорова", email: "maria@example.com", role: "user" }
];

// Загрузка данных для админ-панели
function loadAdminData() {
    loadAdminCourses();
    loadAdminUsers();
}

// Загрузка курсов для администрирования
function loadAdminCourses() {
    adminCoursesList.innerHTML = '';
    
    // В реальном приложении: загрузка из Firestore
    // firebase.firestore().collection('courses').get()...
    
    sampleCourses.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course.title}</td>
            <td>${course.description}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1 edit-course-btn" data-course-id="${course.id}">Редактировать</button>
                <button class="btn btn-sm btn-danger delete-course-btn" data-course-id="${course.id}">Удалить</button>
            </td>
        `;
        adminCoursesList.appendChild(row);
    });
    
    // Добавить обработчики для кнопок
    document.querySelectorAll('.edit-course-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const courseId = e.target.getAttribute('data-course-id');
            editCourse(courseId);
        });
    });
    
    document.querySelectorAll('.delete-course-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const courseId = e.target.getAttribute('data-course-id');
            deleteCourse(courseId);
        });
    });
}

// Загрузка пользователей для администрирования
function loadAdminUsers() {
    adminUsersList.innerHTML = '';
    
    // В реальном приложении: загрузка из Firestore
    // firebase.firestore().collection('users').get()...
    
    sampleUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <select class="form-select form-select-sm role-select" data-user-id="${user.id}">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-primary me-1 edit-user-btn" data-user-id="${user.id}">Редактировать</button>
                <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}">Удалить</button>
            </td>
        `;
        adminUsersList.appendChild(row);
    });
    
    // Добавить обработчики для кнопок
    document.querySelectorAll('.edit-user-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            editUser(userId);
        });
    });
    
    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            deleteUser(userId);
        });
    });
    
    // Обработчики изменения ролей
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            const newRole = e.target.value;
            updateUserRole(userId, newRole);
        });
    });
}

// Обработчики для админ-панели
addCourseBtn.addEventListener('click', () => {
    showAddCourseModal();
});

function editCourse(courseId) {
    const course = sampleCourses.find(c => c.id == courseId);
    if (course) {
        showEditCourseModal(course);
    }
}

function deleteCourse(courseId) {
    if (confirm('Вы уверены, что хотите удалить этот курс?')) {
        // В реальном приложении: удаление из Firestore
        // firebase.firestore().collection('courses').doc(courseId).delete()...
        
        // Обновить интерфейс
        loadAdminCourses();
        showNotification('Курс успешно удален', 'success');
    }
}

function editUser(userId) {
    const user = sampleUsers.find(u => u.id == userId);
    if (user) {
        showEditUserModal(user);
    }
}

function deleteUser(userId) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        // В реальном приложении: удаление из Firestore
        // firebase.firestore().collection('users').doc(userId).delete()...
        
        // Обновить интерфейс
        loadAdminUsers();
        showNotification('Пользователь успешно удален', 'success');
    }
}

function updateUserRole(userId, newRole) {
    // В реальном приложении: обновление в Firestore
    // firebase.firestore().collection('users').doc(userId).update({ role: newRole })...
    
    // Обновить данные в массиве
    const userIndex = sampleUsers.findIndex(u => u.id == userId);
    if (userIndex !== -1) {
        sampleUsers[userIndex].role = newRole;
    }
    
    showNotification(`Роль пользователя изменена на "${newRole}"`, 'success');
}

// Модальное окно добавления курса
function showAddCourseModal() {
    const modalHtml = `
        <div class="modal fade" id="addCourseModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Добавить новый курс</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-course-form">
                            <div class="mb-3">
                                <label for="course-title" class="form-label">Название курса</label>
                                <input type="text" class="form-control" id="course-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="course-description" class="form-label">Описание</label>
                                <textarea class="form-control" id="course-description" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="course-thumbnail" class="form-label">URL обложки</label>
                                <input type="url" class="form-control" id="course-thumbnail">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-primary" id="save-course-btn">Сохранить</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Добавить модальное окно в DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('addCourseModal'));
    modal.show();
    
    // Обработчик сохранения
    document.getElementById('save-course-btn').addEventListener('click', saveNewCourse);
    
    // Удалить модальное окно после закрытия
    document.getElementById('addCourseModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function saveNewCourse() {
    const title = document.getElementById('course-title').value;
    const description = document.getElementById('course-description').value;
    const thumbnail = document.getElementById('course-thumbnail').value;
    
    if (!title || !description) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    // Создать новый курс
    const newCourse = {
        id: Math.max(...sampleCourses.map(c => c.id)) + 1,
        title: title,
        description: description,
        thumbnail: thumbnail || 'default.jpg',
        videos: []
    };
    
    // В реальном приложении: сохранение в Firestore
    // firebase.firestore().collection('courses').add(newCourse)...
    
    sampleCourses.push(newCourse);
    
    // Закрыть модальное окно
    bootstrap.Modal.getInstance(document.getElementById('addCourseModal')).hide();
    
    // Обновить интерфейс
    loadAdminCourses();
    showNotification('Курс успешно добавлен', 'success');
}

// Модальное окно редактирования курса
function showEditCourseModal(course) {
    const modalHtml = `
        <div class="modal fade" id="editCourseModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Редактировать курс</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-course-form">
                            <div class="mb-3">
                                <label for="edit-course-title" class="form-label">Название курса</label>
                                <input type="text" class="form-control" id="edit-course-title" value="${course.title}" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit-course-description" class="form-label">Описание</label>
                                <textarea class="form-control" id="edit-course-description" rows="3" required>${course.description}</textarea>
                            </div>
                            <div class="mb-3">
                                <label for="edit-course-thumbnail" class="form-label">URL обложки</label>
                                <input type="url" class="form-control" id="edit-course-thumbnail" value="${course.thumbnail}">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-primary" id="update-course-btn" data-course-id="${course.id}">Обновить</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('editCourseModal'));
    modal.show();
    
    document.getElementById('update-course-btn').addEventListener('click', updateCourse);
    
    document.getElementById('editCourseModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function updateCourse() {
    const courseId = document.getElementById('update-course-btn').getAttribute('data-course-id');
    const title = document.getElementById('edit-course-title').value;
    const description = document.getElementById('edit-course-description').value;
    const thumbnail = document.getElementById('edit-course-thumbnail').value;
    
    if (!title || !description) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    // Обновить курс
    const courseIndex = sampleCourses.findIndex(c => c.id == courseId);
    if (courseIndex !== -1) {
        sampleCourses[courseIndex].title = title;
        sampleCourses[courseIndex].description = description;
        sampleCourses[courseIndex].thumbnail = thumbnail;
        
        // В реальном приложении: обновление в Firestore
        // firebase.firestore().collection('courses').doc(courseId).update({...})
    }
    
    bootstrap.Modal.getInstance(document.getElementById('editCourseModal')).hide();
    loadAdminCourses();
    showNotification('Курс успешно обновлен', 'success');
}

// Модальное окно редактирования пользователя
function showEditUserModal(user) {
    const modalHtml = `
        <div class="modal fade" id="editUserModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Редактировать пользователя</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-user-form">
                            <div class="mb-3">
                                <label for="edit-user-name" class="form-label">Имя</label>
                                <input type="text" class="form-control" id="edit-user-name" value="${user.name}" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit-user-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="edit-user-email" value="${user.email}" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit-user-role" class="form-label">Роль</label>
                                <select class="form-select" id="edit-user-role">
                                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-primary" id="update-user-btn" data-user-id="${user.id}">Обновить</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    modal.show();
    
    document.getElementById('update-user-btn').addEventListener('click', updateUser);
    
    document.getElementById('editUserModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function updateUser() {
    const userId = document.getElementById('update-user-btn').getAttribute('data-user-id');
    const name = document.getElementById('edit-user-name').value;
    const email = document.getElementById('edit-user-email').value;
    const role = document.getElementById('edit-user-role').value;
    
    if (!name || !email) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    // Обновить пользователя
    const userIndex = sampleUsers.findIndex(u => u.id == userId);
    if (userIndex !== -1) {
        sampleUsers[userIndex].name = name;
        sampleUsers[userIndex].email = email;
        sampleUsers[userIndex].role = role;
    }
    
    bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
    loadAdminUsers();
    showNotification('Пользователь успешно обновлен', 'success');
}

// Функция показа уведомлений
function showNotification(message, type = 'info') {
    // Создать уведомление
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
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
    
    // Автоматически скрыть через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Функция для управления видео в курсах (дополнительный функционал)
function manageCourseVideos(courseId) {
    const course = sampleCourses.find(c => c.id == courseId);
    if (!course) return;
    
    const modalHtml = `
        <div class="modal fade" id="manageVideosModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Управление видео курса: ${course.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6>Видео курса</h6>
                            <button class="btn btn-sm btn-success" id="add-video-btn">Добавить видео</button>
                        </div>
                        <div id="videos-list">
                            ${course.videos.map((video, index) => `
                                <div class="card mb-2">
                                    <div class="card-body">
                                        <h6>${index + 1}. ${video.title}</h6>
                                        <p class="mb-1">Длительность: ${video.duration}</p>
                                        <p class="mb-2">URL: ${video.url}</p>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-primary edit-video-btn" data-video-id="${video.id}">Редактировать</button>
                                            <button class="btn btn-outline-danger delete-video-btn" data-video-id="${video.id}">Удалить</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('manageVideosModal'));
    modal.show();
    
    document.getElementById('manageVideosModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}