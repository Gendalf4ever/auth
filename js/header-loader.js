// Загрузчик универсального header для всех страниц
class HeaderLoader {
    constructor() {
        this.basePath = this.getBasePath();
    }

    // Определяем базовый путь в зависимости от текущей страницы
    getBasePath() {
        const currentPath = window.location.pathname;
        
        // Если мы в подпапке (например, introduction/), возвращаем ../
        if (currentPath.includes('/introduction/') || 
            currentPath.includes('/admin/') || 
            currentPath.includes('/profile/')) {
            return '../';
        }
        
        return '';
    }

    // Корректируем пути в header в зависимости от текущей страницы
    adjustPaths(headerHTML) {
        if (this.basePath === '../') {
            // Корректируем пути для страниц в подпапках
            headerHTML = headerHTML.replace(/href="([^"]*\.html)"/g, (match, path) => {
                if (path.startsWith('introduction/')) {
                    return `href="${path}"`;
                }
                return `href="../${path}"`;
            });
            
            // Корректируем путь к главной странице
            headerHTML = headerHTML.replace('href="index.html"', 'href="../index.html"');
            
            // Корректируем путь к introduction
            headerHTML = headerHTML.replace('href="introduction/index.html"', 'href="index.html"');
        }
        
        return headerHTML;
    }

    // Устанавливаем активную ссылку в зависимости от текущей страницы
    setActiveLink(headerHTML) {
        const currentPath = window.location.pathname;
        const fileName = currentPath.split('/').pop() || 'index.html';
        
        // Убираем все активные классы
        headerHTML = headerHTML.replace(/class="nav-link active"/g, 'class="nav-link"');
        
        // Устанавливаем активный класс для текущей страницы
        if (fileName === 'index.html' && !currentPath.includes('/introduction/')) {
            headerHTML = headerHTML.replace('id="home-link"', 'id="home-link" class="nav-link active"');
        } else if (fileName === 'courses.html') {
            headerHTML = headerHTML.replace('id="courses-link"', 'id="courses-link" class="nav-link active"');
        } else if (currentPath.includes('/introduction/')) {
            headerHTML = headerHTML.replace('href="introduction/index.html"', 'href="introduction/index.html" class="nav-link active"');
        } else if (fileName === 'team.html') {
            headerHTML = headerHTML.replace('href="team.html"', 'href="team.html" class="nav-link active"');
        } else if (fileName === 'educational-catalog.html') {
            headerHTML = headerHTML.replace('href="educational-catalog.html"', 'href="educational-catalog.html" class="nav-link active"');
        } else if (fileName === 'admin.html') {
            headerHTML = headerHTML.replace('id="admin-link"', 'id="admin-link" class="nav-link active"');
        }
        
        return headerHTML;
    }

    // Загружаем header
    async loadHeader() {
        try {
            const response = await fetch(`${this.basePath}components/header.html`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            let headerHTML = await response.text();
            
            // Корректируем пути
            headerHTML = this.adjustPaths(headerHTML);
            
            // Устанавливаем активную ссылку
            headerHTML = this.setActiveLink(headerHTML);
            
            // Вставляем header в начало body
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
            
            // Инициализируем функциональность header после загрузки
            this.initializeHeader();
            
        } catch (error) {
            console.error('Ошибка загрузки header:', error);
            // Fallback - создаем простой header
            this.createFallbackHeader();
        }
    }

    // Создаем простой header в случае ошибки
    createFallbackHeader() {
        const fallbackHeader = `
            <nav class="navbar navbar-expand-lg navbar-dark">
                <div class="container">
                    <a class="navbar-brand" href="${this.basePath}index.html">
                        <i class="fas fa-graduation-cap me-2"></i>CODENT Обучение
                    </a>
                    <div class="navbar-nav ms-auto">
                        <a class="nav-link" href="${this.basePath}index.html">
                            <i class="fas fa-home me-2"></i>Главная
                        </a>
                    </div>
                </div>
            </nav>
        `;
        document.body.insertAdjacentHTML('afterbegin', fallbackHeader);
    }

    // Инициализируем функциональность header
    initializeHeader() {
        // Подключаем основные скрипты для работы с аутентификацией
        if (typeof window.initializeFirebaseApp === 'function') {
            window.initializeFirebaseApp();
        }
        
        // Инициализируем обработчики событий для навигации
        this.initializeNavigation();
    }

    // Инициализируем навигацию
    initializeNavigation() {
        // Обработчик для кнопки выхода
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof logoutUser === 'function') {
                    logoutUser();
                } else if (typeof firebase !== 'undefined' && firebase.auth) {
                    firebase.auth().signOut().then(() => {
                        window.location.href = `${this.basePath}index.html`;
                    });
                }
            });
        }
    }
}

// Автоматически загружаем header при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const headerLoader = new HeaderLoader();
    headerLoader.loadHeader();
});

// Экспортируем для использования в других скриптах
window.HeaderLoader = HeaderLoader;
