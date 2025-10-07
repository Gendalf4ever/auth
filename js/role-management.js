// Система управления ролями пользователей

// Доступные роли в системе
const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin'
};

// Названия ролей для отображения
const ROLE_NAMES = {
    [USER_ROLES.USER]: 'Пользователь',
    [USER_ROLES.ADMIN]: 'Администратор'
};

// CSS классы для ролей
const ROLE_CLASSES = {
    [USER_ROLES.USER]: 'badge bg-primary',
    [USER_ROLES.ADMIN]: 'badge bg-danger'
};

// Иерархия ролей (для проверки прав)
const ROLE_HIERARCHY = {
    [USER_ROLES.USER]: 1,
    [USER_ROLES.ADMIN]: 2
};

/**
 * Получить роль текущего пользователя
 * @returns {Promise<string>} Роль пользователя
 */
async function getCurrentUserRole() {
    if (!firebase.auth().currentUser) {
        throw new Error('Пользователь не аутентифицирован');
    }
    
    try {
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(firebase.auth().currentUser.uid)
            .get();
        
        if (userDoc.exists) {
            return userDoc.data().role || USER_ROLES.USER;
        } else {
            return USER_ROLES.USER;
        }
    } catch (error) {
        console.error('Ошибка получения роли пользователя:', error);
        return USER_ROLES.USER;
    }
}

/**
 * Получить роль пользователя по ID
 * @param {string} userId ID пользователя
 * @returns {Promise<string>} Роль пользователя
 */
async function getUserRole(userId) {
    try {
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(userId)
            .get();
        
        if (userDoc.exists) {
            return userDoc.data().role || USER_ROLES.USER;
        } else {
            return USER_ROLES.USER;
        }
    } catch (error) {
        console.error('Ошибка получения роли пользователя:', error);
        return USER_ROLES.USER;
    }
}

/**
 * Обновить роль пользователя (только для админов)
 * @param {string} userId ID пользователя
 * @param {string} newRole Новая роль
 * @returns {Promise<boolean>} Успешность операции
 */
async function updateUserRole(userId, newRole) {
    try {
        // Проверяем, что текущий пользователь - админ
        const currentRole = await getCurrentUserRole();
        if (currentRole !== USER_ROLES.ADMIN) {
            throw new Error('Недостаточно прав для изменения ролей');
        }
        
        // Проверяем, что новая роль существует
        if (!Object.values(USER_ROLES).includes(newRole)) {
            throw new Error('Неверная роль');
        }
        
        // Обновляем роль в Firestore
        await firebase.firestore()
            .collection('users')
            .doc(userId)
            .update({
                role: newRole,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: firebase.auth().currentUser.uid
            });
        
        console.log(`Роль пользователя ${userId} изменена на ${newRole}`);
        return true;
    } catch (error) {
        console.error('Ошибка обновления роли:', error);
        throw error;
    }
}

/**
 * Проверить, имеет ли пользователь определенную роль или выше
 * @param {string} requiredRole Требуемая роль
 * @param {string} userRole Роль пользователя (опционально)
 * @returns {Promise<boolean>} Результат проверки
 */
async function hasRole(requiredRole, userRole = null) {
    try {
        const role = userRole || await getCurrentUserRole();
        const userLevel = ROLE_HIERARCHY[role] || 0;
        const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    } catch (error) {
        console.error('Ошибка проверки роли:', error);
        return false;
    }
}

/**
 * Проверить, является ли пользователь администратором
 * @returns {Promise<boolean>} Результат проверки
 */
async function isAdmin() {
    return await hasRole(USER_ROLES.ADMIN);
}

/**
 * Получить отображаемое имя роли
 * @param {string} role Роль
 * @returns {string} Отображаемое имя
 */
function getRoleDisplayName(role) {
    return ROLE_NAMES[role] || 'Неизвестная роль';
}

/**
 * Получить CSS класс для роли
 * @param {string} role Роль
 * @returns {string} CSS класс
 */
function getRoleBadgeClass(role) {
    return ROLE_CLASSES[role] || 'badge bg-secondary';
}

/**
 * Создать HTML элемент для отображения роли
 * @param {string} role Роль
 * @returns {string} HTML строка
 */
function createRoleBadge(role) {
    const displayName = getRoleDisplayName(role);
    const cssClass = getRoleBadgeClass(role);
    return `<span class="${cssClass}">${displayName}</span>`;
}

/**
 * Получить список всех пользователей с их ролями (только для админов)
 * @returns {Promise<Array>} Список пользователей
 */
async function getAllUsersWithRoles() {
    try {
        // Проверяем права доступа
        if (!await isAdmin()) {
            throw new Error('Недостаточно прав для просмотра списка пользователей');
        }
        
        const usersSnapshot = await firebase.firestore()
            .collection('users')
            .orderBy('createdAt', 'desc')
            .get();
        
        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            users.push({
                id: doc.id,
                displayName: userData.displayName || 'Без имени',
                email: userData.email || '',
                role: userData.role || USER_ROLES.USER,
                createdAt: userData.createdAt,
                lastLoginAt: userData.lastLoginAt,
                updatedAt: userData.updatedAt,
                updatedBy: userData.updatedBy
            });
        });
        
        return users;
    } catch (error) {
        console.error('Ошибка получения списка пользователей:', error);
        throw error;
    }
}

/**
 * Создать селект для выбора роли
 * @param {string} currentRole Текущая роль
 * @param {string} userId ID пользователя
 * @returns {string} HTML строка
 */
function createRoleSelect(currentRole, userId) {
    let options = '';
    
    Object.entries(USER_ROLES).forEach(([key, value]) => {
        const selected = value === currentRole ? 'selected' : '';
        const displayName = getRoleDisplayName(value);
        options += `<option value="${value}" ${selected}>${displayName}</option>`;
    });
    
    return `
        <select class="form-select form-select-sm" onchange="handleRoleChange('${userId}', this.value)">
            ${options}
        </select>
    `;
}

/**
 * Обработчик изменения роли пользователя
 * @param {string} userId ID пользователя
 * @param {string} newRole Новая роль
 */
async function handleRoleChange(userId, newRole) {
    try {
        const confirmMessage = `Вы уверены, что хотите изменить роль пользователя на "${getRoleDisplayName(newRole)}"?`;
        
        if (!confirm(confirmMessage)) {
            // Возвращаем предыдущее значение
            location.reload();
            return;
        }
        
        await updateUserRole(userId, newRole);
        
        // Показываем уведомление об успехе
        showNotification(`Роль пользователя успешно изменена на "${getRoleDisplayName(newRole)}"`, 'success');
        
        // Обновляем отображение
        setTimeout(() => {
            location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка изменения роли:', error);
        showNotification(`Ошибка изменения роли: ${error.message}`, 'error');
        
        // Возвращаем предыдущее значение
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

/**
 * Показать уведомление
 * @param {string} message Сообщение
 * @param {string} type Тип уведомления
 */
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
        max-width: 500px;
    `;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически убираем уведомление через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Экспортируем функции для глобального использования
window.RoleManager = {
    USER_ROLES,
    ROLE_NAMES,
    ROLE_CLASSES,
    getCurrentUserRole,
    getUserRole,
    updateUserRole,
    hasRole,
    isAdmin,
    getRoleDisplayName,
    getRoleBadgeClass,
    createRoleBadge,
    getAllUsersWithRoles,
    createRoleSelect,
    handleRoleChange,
    showNotification
};

// Делаем функцию handleRoleChange глобальной для использования в HTML
window.handleRoleChange = handleRoleChange;
