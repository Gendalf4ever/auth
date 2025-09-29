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
    if (!adminCoursesList) return;
    
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
    if (!adminUsersList) return;
    
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
if (addCourseBtn) {
    addCourseBtn.addEventListener('click', () => {
        if (typeof showCreateCoursePage === 'function') {
            showCreateCoursePage();
        } else {
            showAddCourseModal();
        }
    });
}

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

// Модальные окна (упрощенные версии)
function showAddCourseModal() {
    alert('Функция добавления курса будет реализована в полной версии');
}

function showEditCourseModal(course) {
    alert(`Редактирование курса "${course.title}" будет реализовано в полной версии`);
}

function showEditUserModal(user) {
    alert(`Редактирование пользователя "${user.name}" будет реализовано в полной версии`);
}