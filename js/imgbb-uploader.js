/**
 * Утилита для работы с imgbb API
 * API ключ: 0b770dfcb1e3a1958a8d0a7cb7ae1962
 */

const IMGBB_API_KEY = '0b770dfcb1e3a1958a8d0a7cb7ae1962';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * Загрузка изображения на imgbb
 * @param {File|Blob|string} image - Файл, Blob или base64 строка
 * @param {string} name - Название изображения (опционально)
 * @returns {Promise<Object>} - Объект с данными загруженного изображения
 */
async function uploadToImgbb(image, name = 'image') {
    try {
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        
        // Если это файл или blob
        if (image instanceof File || image instanceof Blob) {
            formData.append('image', image);
            formData.append('name', name);
        }
        // Если это base64 строка
        else if (typeof image === 'string') {
            // Удаляем префикс data:image если он есть
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            formData.append('image', base64Data);
            formData.append('name', name);
        }
        
        const response = await fetch(IMGBB_UPLOAD_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Изображение успешно загружено на imgbb');
            console.log('Прямая ссылка:', data.data.url);
            console.log('Ссылка для просмотра:', data.data.url_viewer);
            
            return {
                success: true,
                id: data.data.id,
                title: data.data.title,
                url: data.data.url, // Прямая ссылка на изображение
                displayUrl: data.data.display_url, // URL для отображения
                viewerUrl: data.data.url_viewer, // Ссылка для просмотра
                deleteUrl: data.data.delete_url, // Ссылка для удаления
                thumb: data.data.thumb, // Миниатюра
                medium: data.data.medium, // Средний размер
                size: data.data.size, // Размер в байтах
                width: data.data.width,
                height: data.data.height,
                time: data.data.time,
                expiration: data.data.expiration
            };
        } else {
            console.error('❌ Ошибка загрузки:', data.error.message);
            return {
                success: false,
                error: data.error.message
            };
        }
    } catch (error) {
        console.error('❌ Ошибка при загрузке изображения:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Загрузка изображения по URL
 * @param {string} imageUrl - URL изображения для загрузки
 * @param {string} name - Название изображения (опционально)
 * @returns {Promise<Object>} - Объект с данными загруженного изображения
 */
async function uploadImageByUrl(imageUrl, name = 'image') {
    try {
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', imageUrl);
        formData.append('name', name);
        
        const response = await fetch(IMGBB_UPLOAD_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Изображение успешно загружено на imgbb по URL');
            return {
                success: true,
                url: data.data.url,
                displayUrl: data.data.display_url,
                viewerUrl: data.data.url_viewer
            };
        } else {
            return {
                success: false,
                error: data.error.message
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Пример использования загрузчика изображений
 */
function exampleUsage() {
    // Пример 1: Загрузка файла из input[type="file"]
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput && fileInput.files[0]) {
        uploadToImgbb(fileInput.files[0], 'equipment-photo')
            .then(result => {
                if (result.success) {
                    console.log('Используйте эту ссылку:', result.url);
                    // Здесь можно добавить ссылку в Google Sheets
                }
            });
    }
    
    // Пример 2: Загрузка по URL
    uploadImageByUrl('https://example.com/image.jpg', 'external-image')
        .then(result => {
            if (result.success) {
                console.log('Новая ссылка imgbb:', result.url);
            }
        });
}

// Экспорт функций для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        uploadToImgbb,
        uploadImageByUrl,
        IMGBB_API_KEY
    };
}


