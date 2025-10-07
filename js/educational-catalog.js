/**
 * Обучающий каталог оборудования
 * Загружает данные из Google Sheets и отображает их в виде обучающей таблицы без цен
 */

// Глобальные переменные
let equipmentData = [];
let filteredEquipment = [];
let currentPage = 1;
let itemsPerPage = 10; // Возвращаем нормальную пагинацию

// Элементы DOM
const loadingEquipment = document.getElementById('loading-equipment');
const errorEquipment = document.getElementById('error-equipment');
const equipmentContainer = document.getElementById('equipment-container');
const equipmentTableBody = document.getElementById('equipment-table-body');
const searchEquipment = document.getElementById('search-equipment');
const categoryFilter = document.getElementById('category-filter');
const sortEquipment = document.getElementById('sort-equipment');
const refreshEquipmentBtn = document.getElementById('refresh-equipment');
const equipmentPagination = document.getElementById('equipment-pagination');

// Прямая загрузка из Google Sheets (без proxy)

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeEquipment();
    setupEventListeners();
});

// Инициализация оборудования
function initializeEquipment() {
    showLoading();
    loadEquipmentFromGoogleSheets();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Поиск
    if (searchEquipment) {
        searchEquipment.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Фильтр по категориям
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleCategoryFilter);
    }
    
    // Сортировка
    if (sortEquipment) {
        sortEquipment.addEventListener('change', handleSort);
    }
    
    // Обновление
    if (refreshEquipmentBtn) {
        refreshEquipmentBtn.addEventListener('click', () => {
            console.log('Принудительное обновление данных с очисткой кеша...');
            
            // Очищаем кеш браузера для Google Sheets
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        if (name.includes('google') || name.includes('sheets')) {
                            caches.delete(name);
                        }
                    });
                });
            }
            
            showLoading();
            // Принудительно перезагружаем данные с параметром для обхода кеша
            loadEquipmentFromGoogleSheets(true);
        });
    }
}

// Загрузка данных из Google Sheets со всех листов
async function loadEquipmentFromGoogleSheets(forceRefresh = false) {
    console.log('Начинаем загрузку оборудования со всех листов...', forceRefresh ? '(принудительное обновление)' : '');
    
    try {
        // Получаем все листы для обучающего каталога
        const sheetsToLoad = [
            '3d-printers',      // 3D принтеры
            '3d-scaners',       // 3D сканеры
            'milling',          // Фрезеровка
            'frezy',            // Фрезы
            'sinterising',      // Синтеризация
            'zirkon',           // Циркониевые диски
            'post-obrabotka',  // Пост-обработка
            'photo-polymers',   // Фотополимеры
            '3d-consumables',   // Прочее
            'compressors'       // Компрессоры
        ];
        
        let allEquipmentData = [];
        let loadedSheets = 0;
        
        // Загружаем данные с каждого листа
        for (const sheetId of sheetsToLoad) {
            try {
                console.log(`Загружаем данные с листа: ${sheetId}`);
                const sheetData = await loadSheetData(sheetId, forceRefresh);
                
                if (sheetData && sheetData.length > 0) {
                    // Добавляем информацию о листе к каждому элементу
                    const sheetDataWithSource = sheetData.map(item => ({
                        ...item,
                        sourceSheet: sheetId,
                        sourceTitle: window.sheetConfig.pages[sheetId]?.title || sheetId
                    }));
                    
                    allEquipmentData = allEquipmentData.concat(sheetDataWithSource);
                    loadedSheets++;
                    console.log(`Загружено ${sheetData.length} элементов с листа ${sheetId}`);
                }
            } catch (error) {
                console.warn(`Ошибка загрузки листа ${sheetId}:`, error.message);
                // Продолжаем загрузку других листов
            }
        }
        
        if (allEquipmentData.length === 0) {
            throw new Error('Не удалось загрузить данные ни с одного листа');
        }
        
        console.log(`Успешно загружено ${allEquipmentData.length} элементов с ${loadedSheets} листов`);
        
        // Преобразуем данные в формат для обучающего каталога
        equipmentData = transformToEducationalFormat(allEquipmentData);
        
        filteredEquipment = [...equipmentData];
        hideLoading();
        renderEquipment();
        
        console.log('Оборудование успешно загружено и отображено');
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showError('Не удалось загрузить данные из Google Sheets. Проверьте подключение к интернету и настройки таблицы.');
    }
}

