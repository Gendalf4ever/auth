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
        
        return {
            id: item['id'] || '',
            name: cleanEquipmentName(item['наименование'] || 'Без названия'),
            category: category,
            purpose: purpose,
            description: item['описание'] || 'Описание отсутствует',
            specifications: specifications,
            image: item['изображение'] || '',
            application: application,
            sourceSheet: item.sourceSheet || '',
            sourceTitle: item.sourceTitle || '',
            originalData: item // Сохраняем оригинальные данные
        };
    });
}

// Получение характеристик из различных возможных колонок
function getSpecifications(item) {
    console.log('=== ПОИСК ХАРАКТЕРИСТИК ===');
    console.log('Элемент для поиска характеристик:', item);
    console.log('Доступные ключи:', Object.keys(item));
    
    // Возможные названия колонок с характеристиками (расширенный список)
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
        'описание характеристик',
        'Описание характеристик',
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
                console.log(`✅ НАЙДЕНЫ характеристики в колонке "${column}":`, specs);
                return specs;
            }
        }
    }
    
    console.log('Точные совпадения не найдены. Ищем по ключевым словам...');
    // Дополнительный поиск: ищем колонки, содержащие ключевые слова
    const keywords = [
        'характеристик', 'параметр', 'spec', 'техническ', 'свойств', 
        'описан', 'feature', 'property', 'detail'
    ];
    
    for (const key of Object.keys(item)) {
        const lowerKey = key.toLowerCase().replace(/\s+/g, '');
        console.log(`Проверяем ключ "${key}" (нормализованный: "${lowerKey}")`);
        
        for (const keyword of keywords) {
            if (lowerKey.includes(keyword)) {
                console.log(`Найдено ключевое слово "${keyword}" в колонке "${key}"`);
                if (item[key] && item[key].toString().trim() !== '') {
                    const specs = item[key].toString().trim();
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
            // Проверяем, похоже ли на характеристики (содержит двоеточия, цифры, единицы измерения)
            const valueStr = value.toString();
            if (valueStr.includes(':') || valueStr.includes('мм') || valueStr.includes('см') || 
                valueStr.includes('кг') || valueStr.includes('В') || valueStr.includes('Вт') ||
                /\d+\s*[а-яё]+/i.test(valueStr)) {
                console.log(`✅ НАЙДЕНЫ характеристики в колонке ${i+1} ("${key}"):`, valueStr);
                return valueStr.trim();
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

// Создание изображения оборудования
function createEquipmentImage(imageUrl) {
    if (imageUrl && imageUrl.trim() && imageUrl.startsWith('http')) {
        return `
            <img src="${imageUrl}" 
                 alt="Изображение оборудования" 
                 class="equipment-image" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
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
    if (imageUrl && imageUrl.trim() && imageUrl.startsWith('http')) {
        return `
            <img src="${imageUrl}" 
                 alt="Изображение оборудования" 
                 class="equipment-modal-image" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
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
