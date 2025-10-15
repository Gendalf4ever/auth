// Скрипт для загрузки сканеров и материалов из Firebase

let scanersData = [];
let scanningMaterialsData = [];
let productsDb = null;

// Инициализация и загрузка данных
async function initializeScaners() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ СКАНЕРОВ ===');
    
    try {
        // Получаем Firestore для товаров
        productsDb = window.getProductsFirestore();
        console.log('Firestore для товаров получен');
        
        await loadScanersFromFirebase();
        await loadScanningMaterialsFromFirebase();
        displayScanersProducts();
        displayScanningMaterials();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Не удалось загрузить данные о сканерах');
    }
}

// Загрузка сканеров из Firebase
async function loadScanersFromFirebase() {
    console.log('=== ЗАГРУЗКА СКАНЕРОВ ИЗ FIREBASE ===');
    
    try {
        const snapshot = await productsDb.collection('products').get();
        console.log(`Получено ${snapshot.size} документов из Firebase`);
        
        const allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Фильтруем только сканеры, исключаем спреи и фотополимеры
        scanersData = allProducts.filter(product => {
            const name = (product.name || product.наименование || '').toLowerCase();
            const category = (product.category || product.категория || '').toLowerCase();
            const description = (product.description || product.описание || '').toLowerCase();
            const tags = (product.tags || product.теги || '').toLowerCase();
            
            // Исключаем спреи и фотополимеры
            const isExcluded = 
                // Спреи
                name.includes('спрей') ||
                name.includes('spray') ||
                category.includes('спрей') ||
                category.includes('spray') ||
                tags.includes('спрей') ||
                tags.includes('spray') ||
                description.includes('спрей') ||
                description.includes('spray') ||
                // Фотополимеры
                name.includes('фотополимер') ||
                name.includes('photopolymer') ||
                name.includes('resin') ||
                name.includes('смола') ||
                category.includes('фотополимер') ||
                category.includes('photopolymer') ||
                category.includes('resin') ||
                category.includes('смола') ||
                tags.includes('фотополимер') ||
                tags.includes('photopolymer') ||
                tags.includes('resin') ||
                tags.includes('смола') ||
                description.includes('фотополимер') ||
                description.includes('photopolymer') ||
                // Материалы для печати
                name.includes('harz') ||
                name.includes('dental model') ||
                name.includes('dental pink') ||
                category.includes('материалы') ||
                category.includes('materials');
            
            if (isExcluded) {
                console.log(`❌ Исключен материал: ${name} (спрей/фотополимер)`);
                return false;
            }
            
            // Логика фильтрации для сканеров
            const isScaner = 
                // Проверяем категорию
                category === 'сканеры' ||
                category === 'сканер' ||
                category === '3d сканеры' ||
                category === '3d сканер' ||
                category === '3d-сканеры' ||
                category === '3d-сканер' ||
                category === 'scanners' ||
                category === 'scanner' ||
                category === '3d scanners' ||
                category === '3d scanner' ||
                category === 'интраоральные сканеры' ||
                category === 'интраоральный сканер' ||
                // Проверяем теги
                tags.includes('сканер') ||
                tags.includes('сканеры') ||
                tags.includes('scanner') ||
                tags.includes('scanners') ||
                tags.includes('3d сканер') ||
                tags.includes('3d scanner') ||
                tags.includes('интраоральный') ||
                tags.includes('intraoral') ||
                tags.includes('оптический') ||
                tags.includes('лазерный') ||
                tags.includes('стоматологический сканер') ||
                // Проверяем название
                name.includes('сканер') ||
                name.includes('scanner') ||
                name.includes('скан') ||
                name.includes('scan') ||
                name.includes('интраоральн') ||
                name.includes('intraoral') ||
                name.includes('оптическ') ||
                name.includes('лазерн') ||
                name.includes('trios') ||
                name.includes('cerec') ||
                name.includes('itero') ||
                name.includes('carestream') ||
                name.includes('3shape') ||
                // Проверяем описание
                description.includes('сканер') ||
                description.includes('сканирование') ||
                description.includes('scanner') ||
                description.includes('scanning') ||
                description.includes('интраоральн') ||
                description.includes('оптическ');
            
            if (isScaner) {
                console.log(`✅ Найден сканер: ${name}`);
                console.log(`   Категория: ${category}`);
                console.log(`   Теги: ${tags}`);
            } else {
                console.log(`❌ Продукт не является сканером: ${name} (категория: ${category})`);
            }
            
            return isScaner;
        });
        
        console.log(`Найдено ${scanersData.length} сканеров из ${allProducts.length} общих продуктов`);
        
        if (scanersData.length === 0) {
            console.warn('Не найдено ни одного сканера');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки сканеров:', error);
        throw error;
    }
}

// Отображение сканеров
function displayScanersProducts() {
    console.log('=== ОТОБРАЖЕНИЕ СКАНЕРОВ ===');
    
    const container = document.getElementById('scaners-products-container');
    if (!container) {
        console.error('Контейнер scaners-products-container не найден');
        return;
    }
    
    if (scanersData.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <h5>Сканеры пока не добавлены</h5>
                <p class="mb-0">Скоро здесь появится каталог интраоральных сканеров</p>
            </div>
        `;
        return;
    }
    
    let productsHTML = '<div class="row">';
    
    scanersData.forEach(product => {
        const productCard = createScanerProductCard(product);
        productsHTML += productCard;
    });
    
    productsHTML += '</div>';
    container.innerHTML = productsHTML;
    
    console.log(`Отображено ${scanersData.length} сканеров`);
}

// Создание карточки сканера в стиле циркониевых материалов
function createScanerProductCard(product) {
    const name = product.name || product.наименование || 'Без названия';
    const fullDescription = product.description || product.описание || 'Описание отсутствует';
    
    // Сокращаем описание до первых 50 символов + "..."
    const shortDescription = fullDescription.length > 50 
        ? fullDescription.substring(0, 50) + '...' 
        : fullDescription;
    
    // Определяем изображение
    let imageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        imageHTML = `<img src="${imageUrl}" class="scaner-product-image" alt="${name}">`;
    } else {
        imageHTML = `
            <div class="scaner-product-placeholder">
                <i class="fas fa-tooth"></i>
            </div>
        `;
    }
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="scaner-product-card">
                <div class="scaner-image-container">
                    ${imageHTML}
                </div>
                <h5 class="scaner-product-title">${name}</h5>
                <p class="scaner-product-description">${shortDescription}</p>
                <button class="btn btn-outline-primary scaner-details-btn" onclick="showScanerProductDetails('${product.id}')">
                    <i class="fas fa-info-circle me-2"></i>Подробнее
                </button>
            </div>
        </div>
    `;
}

// Извлечение характеристик из продукта
function getProductSpecifications(product) {
    const specsFields = [
        'specifications', 'характеристики', 'specs', 'Характеристики',
        'characteristics', 'techSpecs', 'technicalSpecs', 
        'parameters', 'параметры', 'features', 'свойства', 'properties'
    ];
    
    for (const field of specsFields) {
        if (product[field]) {
            const value = product[field];
            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }
            if (typeof value === 'object' && value !== null) {
                return value;
            }
        }
    }
    
    const allKeys = Object.keys(product);
    for (const key of allKeys) {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('характ') || keyLower.includes('spec') || 
            keyLower.includes('параметр') || keyLower.includes('свойств')) {
            const value = product[key];
            if (value && (typeof value === 'string' || typeof value === 'object')) {
                return value;
            }
        }
    }
    
    return 'Характеристики не указаны';
}