// Загрузка данных с конкретного листа
async function loadSheetData(sheetId, forceRefresh = false) {
    const exportUrl = window.sheetConfig.getExportUrl(sheetId);
    
    if (!exportUrl) {
        throw new Error(`Не удалось получить URL для листа ${sheetId}`);
    }
    
    console.log(`Загружаем данные с листа ${sheetId}:`, exportUrl);
    
    try {
        // Добавляем параметр времени для обхода кеша при принудительном обновлении
        const finalUrl = forceRefresh ? `${exportUrl}&t=${Date.now()}` : exportUrl;
        
        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv,text/plain,*/*',
            },
            cache: forceRefresh ? 'no-cache' : 'default'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        if (csvText.length < 100) {
            throw new Error('Получены некорректные данные');
        }
        
        const parsedData = parseCSV(csvText);
        console.log(`Распарсено ${parsedData.length} элементов с листа ${sheetId}`);
        
        return parsedData;
        
    } catch (error) {
        console.error(`Ошибка загрузки листа ${sheetId}:`, error.message);
        throw error;
    }
}

// Преобразование данных в формат для обучающего каталога
function transformToEducationalFormat(data) {
    return data.map(item => {
        // Определяем категорию на основе названия, описания и источника
        const category = determineCategoryFromSource(item.sourceSheet, item['наименование'] || '', item['описание'] || '');
        
        
        // Определяем назначение
        const purpose = determinePurpose(item['наименование'] || '', item['описание'] || '');
        
        // Определяем применение
        const application = determineApplication(category, item['описание'] || '');
        
        // Ищем характеристики в разных возможных колонках
        const specifications = getSpecifications(item);
        
        // Ищем изображение в разных возможных колонках
        const imageUrl = getImageUrl(item);
        
        return {
            id: item['id'] || '',
            name: cleanEquipmentName(item['наименование'] || 'Без названия'),
            category: category,
            purpose: purpose,
            description: item['описание'] || 'Описание отсутствует',
            specifications: specifications,
            image: imageUrl,
            application: application,
            sourceSheet: item.sourceSheet || '',
            sourceTitle: item.sourceTitle || '',
            originalData: item // Сохраняем оригинальные данные
        };
    });
}

// Получение URL изображения из различных возможных колонок
function getImageUrl(item) {
    console.log('=== ПОИСК ИЗОБРАЖЕНИЯ ===');
    console.log('Элемент для поиска изображения:', item);
    console.log('Доступные ключи:', Object.keys(item));
    
    // Возможные названия колонок с изображениями
    const possibleImageColumns = [
        'изображение',
        'Изображение',
        'ИЗОБРАЖЕНИЕ',
        'фото',
        'Фото',
        'ФОТО',
        'картинка',
        'Картинка',
        'КАРТИНКА',
        'image',
        'Image',
        'IMAGE',
        'img',
        'Img',
        'IMG',
        'picture',
        'Picture',
        'PICTURE',
        'photo',
        'Photo',
        'PHOTO',
        'url',
        'URL',
        'ссылка',
        'Ссылка',
        'ССЫЛКА',
        'link',
        'Link',
        'LINK'
    ];
    
    console.log('Проверяем точные совпадения колонок для изображений...');
    // Ищем первую непустую колонку с изображением
    for (const column of possibleImageColumns) {
        if (item.hasOwnProperty(column)) {
            console.log(`Найдена колонка "${column}" со значением:`, item[column]);
            if (item[column] && item[column].toString().trim() !== '') {
                const imageUrl = item[column].toString().trim();
                
                // Проверяем, является ли это валидной ссылкой
                if (isValidImageUrl(imageUrl)) {
                    // Преобразуем в прямую ссылку (синхронная версия)
                    const directUrl = convertToDirectImageUrlSync(imageUrl);
                    console.log(`✅ НАЙДЕНО изображение в колонке "${column}":`, directUrl);
                    return directUrl;
                }
            }
        }
    }
    
    console.log('Точные совпадения не найдены. Ищем по содержимому...');
    // Ищем в любых колонках ссылки на изображения
    for (const key of Object.keys(item)) {
        const value = item[key];
        if (value && value.toString().trim() !== '') {
            const valueStr = value.toString().trim();
            
            // Проверяем, является ли это валидной ссылкой на изображение
            if (isValidImageUrl(valueStr)) {
                // Преобразуем в прямую ссылку (синхронная версия)
                const directUrl = convertToDirectImageUrlSync(valueStr);
                console.log(`✅ НАЙДЕНО изображение в колонке "${key}":`, directUrl);
                return directUrl;
            }
        }
    }
    
    console.log('❌ Изображение НЕ найдено!');
    console.log('=== КОНЕЦ ПОИСКА ИЗОБРАЖЕНИЯ ===');
    
    return '';
}

// API ключ imgbb
const IMGBB_API_KEY = '0b770dfcb1e3a1958a8d0a7cb7ae1962';

// Кэш для сохранения преобразованных URL
const imageUrlCache = new Map();

// Преобразование URL imgbb в прямую ссылку на изображение
async function convertToDirectImageUrl(url) {
    if (!url || typeof url !== 'string') return url;
    
    // Убираем @ в начале, если есть
    let urlStr = url.trim();
    if (urlStr.startsWith('@')) {
        urlStr = urlStr.substring(1).trim();
    }
    
    // Проверяем кэш
    if (imageUrlCache.has(urlStr)) {
        console.log(`Используем кэшированный URL для: ${urlStr}`);
        return imageUrlCache.get(urlStr);
    }
    
    // Если это уже прямая ссылка i.ibb.co или i.imgur.com, возвращаем как есть
    if (urlStr.includes('i.ibb.co') || urlStr.includes('i.imgur.com')) {
        console.log(`Прямая ссылка найдена: ${urlStr}`);
        imageUrlCache.set(urlStr, urlStr);
        return urlStr;
    }
    
    // Преобразуем ссылки imgbb (ibb.co) в прямые ссылки
    // Формат: https://ibb.co/Zp4hmN55
    if (urlStr.includes('ibb.co/')) {
        try {
            // Извлекаем ID изображения
            const match = urlStr.match(/ibb\.co\/([a-zA-Z0-9]+)/);
            if (match && match[1]) {
                const imageId = match[1];
                
                // Попытка 1: Используем стандартный формат imgbb
                // imgbb использует структуру: https://i.ibb.co/HASH/filename.ext
                // где HASH - это подстрока из ID
                
                // Генерируем несколько вариантов прямых ссылок
                const possibleFormats = [
                    // Стандартные форматы imgbb
                    `https://i.ibb.co/${imageId}/image.jpg`,
                    `https://i.ibb.co/${imageId}/image.png`,
                    `https://i.ibb.co/${imageId}/photo.jpg`,
                    `https://i.ibb.co/${imageId}/photo.png`,
                    // Форматы с использованием самого ID как имени файла
                    `https://i.ibb.co/${imageId}/${imageId}.jpg`,
                    `https://i.ibb.co/${imageId}/${imageId}.png`,
                    // Короткий хэш (первые 7 символов)
                    `https://i.ibb.co/${imageId.substring(0, 7)}/image.jpg`,
                    `https://i.ibb.co/${imageId.substring(0, 7)}/image.png`,
                    // Альтернативный формат с полным ID
                    `https://i.ibb.co/${imageId.charAt(0)}/${imageId}/image.jpg`,
                    `https://i.ibb.co/${imageId.charAt(0)}/${imageId}/image.png`
                ];
                
                // Возвращаем первый формат и кэшируем
                const directUrl = possibleFormats[0];
                console.log(`Преобразование imgbb URL: ${urlStr} -> ${directUrl}`);
                console.log(`Доступные варианты для fallback:`, possibleFormats.slice(0, 5));
                
                imageUrlCache.set(urlStr, directUrl);
                return directUrl;
            }
        } catch (e) {
            console.warn('Ошибка преобразования imgbb URL:', e);
        }
    }
    
    // Преобразуем ссылки imgur
    if (urlStr.includes('imgur.com/') && !urlStr.includes('i.imgur.com')) {
        try {
            const match = urlStr.match(/imgur\.com\/([a-zA-Z0-9]+)/);
            if (match && match[1]) {
                const imageId = match[1];
                const directUrl = `https://i.imgur.com/${imageId}.jpg`;
                console.log(`Преобразование imgur URL: ${urlStr} -> ${directUrl}`);
                imageUrlCache.set(urlStr, directUrl);
                return directUrl;
            }
        } catch (e) {
            console.warn('Ошибка преобразования imgur URL:', e);
        }
    }
    
    imageUrlCache.set(urlStr, urlStr);
    return urlStr;
}

// Синхронная версия для обратной совместимости
function convertToDirectImageUrlSync(url) {
    if (!url || typeof url !== 'string') return url;
    
    // Убираем @ в начале, если есть
    let urlStr = url.trim();
    if (urlStr.startsWith('@')) {
        urlStr = urlStr.substring(1).trim();
    }
    
    console.log('Конвертация URL:', urlStr);
    
    // Если это уже прямая ссылка i.ibb.co или i.imgur.com, возвращаем как есть
    if (urlStr.includes('i.ibb.co') || urlStr.includes('i.imgur.com')) {
        console.log('Уже прямая ссылка:', urlStr);
        return urlStr;
    }
    
    // Преобразуем ссылки imgbb (ibb.co/CODE)
    if (urlStr.includes('ibb.co/')) {
        const match = urlStr.match(/ibb\.co\/([a-zA-Z0-9]+)/);
        if (match && match[1]) {
            const imageId = match[1];
            // Пробуем несколько форматов
            const directUrl = `https://i.ibb.co/${imageId}/image.png`;
            console.log('Преобразована ссылка imgbb:', directUrl);
            return directUrl;
        }
    }
    
    // Преобразуем ссылки imgur
    if (urlStr.includes('imgur.com/') && !urlStr.includes('i.imgur.com')) {
        const match = urlStr.match(/imgur\.com\/([a-zA-Z0-9]+)/);
        if (match && match[1]) {
            const directUrl = `https://i.imgur.com/${match[1]}.jpg`;
            console.log('Преобразована ссылка imgur:', directUrl);
            return directUrl;
        }
    }
    
    console.log('URL не требует конвертации:', urlStr);
    return urlStr;
}

// Проверка валидности URL изображения
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Убираем @ в начале, если есть
    let urlStr = url.trim();
    if (urlStr.startsWith('@')) {
        urlStr = urlStr.substring(1).trim();
    }
    
    // Проверяем, что это HTTP/HTTPS ссылка
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        console.log(`URL "${urlStr}" не начинается с http:// или https://`);
        return false;
    }
    
    // Проверяем популярные хостинги изображений
    const imageHosts = [
        'imgbb.com',
        'imgur.com',
        'postimg.cc',
        'ibb.co',
        'i.imgur.com',
        'i.ibb.co',
        'drive.google.com',
        'dropbox.com',
        'yandex.ru',
        'mail.ru'
    ];
    
    const hasImageHost = imageHosts.some(host => urlStr.includes(host));
    
    // Проверяем расширения файлов изображений
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
        urlStr.toLowerCase().includes(ext.toLowerCase())
    );
    
    // Считаем валидным, если есть хост изображений или расширение файла
    const isValid = hasImageHost || hasImageExtension;
    
    console.log(`Проверка URL "${urlStr}": хост изображений = ${hasImageHost}, расширение = ${hasImageExtension}, валидный = ${isValid}`);
    
    return isValid;
}

// Получение характеристик из различных возможных колонок
function getSpecifications(item) {
    console.log('=== ПОИСК ХАРАКТЕРИСТИК ===');
    console.log('Элемент для поиска характеристик:', item);
    console.log('Доступные ключи:', Object.keys(item));
    
    // Получаем описание для сравнения
    const description = item['описание'] || '';
    console.log('Описание для сравнения:', description);
    
    // Функция проверки, не является ли текст дублированием описания
    function isDuplicateOfDescription(text) {
        if (!description || !text) return false;
        const cleanDesc = description.toString().trim().toLowerCase();
        const cleanText = text.toString().trim().toLowerCase();
        
        // Если тексты слишком короткие, не считаем дублированием
        if (cleanDesc.length < 20 || cleanText.length < 20) return false;
        
        // Проверяем точное совпадение
        if (cleanDesc === cleanText) return true;
        
        // Проверяем очень высокое сходство (более 90% для строгой проверки)
        const similarity = calculateSimilarity(cleanDesc, cleanText);
        console.log(`Сходство между описанием и текстом: ${similarity.toFixed(2)}`);
        return similarity > 0.9;
    }
    
    // Функция расчета сходства строк
    function calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    // Функция расчета расстояния Левенштейна
    function levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    
    // Возможные названия колонок с характеристиками (только специфичные для характеристик)
    const possibleColumns = [
        'характеристики',
        'Характеристики',
        'ХАРАКТЕРИСТИКИ',
        'характеристика',
        'Характеристика',
        'ХАРАКТЕРИСТИКА',
        'specs',
        'Specs',
        'SPECS',
        'specifications',
        'Specifications',
        'SPECIFICATIONS',
        'технические характеристики',
        'Технические характеристики',
        'ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ',
        'техническиехарактеристики',
        'параметры',
        'Параметры',
        'ПАРАМЕТРЫ',
        'свойства',
        'Свойства',
        'СВОЙСТВА',
        'техописание',
        'Техописание',
        'ТЕХОПИСАНИЕ'
    ];
    
    console.log('Проверяем точные совпадения колонок...');
    // Ищем первую непустую колонку с характеристиками
    for (const column of possibleColumns) {
        if (item.hasOwnProperty(column)) {
            console.log(`Найдена колонка "${column}" со значением:`, item[column]);
            if (item[column] && item[column].toString().trim() !== '') {
                const specs = item[column].toString().trim();
                
                // Проверяем, не дублирует ли это описание
                if (isDuplicateOfDescription(specs)) {
                    console.log(`⚠️ Колонка "${column}" содержит дублирование описания, пропускаем`);
                    continue;
                }
                
                console.log(`✅ НАЙДЕНЫ характеристики в колонке "${column}":`, specs);
                return specs;
            }
        }
    }
    
    console.log('Точные совпадения не найдены. Ищем по ключевым словам...');
    // Дополнительный поиск: ищем колонки, содержащие ключевые слова (исключаем "описан")
    const keywords = [
        'характеристик', 'параметр', 'spec', 'техническ', 'свойств', 
        'feature', 'property', 'detail'
    ];
    
    for (const key of Object.keys(item)) {
        // Пропускаем колонку с описанием
        if (key.toLowerCase().includes('описан')) {
            console.log(`Пропускаем колонку "${key}" (содержит "описан")`);
            continue;
        }
        
        const lowerKey = key.toLowerCase().replace(/\s+/g, '');
        console.log(`Проверяем ключ "${key}" (нормализованный: "${lowerKey}")`);
        
        for (const keyword of keywords) {
            if (lowerKey.includes(keyword)) {
                console.log(`Найдено ключевое слово "${keyword}" в колонке "${key}"`);
                if (item[key] && item[key].toString().trim() !== '') {
                    const specs = item[key].toString().trim();
                    
                    // Проверяем, не дублирует ли это описание
                    if (isDuplicateOfDescription(specs)) {
                        console.log(`⚠️ Колонка "${key}" содержит дублирование описания, пропускаем`);
                        continue;
                    }
                    
                    console.log(`✅ НАЙДЕНЫ характеристики в колонке с ключевым словом "${key}":`, specs);
                    return specs;
                }
            }
        }
    }
    
    console.log('Ищем в колонках с номерами (возможно характеристики в колонке без заголовка)...');
    // Проверяем колонки по позиции (возможно характеристики в 3-й, 4-й колонке)
    const keys = Object.keys(item);
    for (let i = 2; i < Math.min(keys.length, 8); i++) {
        const key = keys[i];
        const value = item[key];
        if (value && value.toString().trim() !== '' && value.toString().length > 10) {
            const valueStr = value.toString().trim();
            
            // Проверяем, не дублирует ли это описание
            if (isDuplicateOfDescription(valueStr)) {
                console.log(`⚠️ Колонка ${i+1} ("${key}") содержит дублирование описания, пропускаем`);
                continue;
            }
            
            // Проверяем, похоже ли на характеристики (содержит двоеточия, цифры, единицы измерения)
            if (valueStr.includes(':') || valueStr.includes('мм') || valueStr.includes('см') || 
                valueStr.includes('кг') || valueStr.includes('В') || valueStr.includes('Вт') ||
                /\d+\s*[а-яё]+/i.test(valueStr)) {
                console.log(`✅ НАЙДЕНЫ характеристики в колонке ${i+1} ("${key}"):`, valueStr);
                return valueStr;
            }
        }
    }
    
    console.log('Пытаемся найти любую подходящую колонку с техническими данными...');
    // Последняя попытка: ищем любую колонку с техническими данными
    for (const key of Object.keys(item)) {
        const value = item[key];
        if (value && value.toString().trim() !== '') {
            const valueStr = value.toString().trim();
            
            // Пропускаем очевидно не подходящие колонки
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('наименован') || lowerKey.includes('название') || 
                lowerKey.includes('категор') || lowerKey.includes('применен') ||
                lowerKey === 'id' || lowerKey === 'sourcesheet' || lowerKey === 'sourcetitle') {
                continue;
            }
            
            // Если это не описание и содержит техническую информацию
            if (!isDuplicateOfDescription(valueStr) && valueStr.length > 15) {
                // Проверяем на наличие технических признаков
                const hasTechnicalContent = 
                    valueStr.includes('мм') || valueStr.includes('см') || valueStr.includes('м') ||
                    valueStr.includes('кг') || valueStr.includes('г') ||
                    valueStr.includes('В') || valueStr.includes('Вт') || valueStr.includes('А') ||
                    valueStr.includes('°C') || valueStr.includes('градус') ||
                    valueStr.includes('МПа') || valueStr.includes('бар') ||
                    valueStr.includes('об/мин') || valueStr.includes('rpm') ||
                    /\d+\s*[x×]\s*\d+/i.test(valueStr) || // размеры типа 100x200
                    /\d+\s*[-–]\s*\d+/i.test(valueStr) || // диапазоны типа 10-20
                    valueStr.includes(':') || // списки характеристик
                    /\d+\s*[а-яё]{2,}/i.test(valueStr); // числа с единицами измерения
                
                if (hasTechnicalContent) {
                    console.log(`✅ НАЙДЕНЫ характеристики в колонке "${key}" (техническое содержимое):`, valueStr);
                    return valueStr;
                }
            }
        }
    }
    
    // Если все еще не найдены, попробуем взять любую непустую колонку, кроме основных
    console.log('Ищем любую подходящую колонку...');
    for (const key of Object.keys(item)) {
        const value = item[key];
        if (value && value.toString().trim() !== '') {
            const valueStr = value.toString().trim();
            const lowerKey = key.toLowerCase();
            
            // Исключаем основные колонки
            if (lowerKey.includes('наименован') || lowerKey.includes('название') || 
                lowerKey.includes('категор') || lowerKey.includes('применен') ||
                lowerKey.includes('описан') || lowerKey === 'id' || 
                lowerKey === 'sourcesheet' || lowerKey === 'sourcetitle') {
                continue;
            }
            
            if (valueStr.length > 10 && !isDuplicateOfDescription(valueStr)) {
                console.log(`✅ НАЙДЕНЫ характеристики в колонке "${key}" (резервный вариант):`, valueStr);
                return valueStr;
            }
        }
    }
    
    // Если не найдены характеристики, выводим отладочную информацию
    console.log('❌ Характеристики НЕ найдены!');
    console.log('Все доступные данные элемента:');
    Object.keys(item).forEach(key => {
        console.log(`  "${key}": "${item[key]}"`);
    });
    console.log('=== КОНЕЦ ПОИСКА ХАРАКТЕРИСТИК ===');
    
    return 'Характеристики не указаны';
}

// Очистка названия оборудования от лишней информации
function cleanEquipmentName(name) {
    if (!name || name.trim() === '') return 'Без названия';
    
    // Убираем лишние пробелы
    let cleanName = name.trim();
    
    // Удаляем информацию о скидках и дополнительных предложениях
    cleanName = cleanName.replace(/\s*расходники\s*\d+%?/gi, '');
    cleanName = cleanName.replace(/\s*при\s*единовременной\s*покупке\s*скидка\s*на\s*расходники\s*\d+%?/gi, '');
    cleanName = cleanName.replace(/\s*что\s*ускоряет\s*рабочий\s*процесс\.?/gi, '');
    
    // Удаляем длинные описания, оставляем только название продукта
    // Ищем паттерны типа "сочетающее высокую точность и производительность..."
    cleanName = cleanName.replace(/сочетающее\s+высокую\s+точность\s+и\s+производительность\.?\s*Технология\s+.*$/gi, '');
    
    // Удаляем технические характеристики из названия
    cleanName = cleanName.replace(/\s*с\s*\d+[-дюймовым]*\s*дисплеем/gi, '');
    cleanName = cleanName.replace(/\s*с\s*LCD[-экраном]*/gi, '');
    cleanName = cleanName.replace(/\s*технология\s+.*$/gi, '');
    
    // Удаляем описательные фразы, которые не являются названиями товаров
    cleanName = cleanName.replace(/включая\s+лазерные\s+в\s+красном\s+и\s+голубом\s+диапазоне\s+и\s+оптические\s+системы\s+белого\s+света.*$/gi, '');
    cleanName = cleanName.replace(/обеспечивает\s+высокую\s+скорость\s+и\s+точность.*$/gi, '');
    cleanName = cleanName.replace(/подходит\s+для\s+простых\s+и\s+сложных.*$/gi, '');
    cleanName = cleanName.replace(/использует\s+технологию.*$/gi, '');
    cleanName = cleanName.replace(/предназначен\s+для.*$/gi, '');
    cleanName = cleanName.replace(/разработан\s+специально\s+для.*$/gi, '');
    cleanName = cleanName.replace(/обеспечивает\s+отличные.*$/gi, '');
    cleanName = cleanName.replace(/высококачественный.*$/gi, '');
    cleanName = cleanName.replace(/профессиональный.*$/gi, '');
    cleanName = cleanName.replace(/современный.*$/gi, '');
    cleanName = cleanName.replace(/компактный.*$/gi, '');
    
    // Удаляем фразы, которые явно являются описанием, а не названием
    cleanName = cleanName.replace(/^.*обеспечивает.*$/gi, '');
    cleanName = cleanName.replace(/^.*предназначен.*$/gi, '');
    cleanName = cleanName.replace(/^.*использует.*$/gi, '');
    cleanName = cleanName.replace(/^.*подходит.*$/gi, '');
    cleanName = cleanName.replace(/^.*разработан.*$/gi, '');
    cleanName = cleanName.replace(/^.*включает.*$/gi, '');
    cleanName = cleanName.replace(/^.*содержит.*$/gi, '');
    
    // Удаляем длинные предложения (более 10 слов подряд)
    const words = cleanName.split(/\s+/);
    if (words.length > 10) {
        // Берем только первые 5-7 слов как название
        cleanName = words.slice(0, 7).join(' ');
    }
    
    // Убираем лишние пробелы и точки в конце
    cleanName = cleanName.replace(/\s+/g, ' ').trim();
    cleanName = cleanName.replace(/\.+$/, '');
    
    // Если после очистки название стало пустым или слишком коротким, возвращаем оригинал
    if (cleanName.trim() === '' || cleanName.length < 3) {
        return name.trim();
    }
    
    return cleanName;
}

