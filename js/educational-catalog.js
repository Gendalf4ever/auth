/**
 * Обучающий каталог оборудования
 * Загружает данные из Google Sheets и отображает их в виде обучающей таблицы без цен
 */

// Глобальные переменные
let equipmentData = [];
let filteredEquipment = [];
let currentPage = 1;
let itemsPerPage = 10;

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

// CORS proxy для загрузки данных
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://thingproxy.freeboard.io/fetch/',
    'https://corsproxy.io/?'
];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeEquipment();
    setupEventListeners();
});

// Инициализация оборудования
function initializeEquipment() {
    showLoading();
    
    // Добавляем таймаут для загрузки
    const loadTimeout = setTimeout(() => {
        console.warn('Таймаут загрузки, показываем демо-данные');
        loadDemoEquipment();
    }, 10000); // 10 секунд
    
    loadEquipmentFromGoogleSheets().finally(() => {
        clearTimeout(loadTimeout);
    });
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
            showLoading();
            loadEquipmentFromGoogleSheets();
        });
    }
}

// Загрузка данных из Google Sheets
async function loadEquipmentFromGoogleSheets() {
    console.log('Начинаем загрузку оборудования...');
    
    try {
        // Получаем конфигурацию для текущей страницы
        const config = window.sheetConfig.getCurrentConfig();
        const exportUrl = window.sheetConfig.getExportUrl();
        
        if (!exportUrl) {
            throw new Error('Не удалось получить URL для загрузки данных');
        }
        
        console.log('URL для загрузки:', exportUrl);
        
        // Пробуем разные CORS proxy
        for (let i = 0; i < CORS_PROXIES.length; i++) {
            try {
                const proxyUrl = CORS_PROXIES[i];
                const fullUrl = proxyUrl + encodeURIComponent(exportUrl);
                
                console.log(`Пробуем proxy ${i + 1}/${CORS_PROXIES.length}:`, proxyUrl);
                
                const response = await fetch(fullUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/csv,text/plain,*/*',
                    },
                    mode: 'cors'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const csvText = await response.text();
                console.log('Получены данные CSV, длина:', csvText.length);
                
                if (csvText.length < 100) {
                    throw new Error('Получены некорректные данные');
                }
                
                equipmentData = parseCSV(csvText);
                console.log('Распарсено оборудования:', equipmentData.length);
                
                if (equipmentData.length === 0) {
                    throw new Error('Нет данных для отображения');
                }
                
                // Преобразуем данные в формат для обучающего каталога
                equipmentData = transformToEducationalFormat(equipmentData);
                
                filteredEquipment = [...equipmentData];
                hideLoading();
                renderEquipment();
                
                console.log('Оборудование успешно загружено и отображено');
                return; // Успешно загружено, выходим из цикла
                
            } catch (error) {
                console.warn(`Proxy ${i + 1} не сработал:`, error.message);
                
                // Если это последний proxy, показываем демо-данные
                if (i === CORS_PROXIES.length - 1) {
                    console.error('Все proxy не сработали, показываем демо-данные');
                    loadDemoEquipment();
                    return;
                }
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showError('Не удалось загрузить данные из Google Sheets. Показываем демо-данные.');
        loadDemoEquipment();
    }
}

// Преобразование данных в формат для обучающего каталога
function transformToEducationalFormat(data) {
    return data.map(item => {
        // Определяем категорию на основе названия и описания
        const category = determineCategory(item['наименование'] || '', item['описание'] || '');
        
        // Определяем сложность (на основе цены как индикатора сложности)
        const complexity = determineComplexity(item['цена'] || '0');
        
        // Определяем назначение
        const purpose = determinePurpose(item['наименование'] || '', item['описание'] || '');
        
        // Определяем применение
        const application = determineApplication(category, item['описание'] || '');
        
        return {
            id: item['id'] || '',
            name: item['наименование'] || 'Без названия',
            category: category,
            purpose: purpose,
            description: item['описание'] || 'Описание отсутствует',
            specifications: item['характеристики'] || 'Характеристики не указаны',
            image: item['изображение'] || '',
            complexity: complexity,
            application: application,
            originalData: item // Сохраняем оригинальные данные
        };
    });
}

// Определение категории оборудования
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

// Определение сложности (на основе цены)
function determineComplexity(price) {
    const numericPrice = parseFloat((price || '0').replace(/[^\d]/g, ''));
    
    if (numericPrice >= 1000000) return 'Высокая';
    if (numericPrice >= 500000) return 'Средняя';
    if (numericPrice >= 100000) return 'Базовая';
    return 'Начальная';
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

// Загрузка демо-данных при ошибке
function loadDemoEquipment() {
    console.log('Загружаем демо-данные...');
    
    equipmentData = [
        {
            id: '1',
            name: '3D сканер Sirona Primescan',
            category: '3D сканеры',
            purpose: 'Стоматология',
            description: 'Высокоточный внутриротовой сканер для цифровой стоматологии. Обеспечивает высокую скорость и точность цифровых оттисков. Подходит для простых и сложных клинических случаев, включая полные реставрации.',
            specifications: 'ДхШхВ: 408x1400x550 мм\nВес: 40000 г\nТочность: ±10 мкм\nСкорость сканирования: 0.2 сек\nРазрешение: 6 МП\nОперационная система: Windows 10, 64 bit\nМонитор: 21.5" TFT LCD\nФункция автоподогрева для предотвращения запотевания',
            image: '',
            complexity: 'Высокая',
            application: 'Сканирование полости рта, цифровые оттиски'
        },
        {
            id: '2',
            name: '3D принтер Shining AccuFab-CEL',
            category: '3D принтеры',
            purpose: 'Стоматология',
            description: 'Стоматологический 3D-принтер с улучшенной скоростью печати для производства коронок и мостов. Обеспечивает высокое качество и точность печати стоматологических изделий.',
            specifications: 'Технология печати: LCD\nОбласть печати: 70x70x180 мм\nСкорость печати: 100 мм/ч\nТочность: ±50 мкм\nРазрешение печати: 4K\nМатериалы: Фотополимерные смолы\nПодключение: USB, Wi-Fi',
            image: '',
            complexity: 'Высокая',
            application: 'Печать коронок, мостов, протезов'
        },
        {
            id: '3',
            name: 'Фрезерный станок Roland DWX-52D',
            category: 'Фрезерные станки',
            purpose: 'Лаборатория',
            description: 'Компактный фрезерный станок для обработки циркониевых дисков и других материалов. Автоматическая смена инструмента и высокая точность обработки.',
            specifications: 'Область обработки: 40x25x55 мм\nСкорость шпинделя: 60,000 об/мин\nТочность: ±5 мкм\nАвтоматическая смена инструмента: 6 позиций\nМатериалы: Цирконий, воск, композит\nПрограммное обеспечение: DWX-52D Software',
            image: '',
            complexity: 'Средняя',
            application: 'Обработка заготовок, финишная обработка'
        },
        {
            id: '4',
            name: 'Фотополимерная смола NextDent Base',
            category: 'Материалы',
            purpose: 'Общее применение',
            description: 'Высококачественная фотополимерная смола для 3D печати стоматологических изделий. Обеспечивает отличные механические свойства и биосовместимость.',
            specifications: 'Цвет: прозрачный\nВязкость: 300-500 мПа·с\nПрочность на изгиб: 80-120 МПа\nТемпература печати: 25-30°C\nВремя отверждения: 2-3 мин\nБиосовместимость: ISO 10993\nОбъем: 1 л',
            image: '',
            complexity: 'Базовая',
            application: 'Сырье для производства'
        },
        {
            id: '5',
            name: 'Печь для синтеризации Nabertherm',
            category: 'Пост-обработка',
            purpose: 'Лаборатория',
            description: 'Высокотемпературная печь для синтеризации циркониевых изделий. Программируемые циклы нагрева для различных материалов.',
            specifications: 'Максимальная температура: 1600°C\nОбъем камеры: 2.5 л\nТочность температуры: ±5°C\nПрограммируемые циклы: 10\nВремя нагрева: 2-3 часа\nМатериалы: Цирконий, керамика\nУправление: Цифровая панель',
            image: '',
            complexity: 'Высокая',
            application: 'Окончательная обработка изделий'
        },
        {
            id: '6',
            name: '3D принтер Formlabs Form 3B',
            category: '3D принтеры',
            purpose: 'Лаборатория',
            description: 'Профессиональный SLA принтер для создания высокоточных стоматологических моделей. Использует технологию Low Force Stereolithography для улучшенного качества печати.',
            specifications: 'Технология печати: SLA\nОбласть печати: 145x145x185 мм\nСлой: 25-100 мкм\nТочность: ±50 мкм\nРазрешение: 25 мкм\nМатериалы: Биосовместимые смолы\nПрограммное обеспечение: PreForm',
            image: '',
            complexity: 'Средняя',
            application: 'Печать моделей, временных коронок'
        },
        {
            id: '7',
            name: 'Сканер внутриротовой iTero Element 5D',
            category: '3D сканеры',
            purpose: 'Клиника',
            description: 'Современный внутриротовой сканер с возможностью 3D и рентгеновского сканирования. Интегрированная диагностика и планирование лечения.',
            specifications: 'Точность: ±20 мкм\nСкорость: 0.3 сек\nРазрешение: 4 МП\nВес: 320 г\nФункции: 3D + рентген\nПрограммное обеспечение: iTero\nПодключение: Wi-Fi, Bluetooth',
            image: '',
            complexity: 'Средняя',
            application: 'Диагностика, планирование лечения'
        },
        {
            id: '8',
            name: 'Циркониевый диск Zirkonzahn',
            category: 'Материалы',
            purpose: 'Лаборатория',
            description: 'Высококачественный циркониевый диск для фрезерования коронок и мостов. Обеспечивает отличные механические свойства и эстетику.',
            specifications: 'Диаметр: 98.5 мм\nТолщина: 18 мм\nЦвет: белый\nПлотность: 6.08 г/см³\nПрочность: 1200 МПа\nТемпература спекания: 1500°C\nБиосовместимость: ISO 10993',
            image: '',
            complexity: 'Начальная',
            application: 'Заготовки для фрезерования'
        }
    ];
    
    filteredEquipment = [...equipmentData];
    hideLoading();
    renderEquipment();
    
    // Показываем уведомление о демо-данных
    showWarning('Загружены демо-данные. Проверьте подключение к интернету для загрузки актуального каталога.');
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
                }
            }
        } catch (error) {
            console.warn(`Ошибка парсинга строки ${i}:`, error);
        }
    }
    
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
            'scanners': '3D сканеры',
            'milling': 'Фрезерные станки',
            'materials': 'Материалы',
            'post-processing': 'Пост-обработка'
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
            case 'complexity':
                const complexityOrder = { 'Начальная': 1, 'Базовая': 2, 'Средняя': 3, 'Высокая': 4 };
                return complexityOrder[a.complexity] - complexityOrder[b.complexity];
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
                <td colspan="8" class="text-center py-5">
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
                <span class="badge ${getComplexityClass(equipment.complexity)}">${equipment.complexity}</span>
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
    
    // Действия
    const actionsCell = document.createElement('td');
    actionsCell.innerHTML = `
        <button class="btn btn-sm btn-outline-primary" onclick="showEquipmentModal('${equipment.id}')" title="Подробнее">
            <i class="fas fa-info-circle"></i>
        </button>
    `;
    
    row.appendChild(imageCell);
    row.appendChild(nameCell);
    row.appendChild(descriptionCell);
    row.appendChild(specsCell);
    row.appendChild(actionsCell);
    
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

// Получение CSS класса для сложности
function getComplexityClass(complexity) {
    switch (complexity) {
        case 'Начальная': return 'bg-success';
        case 'Базовая': return 'bg-info';
        case 'Средняя': return 'bg-warning';
        case 'Высокая': return 'bg-danger';
        default: return 'bg-secondary';
    }
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
    
    // Номера страниц
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
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
                    <span class="badge ${getComplexityClass(equipment.complexity)} fs-6">${equipment.complexity}</span>
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

// Показ предупреждения
function showWarning(message) {
    if (errorEquipment) {
        errorEquipment.style.display = 'block';
        errorEquipment.className = 'alert alert-warning';
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