// Форматирование характеристик
function formatSpecifications(specs) {
    if (!specs || specs === 'Характеристики не указаны') {
        return '<p class="text-muted">Характеристики не указаны</p>';
    }
    
    if (typeof specs === 'object' && !Array.isArray(specs)) {
        const specsList = Object.entries(specs).map(([key, value]) => {
            return `<div class="spec-item"><strong>${key}:</strong> ${value}</div>`;
        }).join('');
        return specsList || '<p class="text-muted">Характеристики не указаны</p>';
    }
    
    const specsStr = String(specs);
    const lines = specsStr.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        return '<p class="text-muted">Характеристики не указаны</p>';
    }
    
    const formattedLines = lines.map(line => {
        line = line.trim();
        if (line.includes(':')) {
            const parts = line.split(':');
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            return `<div class="spec-item"><strong>${key}:</strong> ${value}</div>`;
        } else {
            return `<div class="spec-item">${line}</div>`;
        }
    }).join('');
    
    return formattedLines;
}

// Показать детали сканера
function showScanerProductDetails(productId) {
    const product = scanersData.find(p => p.id === productId);
    if (!product) {
        console.error('Продукт не найден:', productId);
        return;
    }
    
    const name = product.name || product.наименование || 'Без названия';
    const description = product.description || product.описание || 'Описание отсутствует';
    const specifications = getProductSpecifications(product);
    const price = product.price || product.цена || '';
    
    // Определяем изображение для модального окна
    let modalImageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        modalImageHTML = `<img src="${imageUrl}" class="scaner-modal-image mb-3" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    
    const modalPlaceholderHTML = `
        <div class="scaner-modal-image-placeholder mb-3" ${imageUrl ? 'style="display: none;"' : ''}>
            <i class="fas fa-tooth"></i>
        </div>
    `;
    
    // Создаем модальное окно
    const modalHTML = `
        <div class="modal fade" id="scanerProductModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center">
                            ${modalImageHTML}
                            ${modalPlaceholderHTML}
                        </div>
                        <div class="specs-detail">
                            <h6><i class="fas fa-info-circle me-2"></i>Описание</h6>
                            <p>${description}</p>
                            
                            <h6><i class="fas fa-cogs me-2"></i>Характеристики</h6>
                            <div class="specifications-content">
                                ${formatSpecifications(specifications)}
                            </div>
                            
                            ${price ? `
                                <h6><i class="fas fa-tag me-2"></i>Цена</h6>
                                <p class="price-info fs-5">
                                    <span class="badge bg-success">${price}</span>
                                </p>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Удаляем предыдущее модальное окно, если есть
    const existingModal = document.getElementById('scanerProductModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('scanerProductModal'));
    modal.show();
}

// Показать ошибку
function showError(message) {
    const container = document.getElementById('scaners-products-container');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <h5>Ошибка загрузки</h5>
                <p class="mb-0">${message}</p>
            </div>
        `;
    }
}