// Определение категории оборудования на основе источника листа
function determineCategoryFromSource(sourceSheet, name, description) {
    // Сначала определяем категорию на основе источника листа
    const sourceCategoryMap = {
        '3d-printers': '3D принтеры',
        '3d-scaners': '3D сканеры',
        'milling': 'Фрезерные станки',
        'frezy': 'Фрезы',
        'sinterising': 'Синтеризация',
        'zirkon': 'Циркониевые диски',
        'post-obrabotka': 'Пост-обработка',
        'photo-polymers': 'Фотополимеры',
        '3d-consumables': 'Расходные материалы',
        'compressors': 'Компрессоры'
    };
    
    if (sourceSheet && sourceCategoryMap[sourceSheet]) {
        return sourceCategoryMap[sourceSheet];
    }
    
    // Если источник не определен, используем старую логику
    return determineCategory(name, description);
}

// Определение категории оборудования (старая логика для совместимости)
function determineCategory(name, description) {
    const nameLower = name.toLowerCase();
    const descLower = description.toLowerCase();
    
    if (nameLower.includes('3d') && (nameLower.includes('принтер') || nameLower.includes('printer'))) {
        return '3D принтеры';
    }
    if (nameLower.includes('сканер') || nameLower.includes('scanner') || descLower.includes('сканер')) {
        return '3D сканеры';
    }
    if (nameLower.includes('фрезер') || nameLower.includes('станок') || nameLower.includes('milling') || descLower.includes('фрезер')) {
        return 'Фрезерные станки';
    }
    if (nameLower.includes('материал') || nameLower.includes('смола') || nameLower.includes('блок') || nameLower.includes('диск')) {
        return 'Материалы';
    }
    if (nameLower.includes('печь') || nameLower.includes('синтер') || nameLower.includes('sinter')) {
        return 'Пост-обработка';
    }
    return 'Оборудование';
}


