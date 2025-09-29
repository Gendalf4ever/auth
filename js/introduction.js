// Управление страницей введения

let currentPage = 1;
const totalPages = 4;
let activeTooltip = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    initPages();
    updateProgress();
    initTechnologyTooltips();
});

// Инициализация подсказок для технологий
function initTechnologyTooltips() {
    // Добавляем обработчики для названий технологий
    document.querySelectorAll('.technology-name').forEach(techName => {
        techName.addEventListener('click', function(e) {
            const techId = this.getAttribute('data-tech');
            toggleTooltip(techId);
        });
    });
    
    // Закрытие подсказок при клике вне области
    document.addEventListener('click', function(e) {
        if (activeTooltip && !e.target.closest('.technology-card')) {
            closeActiveTooltip();
        }
    });
    
    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activeTooltip) {
            closeActiveTooltip();
        }
    });
}

// Инициализация видимых страниц (показываем только первую)
function initPages() {
    currentPage = 1;
    const pages = document.querySelectorAll('.introduction-page');
    pages.forEach((p, idx) => {
        if (idx === 0) {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });
}

// Переключение подсказки
function toggleTooltip(techId) {
    if (activeTooltip === techId) {
        closeActiveTooltip();
    } else {
        closeActiveTooltip();
        const tooltip = document.getElementById(`${techId}-tooltip`);
        if (tooltip) {
            tooltip.classList.add('active');
            activeTooltip = techId;
            
            // Прокрутка к подсказке если она не видна
            tooltip.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }
    }
}

// Закрытие активной подсказки
function closeActiveTooltip() {
    if (activeTooltip) {
        const tooltip = document.getElementById(`${activeTooltip}-tooltip`);
        if (tooltip) {
            tooltip.classList.remove('active');
        }
        activeTooltip = null;
    }
}

// Закрытие конкретной подсказки
function closeTooltip(techId) {
    if (activeTooltip === techId) {
        closeActiveTooltip();
    }
}

// Остальные функции остаются без изменений...
// Переход к следующей странице
function nextPage() {
    if (currentPage < totalPages) {
        closeActiveTooltip(); // Закрываем подсказки при смене страницы
        document.getElementById(`page-${currentPage}`).classList.remove('active');
        currentPage++;
        document.getElementById(`page-${currentPage}`).classList.add('active');
        updateProgress();
        
        // Прокрутить к верху страницы
        window.scrollTo(0, 0);
    }
}

// Переход к предыдущей странице
function prevPage() {
    if (currentPage > 1) {
        closeActiveTooltip(); // Закрываем подсказки при смене страницы
        document.getElementById(`page-${currentPage}`).classList.remove('active');
        currentPage--;
        document.getElementById(`page-${currentPage}`).classList.add('active');
        updateProgress();
        
        // Прокрутить к верху страницы
        window.scrollTo(0, 0);
    }
}

// Обновление прогресс-бара
function updateProgress() {
    const progress = (currentPage / totalPages) * 100;
    document.getElementById('introduction-progress').style.width = `${progress}%`;
    
    // Обновление активных шагов
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        if (stepNum <= currentPage) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Пропуск введения
function skipIntroduction() {
    if (confirm('Вы уверены, что хотите пропустить введение? Вы всегда сможете вернуться к нему позже.')) {
        completeIntroduction();
    }
}

// Завершение введения
function completeIntroduction() {
    // Сохраняем в localStorage, что пользователь прошел введение
    localStorage.setItem('introductionCompleted', 'true');
    localStorage.setItem('introductionCompletedDate', new Date().toISOString());
    
    // Перенаправляем на главную страницу
    window.location.href = 'index.html';
}

// Добавляем обработчики клавиш для навигации
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') {
        nextPage();
    } else if (e.key === 'ArrowLeft') {
        prevPage();
    } else if (e.key === 'Escape') {
        if (activeTooltip) {
            closeActiveTooltip();
        } else {
            skipIntroduction();
        }
    }
});