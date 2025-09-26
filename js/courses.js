// Файл для работы с курсами и видео

// Пример данных (в реальном приложении будут загружаться из Firebase)
const sampleCourses = [
    {
        id: 1,
        title: "Основы программирования",
        description: "Изучите основы программирования с нуля",
        thumbnail: "programming.jpg",
        videos: [
            { id: 1, title: "Введение в программирование", duration: "15:30", url: "videos/intro.mp4" },
            { id: 2, title: "Переменные и типы данных", duration: "22:15", url: "videos/variables.mp4" },
            { id: 3, title: "Условные операторы", duration: "18:45", url: "videos/conditions.mp4" }
        ]
    },
    {
        id: 2,
        title: "Веб-разработка",
        description: "Создавайте современные веб-приложения",
        thumbnail: "webdev.jpg",
        videos: [
            { id: 1, title: "Введение в HTML", duration: "20:10", url: "videos/html.mp4" },
            { id: 2, title: "Стилизация с CSS", duration: "25:30", url: "videos/css.mp4" },
            { id: 3, title: "Основы JavaScript", duration: "30:15", url: "videos/javascript.mp4" }
        ]
    }
];

// Загрузка курсов
function loadCourses() {
    const coursesList = document.getElementById('courses-list');
    coursesList.innerHTML = '';
    
    // В реальном приложении: загрузка из Firestore
    // firebase.firestore().collection('courses').get()...
    
    sampleCourses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'col-md-6 col-lg-4';
        courseCard.innerHTML = `
            <div class="card">
                <div class="video-thumbnail">
                    <i class="fas fa-play-circle"></i>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text">${course.description}</p>
                    <button class="btn btn-primary view-course-btn" data-course-id="${course.id}">Смотреть курс</button>
                </div>
            </div>
        `;
        
        coursesList.appendChild(courseCard);
    });
    
    // Добавить обработчики для кнопок просмотра курсов
    document.querySelectorAll('.view-course-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const courseId = e.target.getAttribute('data-course-id');
            openCourse(courseId);
        });
    });
}

// Открытие курса
function openCourse(courseId) {
    const course = sampleCourses.find(c => c.id == courseId);
    if (!course) return;
    
    // Обновить информацию о курсе
    document.getElementById('video-course-title').textContent = course.title;
    
    // Заполнить плейлист
    const videoPlaylist = document.getElementById('video-playlist');
    videoPlaylist.innerHTML = '';
    
    course.videos.forEach((video, index) => {
        const videoItem = document.createElement('li');
        videoItem.className = 'list-group-item video-item';
        videoItem.setAttribute('data-video-url', video.url);
        videoItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${index + 1}. ${video.title}</span>
                <small class="text-muted">${video.duration}</small>
            </div>
        `;
        videoPlaylist.appendChild(videoItem);
        
        // Обработчик выбора видео
        videoItem.addEventListener('click', () => {
            playVideo(video, course);
        });
    });
    
    // Воспроизвести первое видео
    if (course.videos.length > 0) {
        playVideo(course.videos[0], course);
    }
    
    showPage(videoPlayerPage);
}

// Воспроизведение видео
function playVideo(video, course) {
    const videoPlayer = document.getElementById('video-player');
    const videoTitle = document.getElementById('video-title');
    const videoDescription = document.getElementById('video-description');
    
    videoPlayer.src = video.url;
    videoTitle.textContent = video.title;
    videoDescription.textContent = `Видео из курса "${course.title}"`;
    
    // Выделить выбранное видео в плейлисте
    document.querySelectorAll('.video-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`.video-item[data-video-url="${video.url}"]`).classList.add('active');
    
    // Воспроизвести видео
    videoPlayer.play();
}