// Определение назначения
function determinePurpose(name, description) {
    const nameLower = name.toLowerCase();
    const descLower = description.toLowerCase();
    
    if (nameLower.includes('стоматолог') || descLower.includes('стоматолог')) {
        return 'Стоматология';
    }
    if (nameLower.includes('лаборатор') || descLower.includes('лаборатор')) {
        return 'Лаборатория';
    }
    if (nameLower.includes('клиник') || descLower.includes('клиник')) {
        return 'Клиника';
    }
    return 'Общее применение';
}

// Определение применения
function determineApplication(category, description) {
    const descLower = description.toLowerCase();
    
    switch (category) {
        case '3D принтеры':
            return 'Печать коронок, мостов, протезов';
        case '3D сканеры':
            return 'Сканирование полости рта, слепков';
        case 'Фрезерные станки':
            return 'Обработка заготовок, финишная обработка';
        case 'Материалы':
            return 'Сырье для производства';
        case 'Пост-обработка':
            return 'Окончательная обработка изделий';
        default:
            return 'Специализированное применение';
    }
}


// Парсинг CSV данных (аналогично products.js)
function parseCSV(csvText) {
    console.log('Начинаем парсинг CSV...');
    
    const lines = csvText.split('\n');
    
    if (lines.length < 2) {
        console.error('Недостаточно строк в CSV');
        return [];
    }
    
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.trim().replace(/"/g, ''));
    
    // Отладочная информация о заголовках
    console.log('Заголовки колонок из Google Sheets:', headers);
    
    const equipment = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line === '') continue;
        
        try {
            const values = parseCSVLine(line);
            
            if (values.length >= 2 && values[0] && values[1]) {
                const item = {};
                headers.forEach((header, index) => {
                    item[header] = (values[index] || '').trim();
                });
                
                const id = item['id'] || item['ID'] || item['id'] || '';
                const name = item['наименование'] || item['название'] || item['name'] || '';
                
                if (id && name && !isNaN(parseInt(id))) {
                    equipment.push(item);
                    
                    // Отладочная информация для первого элемента
                    if (equipment.length === 1) {
                        console.log('Первый элемент из Google Sheets:', item);
                        console.log('Ключи объекта:', Object.keys(item));
                    }
                }
            }
        } catch (error) {
            console.warn(`Ошибка парсинга строки ${i}:`, error);
        }
    }
    
    console.log(`Всего загружено ${equipment.length} элементов из CSV`);
    return equipment;
}

