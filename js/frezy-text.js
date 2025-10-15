// Скрипт для загрузки стоматологических фрез из Firebase

let frezyTextData = [];
let productsDb = null;

// Инициализация и загрузка данных
async function initializeFrezyText() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ФРЕЗ ===');
    
    try {
        // Получаем Firestore для товаров
        productsDb = window.getProductsFirestore();
        console.log('Firestore для товаров получен');
        
        await loadFrezyTextFromFirebase();
        displayFrezyTextProducts();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Не удалось загрузить данные о фрезах');
    }
}

// Загрузка фрез из Firebase
async function loadFrezyTextFromFirebase() {
    console.log('=== ЗАГРУЗКА ФРЕЗ ИЗ FIREBASE ===');
    
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
        
        // Фильтруем только фрезы, исключаем нежелательные товары
        frezyTextData = allProducts.filter(product => {
            const name = (product.name || product.наименование || '').toLowerCase();
            const category = (product.category || product.категория || '').toLowerCase();
            const description = (product.description || product.описание || '').toLowerCase();
            const tags = (product.tags || product.теги || '').toLowerCase();
            
            // Исключаем нежелательные товары
            const isUnwanted = 
                name.includes('medit') ||
                name.includes('shining') ||
                name.includes('ванна') ||
                name.includes('сканер') ||
                name.includes('scanner') ||
                name.includes('3d сканер') ||
                name.includes('3d scanner') ||
                category.includes('сканер') ||
                category.includes('scanner') ||
                tags.includes('сканер') ||
                tags.includes('scanner') ||
                description.includes('сканер') ||
                description.includes('scanner');
            
            if (isUnwanted) {
                console.log(`❌ Исключен нежелательный товар: ${name}`);
                return false;
            }
            
            // Логика фильтрации для фрез (более специфичная чем для станков)
            const isFreza = 
                // Проверяем категорию
                category === 'фрезы' ||
                category === 'фреза' ||
                category === 'burrs' ||
                category === 'burs' ||
                category === 'drill' ||
                category === 'drills' ||
                category === 'инструменты' ||
                category === 'инструмент' ||
                // Проверяем теги
                tags.includes('фреза') ||
                tags.includes('фрезы') ||
                tags.includes('burr') ||
                tags.includes('bur') ||
                tags.includes('drill') ||
                tags.includes('инструмент') ||
                tags.includes('режущий') ||
                tags.includes('стоматологический') ||
                // Проверяем название (исключаем станки)
                (name.includes('фрез') && !name.includes('станок') && !name.includes('машин')) ||
                name.includes('burr') ||
                name.includes('bur ') ||
                name.includes('drill') ||
                name.includes('бор') ||
                name.includes('сверл') ||
                // Проверяем описание
                (description.includes('фрез') && !description.includes('станок')) ||
                description.includes('burr') ||
                description.includes('режущий инструмент') ||
                description.includes('стоматологический инструмент');
            
            if (isFreza) {
                console.log(`✅ Найдена фреза: ${name}`);
                console.log(`   Категория: ${category}`);
                console.log(`   Теги: ${tags}`);
            } else {
                console.log(`❌ Продукт не является фрезой: ${name} (категория: ${category})`);
            }
            
            return isFreza;
        });
        
        console.log(`Найдено ${frezyTextData.length} фрез из ${allProducts.length} общих продуктов`);
        
        if (frezyTextData.length === 0) {
            console.warn('Не найдено ни одной фрезы');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки фрез:', error);
        throw error;
    }
}