// Загрузка материалов для сканирования из Firebase
async function loadScanningMaterialsFromFirebase() {
    console.log('=== ЗАГРУЗКА МАТЕРИАЛОВ ДЛЯ СКАНИРОВАНИЯ ИЗ FIREBASE ===');
    
    try {
        const snapshot = await productsDb.collection('products').get();
        console.log(`Получено ${snapshot.size} документов из Firebase для материалов`);
        
        const allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Фильтруем только спреи для сканирования, исключаем сканеры
        scanningMaterialsData = allProducts.filter(product => {
            const name = (product.name || product.наименование || '').toLowerCase();
            const category = (product.category || product.категория || '').toLowerCase();
            const description = (product.description || product.описание || '').toLowerCase();
            const tags = (product.tags || product.теги || '').toLowerCase();
            
            // Исключаем все сканеры
            const isScanner = 
                // Проверяем категорию
                category === 'сканеры' ||
                category === 'сканер' ||
                category === '3d сканеры' ||
                category === '3d сканер' ||
                category === '3d-сканеры' ||
                category === '3d-сканер' ||
                category === 'scanners' ||
                category === 'scanner' ||
                category === '3d scanners' ||
                category === '3d scanner' ||
                category === 'интраоральные сканеры' ||
                category === 'интраоральный сканер' ||
                // Проверяем теги
                tags.includes('сканер') ||
                tags.includes('сканеры') ||
                tags.includes('scanner') ||
                tags.includes('scanners') ||
                tags.includes('3d сканер') ||
                tags.includes('3d scanner') ||
                tags.includes('интраоральный') ||
                tags.includes('intraoral') ||
                tags.includes('оптический сканер') ||
                tags.includes('лазерный сканер') ||
                tags.includes('стоматологический сканер') ||
                // Проверяем название
                name.includes('сканер') ||
                name.includes('scanner') ||
                name.includes('скан') && !name.includes('спрей') ||
                name.includes('scan') && !name.includes('spray') ||
                name.includes('интраоральн') ||
                name.includes('intraoral') ||
                name.includes('trios') ||
                name.includes('cerec') ||
                name.includes('itero') ||
                name.includes('carestream') ||
                name.includes('3shape') ||
                // Проверяем описание
                description.includes('интраоральный сканер') ||
                description.includes('3d сканер') ||
                description.includes('оптический сканер') ||
                description.includes('лазерный сканер');
            
            if (isScanner) {
                console.log(`❌ Исключен сканер из материалов: ${name}`);
                return false;
            }
            
            // Логика фильтрации для спреев и материалов для сканирования
            const isScanningMaterial = 
                // Проверяем категорию
                category === 'спреи' ||
                category === 'спрей' ||
                category === 'spray' ||
                category === 'sprays' ||
                category === 'материалы для сканирования' ||
                category === 'scanning materials' ||
                category === 'материалы' ||
                category === 'materials' ||
                // Проверяем теги
                tags.includes('спрей') ||
                tags.includes('спреи') ||
                tags.includes('spray') ||
                tags.includes('sprays') ||
                tags.includes('сканирование') && !tags.includes('сканер') ||
                tags.includes('scanning') && !tags.includes('scanner') ||
                tags.includes('материал') ||
                tags.includes('material') ||
                tags.includes('опудривание') ||
                tags.includes('powder') ||
                tags.includes('матирующий') ||
                tags.includes('матирование') ||
                // Проверяем название
                name.includes('спрей') ||
                name.includes('spray') ||
                name.includes('опудр') ||
                name.includes('powder') ||
                name.includes('матир') ||
                name.includes('matt') ||
                name.includes('scan') && name.includes('spray') ||
                name.includes('сканир') && name.includes('спрей') ||
                // Проверяем описание
                description.includes('спрей') ||
                description.includes('spray') ||
                description.includes('опудривание') ||
                description.includes('матирующий') ||
                description.includes('матирование');
            
            if (isScanningMaterial) {
                console.log(`✅ Найден материал для сканирования: ${name}`);
                console.log(`   Категория: ${category}`);
                console.log(`   Теги: ${tags}`);
            } else {
                console.log(`❌ Продукт не является материалом для сканирования: ${name} (категория: ${category})`);
            }
            
            return isScanningMaterial;
        });
        
        console.log(`Найдено ${scanningMaterialsData.length} материалов для сканирования из ${allProducts.length} общих продуктов`);
        
        if (scanningMaterialsData.length === 0) {
            console.warn('Не найдено ни одного материала для сканирования');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки материалов для сканирования:', error);
        throw error;
    }
}

// Отображение материалов для сканирования
function displayScanningMaterials() {
    console.log('=== ОТОБРАЖЕНИЕ МАТЕРИАЛОВ ДЛЯ СКАНИРОВАНИЯ ===');
    
    const container = document.getElementById('scanning-materials-container');
    if (!container) {
        console.error('Контейнер scanning-materials-container не найден');
        return;
    }
    
    if (scanningMaterialsData.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <h5>Материалы пока не добавлены</h5>
                <p class="mb-0">Скоро здесь появятся спреи для сканирования</p>
            </div>
        `;
        return;
    }
    
    let productsHTML = '<div class="row">';
    
    scanningMaterialsData.forEach(product => {
        const productCard = createScanningMaterialCard(product);
        productsHTML += productCard;
    });
    
    productsHTML += '</div>';
    container.innerHTML = productsHTML;
    
    console.log(`Отображено ${scanningMaterialsData.length} материалов для сканирования`);
}

// Создание карточки материала для сканирования (в стиле сканеров)
function createScanningMaterialCard(product) {
    const name = product.name || product.наименование || 'Без названия';
    const fullDescription = product.description || product.описание || 'Описание отсутствует';
    
    // Сокращаем описание до первых 50 символов + "..."
    const shortDescription = fullDescription.length > 50 
        ? fullDescription.substring(0, 50) + '...' 
        : fullDescription;
    
    // Определяем изображение
    let imageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        imageHTML = `<img src="${imageUrl}" class="scaner-product-image" alt="${name}">`;
    } else {
        imageHTML = `
            <div class="scaner-product-placeholder">
                <i class="fas fa-spray-can"></i>
            </div>
        `;
    }
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="scaner-product-card">
                <div class="scaner-image-container">
                    ${imageHTML}
                </div>
                <h5 class="scaner-product-title">${name}</h5>
                <p class="scaner-product-description">${shortDescription}</p>
                <button class="btn btn-outline-primary scaner-details-btn" onclick="showScanningMaterialDetails('${product.id}')">
                    <i class="fas fa-info-circle me-2"></i>Подробнее
                </button>
            </div>
        </div>
    `;
}

// Показать детали материала для сканирования
function showScanningMaterialDetails(productId) {
    const product = scanningMaterialsData.find(p => p.id === productId);
    if (!product) {
        console.error('Материал не найден:', productId);
        return;
    }
    
    const name = product.name || product.наименование || 'Без названия';
    const description = product.description || product.описание || 'Описание отсутствует';
    const specifications = getProductSpecifications(product);
    
    // Определяем изображение для модального окна
    let modalImageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        modalImageHTML = `<img src="${imageUrl}" class="scaner-modal-image mb-3" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    
    const modalPlaceholderHTML = `
        <div class="scaner-modal-image-placeholder mb-3" ${imageUrl ? 'style="display: none;"' : ''}>
            <i class="fas fa-spray-can"></i>
        </div>
    `;
    
    // Создаем модальное окно
    const modalHTML = `
        <div class="modal fade" id="scanningMaterialModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center">
                            ${modalImageHTML}
                            ${modalPlaceholderHTML}
                        </div>
                        <div class="specs-detail">
                            <h6><i class="fas fa-info-circle me-2"></i>Описание</h6>
                            <p>${description}</p>
                            
                            <h6><i class="fas fa-cogs me-2"></i>Характеристики</h6>
                            <div class="specifications-content">
                                ${formatSpecifications(specifications)}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Удаляем предыдущее модальное окно, если есть
    const existingModal = document.getElementById('scanningMaterialModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('scanningMaterialModal'));
    modal.show();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализируем страницу сканеров');
    
    // Небольшая задержка для загрузки Firebase
    setTimeout(() => {
        initializeScaners();
    }, 1000);
});