// Парсинг строки CSV с учетом кавычек
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 2;
                continue;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
        i++;
    }
    
    result.push(current.trim());
    return result;
}

// Поиск оборудования
function handleSearch() {
    const searchTerm = searchEquipment.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredEquipment = [...equipmentData];
    } else {
        filteredEquipment = equipmentData.filter(equipment => 
            equipment.name.toLowerCase().includes(searchTerm) ||
            equipment.description.toLowerCase().includes(searchTerm) ||
            equipment.specifications.toLowerCase().includes(searchTerm) ||
            equipment.purpose.toLowerCase().includes(searchTerm) ||
            equipment.application.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderEquipment();
}

// Фильтрация по категориям
function handleCategoryFilter() {
    const selectedCategory = categoryFilter.value;
    
    if (selectedCategory === 'all') {
        filteredEquipment = [...equipmentData];
    } else {
        const categoryMap = {
            '3d-printers': '3D принтеры',
            '3d-scanners': '3D сканеры',
            'milling': 'Фрезерные станки',
            'frezy': 'Фрезы',
            'sinterising': 'Синтеризация',
            'zirkon': 'Циркониевые диски',
            'post-processing': 'Пост-обработка',
            'photo-polymers': 'Фотополимеры',
            'consumables': 'Расходные материалы',
            'compressors': 'Компрессоры'
        };
        
        const targetCategory = categoryMap[selectedCategory];
        filteredEquipment = equipmentData.filter(equipment => 
            equipment.category === targetCategory
        );
    }
    
    currentPage = 1;
    renderEquipment();
}

// Сортировка оборудования
function handleSort() {
    const sortBy = sortEquipment.value;
    
        filteredEquipment.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'category':
                return a.category.localeCompare(b.category);
            default:
                return 0;
        }
    });
    
    renderEquipment();
}

