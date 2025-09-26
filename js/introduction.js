// Управление страницей введения

let currentPage = 1;
const totalPages = 3;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
});

// Переход к следующей странице
function nextPage() {
    if (currentPage < totalPages) {
        document.getElementById(`page-${currentPage}`).classList.remove('active');
        currentPage++;
        document.getElementById(`page-${currentPage}`).classList.add('active');
        updateProgress();
    }
}

// Переход к предыдущей странице
function prevPage() {
    if (currentPage > 1) {
        document.getElementById(`page-${currentPage}`).classList.remove('active');
        currentPage--;
        document.getElementById(`page-${currentPage}`).classList.add('active');
        updateProgress();
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
    
    // Перенаправляем на главную страницу
    window.location.href = 'index.html';
}