// Отображение фрез
function displayFrezyTextProducts() {
    console.log('=== ОТОБРАЖЕНИЕ ФРЕЗ ===');
    
    const container = document.getElementById('frezy-text-products-container');
    if (!container) {
        console.error('Контейнер frezy-text-products-container не найден');
        return;
    }
    
    if (frezyTextData.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <h5>Фрезы пока не добавлены</h5>
                <p class="mb-0">Скоро здесь появится каталог стоматологических фрез</p>
            </div>
        `;
        return;
    }
    
    let productsHTML = '<div class="row">';
    
    frezyTextData.forEach(product => {
        const productCard = createFrezyTextProductCard(product);
        productsHTML += productCard;
    });
    
    productsHTML += '</div>';
    container.innerHTML = productsHTML;
    
    console.log(`Отображено ${frezyTextData.length} фрез`);
}

// Создание карточки фрезы в стиле циркониевых материалов
function createFrezyTextProductCard(product) {
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
        imageHTML = `<img src="${imageUrl}" class="frezy-text-product-image" alt="${name}">`;
    } else {
        imageHTML = `
            <div class="frezy-text-product-placeholder">
                <i class="fas fa-tools"></i>
            </div>
        `;
    }
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="frezy-text-product-card">
                <div class="frezy-text-image-container">
                    ${imageHTML}
                </div>
                <h5 class="frezy-text-product-title">${name}</h5>
                <p class="frezy-text-product-description">${shortDescription}</p>
                <button class="btn btn-outline-primary frezy-text-details-btn" onclick="showFrezyTextProductDetails('${product.id}')">
                    <i class="fas fa-info-circle me-2"></i>Подробнее
                </button>
            </div>
        </div>
    `;
}

// Извлечение характеристик из продукта (поиск во всех возможных полях)
function getProductSpecifications(product) {
    console.log('🔍 Ищем характеристики для продукта:', product.name || product.наименование);
    
    // Список возможных полей с характеристиками
    const specsFields = [
        'specifications', 'характеристики', 'specs', 'Характеристики',
        'characteristics', 'techSpecs', 'technicalSpecs', 
        'parameters', 'параметры', 'features', 'свойства', 'properties'
    ];
    
    // Ищем характеристики в прямых полях
    for (const field of specsFields) {
        if (product[field]) {
            const value = product[field];
            if (typeof value === 'string' && value.trim()) {
                console.log(`✅ Найдены характеристики в поле "${field}"`);
                return value.trim();
            }
            if (typeof value === 'object' && value !== null) {
                console.log(`✅ Найдены характеристики-объект в поле "${field}"`);
                return value;
            }
        }
    }
    
    // Поиск по ключам, содержащим ключевые слова
    const allKeys = Object.keys(product);
    for (const key of allKeys) {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('характ') || keyLower.includes('spec') || 
            keyLower.includes('параметр') || keyLower.includes('свойств')) {
            const value = product[key];
            if (value && (typeof value === 'string' || typeof value === 'object')) {
                console.log(`✅ Найдены характеристики в поле "${key}"`);
                return value;
            }
        }
    }
    
    return 'Характеристики не указаны';
}

// Форматирование характеристик для отображения
function formatSpecifications(specs) {
    if (!specs || specs === 'Характеристики не указаны') {
        return '<p class="text-muted">Характеристики не указаны</p>';
    }
    
    // Если характеристики - это объект
    if (typeof specs === 'object' && !Array.isArray(specs)) {
        const specsList = Object.entries(specs).map(([key, value]) => {
            return `<div class="spec-item"><strong>${key}:</strong> ${value}</div>`;
        }).join('');
        return specsList || '<p class="text-muted">Характеристики не указаны</p>';
    }
    
    // Если это строка
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

// Показать детали фрезы
function showFrezyTextProductDetails(productId) {
    const product = frezyTextData.find(p => p.id === productId);
    if (!product) {
        console.error('Продукт не найден:', productId);
        return;
    }
    
    const name = product.name || product.наименование || 'Без названия';
    const description = product.description || product.описание || 'Описание отсутствует';
    const specifications = getProductSpecifications(product);
    
    // Определяем изображение для модального окна
    let modalImageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        modalImageHTML = `<img src="${imageUrl}" class="frezy-text-modal-image mb-3" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    
    const modalPlaceholderHTML = `
        <div class="frezy-text-modal-image-placeholder mb-3" ${imageUrl ? 'style="display: none;"' : ''}>
            <i class="fas fa-tools"></i>
        </div>
    `;
    
    // Создаем модальное окно
    const modalHTML = `
        <div class="modal fade" id="frezyTextProductModal" tabindex="-1" aria-hidden="true">
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
    const existingModal = document.getElementById('frezyTextProductModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('frezyTextProductModal'));
    modal.show();
}

// Показать ошибку
function showError(message) {
    const container = document.getElementById('frezy-text-products-container');
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализируем страницу фрез');
    
    // Небольшая задержка для загрузки Firebase
    setTimeout(() => {
        initializeFrezyText();
    }, 1000);
});