// Отображение оборудования в таблице
function renderEquipment() {
    console.log('Начинаем отображение оборудования...');
    
    if (!equipmentTableBody) {
        console.error('Элемент equipmentTableBody не найден!');
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageEquipment = filteredEquipment.slice(startIndex, endIndex);
    
    equipmentTableBody.innerHTML = '';
    
    if (pageEquipment.length === 0) {
        equipmentTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Оборудование не найдено</h5>
                    <p class="text-muted">Попробуйте изменить поисковый запрос или фильтры</p>
                </td>
            </tr>
        `;
    } else {
        pageEquipment.forEach(equipment => {
            const row = createEquipmentRow(equipment);
            equipmentTableBody.appendChild(row);
        });
    }
    
    renderPagination();
    equipmentContainer.style.display = 'block';
}

// Создание строки таблицы для оборудования
function createEquipmentRow(equipment) {
    const row = document.createElement('tr');
    
    // Добавляем стили для кликабельности
    row.style.cursor = 'pointer';
    row.classList.add('equipment-row');
    
    // Добавляем обработчик клика
    row.addEventListener('click', () => {
        showEquipmentModal(equipment.id);
    });
    
    // Изображение
    const imageCell = document.createElement('td');
    imageCell.innerHTML = createEquipmentImage(equipment.image);
    
    // Наименование
    const nameCell = document.createElement('td');
    nameCell.innerHTML = `
        <div class="equipment-name">
            <h5 class="mb-2">${equipment.name}</h5>
            <div class="equipment-category">
                <span class="badge bg-primary me-2">${equipment.category}</span>
                ${equipment.sourceTitle ? `<span class="badge bg-secondary ms-1" title="Источник: ${equipment.sourceTitle}">${equipment.sourceTitle}</span>` : ''}
            </div>
        </div>
    `;
    
    // Описание
    const descriptionCell = document.createElement('td');
    descriptionCell.innerHTML = `
        <div class="equipment-description">
            <p class="mb-2">${equipment.description}</p>
            <div class="equipment-details">
                <small class="text-muted">
                    <strong>Назначение:</strong> ${equipment.purpose}<br>
                    <strong>Применение:</strong> ${equipment.application}
                </small>
            </div>
        </div>
    `;
    
    // Характеристики
    const specsCell = document.createElement('td');
    specsCell.innerHTML = formatSpecsForTable(equipment.specifications);
    
    row.appendChild(imageCell);
    row.appendChild(nameCell);
    row.appendChild(descriptionCell);
    row.appendChild(specsCell);
    
    return row;
}

// Создание изображения оборудования с множественными fallback вариантами
function createEquipmentImage(imageUrl) {
    if (imageUrl && imageUrl.trim() && isValidImageUrl(imageUrl)) {
        // Для imgbb генерируем несколько вариантов URL для fallback
        const fallbackUrls = [];
        
        if (imageUrl.includes('ibb.co/')) {
            const match = imageUrl.match(/ibb\.co\/([a-zA-Z0-9]+)/);
            if (match && match[1]) {
                const id = match[1];
                fallbackUrls.push(
                    `https://i.ibb.co/${id}/${id}.jpg`,
                    `https://i.ibb.co/${id}/${id}.png`,
                    `https://i.ibb.co/${id}/image.jpg`,
                    `https://i.ibb.co/${id}/image.png`,
                    imageUrl // оригинальная ссылка как последний вариант
                );
            }
        } else {
            fallbackUrls.push(imageUrl);
        }
        
        const fallbackScript = fallbackUrls.length > 1 ? 
            `
            var fallbacks = ${JSON.stringify(fallbackUrls)};
            var currentIndex = 0;
            this.onerror = function() {
                currentIndex++;
                if (currentIndex < fallbacks.length) {
                    this.src = fallbacks[currentIndex];
                } else {
                    this.style.display='none'; 
                    this.nextElementSibling.style.display='flex';
                }
            };
            ` : 
            `this.style.display='none'; this.nextElementSibling.style.display='flex';`;
        
        return `
            <img src="${fallbackUrls[0]}" 
                 alt="Изображение оборудования" 
                 class="equipment-image" 
                 loading="lazy"
                 onerror="${fallbackScript}"
                 onload="this.style.opacity='1';"
                 style="opacity: 0; transition: opacity 0.3s ease;"
                 data-original-url="${imageUrl}">
            <div class="equipment-image-placeholder" style="display: none;">
                <i class="fas fa-microscope"></i>
            </div>
        `;
    } else {
        return `
            <div class="equipment-image-placeholder">
                <i class="fas fa-microscope"></i>
            </div>
        `;
    }
}

// Форматирование характеристик для таблицы
function formatSpecsForTable(specs) {
    if (!specs || specs.trim() === '') return '<span class="text-muted">Не указаны</span>';
    
    // Берем первые 3-4 характеристики для лучшего отображения
    const specLines = specs.split('\n').filter(line => line.trim()).slice(0, 4);
    
    return specLines.map(line => {
        const [label, value] = line.split(':').map(s => s.trim());
        return `
            <div class="spec-item-table">
                <span class="spec-label">${label || 'Характеристика'}:</span>
                <span class="spec-value">${value || line}</span>
            </div>
        `;
    }).join('');
}


// Отображение пагинации
function renderPagination() {
    if (!equipmentPagination) return;
    
    const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
    
    if (totalPages <= 1) {
        equipmentPagination.style.display = 'none';
        return;
    }
    
    equipmentPagination.style.display = 'block';
    
    let paginationHTML = '';
    
    // Предыдущая страница
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Показываем ВСЕ номера страниц (убираем ограничение)
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Следующая страница
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    equipmentPagination.querySelector('.pagination').innerHTML = paginationHTML;
    
    // Добавляем обработчики для пагинации
    equipmentPagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.getAttribute('data-page'));
            if (page && page !== currentPage && page >= 1 && page <= totalPages) {
                currentPage = page;
                renderEquipment();
            }
        });
    });
    
    // Показываем информацию о количестве найденных элементов
    const totalItems = filteredEquipment.length;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const infoText = `Показано ${startItem}-${endItem} из ${totalItems} элементов`;
    
    // Добавляем информацию под таблицей, если есть контейнер
    const infoContainer = document.getElementById('equipment-info');
    if (infoContainer) {
        infoContainer.innerHTML = `<p class="text-muted text-center mt-3">${infoText}</p>`;
    }
}

// Показ модального окна с деталями оборудования
function showEquipmentModal(equipmentId) {
    const equipment = equipmentData.find(e => e.id === equipmentId);
    if (!equipment) {
        console.error('Оборудование не найдено:', equipmentId);
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('equipmentModal'));
    const modalTitle = document.getElementById('equipmentModalTitle');
    const modalBody = document.getElementById('equipmentModalBody');
    
    modalTitle.textContent = equipment.name;
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                ${createEquipmentImageLarge(equipment.image)}
            </div>
            <div class="col-md-8">
                <div class="mb-3">
                    <span class="badge bg-primary fs-6 me-2">${equipment.category}</span>
                </div>
                
                <h4>${equipment.name}</h4>
                
                <div class="mb-3">
                    <h5>Назначение:</h5>
                    <p>${equipment.purpose}</p>
                </div>
                
                <div class="mb-3">
                    <h5>Применение:</h5>
                    <p>${equipment.application}</p>
                </div>
                
                <div class="mb-3">
                    <h5>Описание:</h5>
                    <p>${equipment.description}</p>
                </div>
                
                <div class="equipment-modal-specs">
                    <h5>Характеристики:</h5>
                    <div class="spec-grid">
                        ${formatSpecsForModal(equipment.specifications)}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.show();
}

// Создание большого изображения для модального окна
function createEquipmentImageLarge(imageUrl) {
    if (imageUrl && imageUrl.trim() && isValidImageUrl(imageUrl)) {
        return `
            <img src="${imageUrl}" 
                 alt="Изображение оборудования" 
                 class="equipment-modal-image" 
                 loading="lazy"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                 onload="this.style.opacity='1';"
                 style="opacity: 0; transition: opacity 0.3s ease;">
            <div class="equipment-image-placeholder equipment-modal-image" style="display: none;">
                <i class="fas fa-microscope fa-3x"></i>
            </div>
        `;
    } else {
        return `
            <div class="equipment-image-placeholder equipment-modal-image">
                <i class="fas fa-microscope fa-3x"></i>
            </div>
        `;
    }
}

// Форматирование характеристик для модального окна
function formatSpecsForModal(specs) {
    if (!specs || specs.trim() === '') return '<p>Характеристики не указаны</p>';
    
    const specLines = specs.split('\n').filter(line => line.trim());
    
    if (specLines.length > 1) {
        return specLines.map(line => {
            const [label, value] = line.split(':').map(s => s.trim());
            return `
                <div class="spec-item">
                    <span class="spec-label">${label || 'Характеристика'}:</span>
                    <span class="spec-value">${value || line}</span>
                </div>
            `;
        }).join('');
    } else {
        return `<p>${specs}</p>`;
    }
}

// Показ состояния загрузки
function showLoading() {
    if (loadingEquipment) loadingEquipment.style.display = 'block';
    if (errorEquipment) errorEquipment.style.display = 'none';
    if (equipmentContainer) equipmentContainer.style.display = 'none';
}

// Скрытие состояния загрузки
function hideLoading() {
    if (loadingEquipment) loadingEquipment.style.display = 'none';
}

// Показ ошибки
function showError(message) {
    hideLoading();
    if (errorEquipment) {
        errorEquipment.style.display = 'block';
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }
}


// Функция debounce для оптимизации поиска
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Экспорт функций для глобального использования
window.educationalCatalogModule = {
    loadEquipment: loadEquipmentFromGoogleSheets,
    searchEquipment: handleSearch,
    filterEquipment: handleCategoryFilter,
    sortEquipment: handleSort
};
