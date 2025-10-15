// Скрипт для загрузки 3D принтеров из Firebase

let printersData = [];
let productsDb = null;

// Инициализация и загрузка данных
async function initializePrinters() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ 3D ПРИНТЕРОВ ===');
    
    try {
        // Получаем Firestore для товаров
        productsDb = window.getProductsFirestore();
        console.log('Firestore для товаров получен');
        
        await loadPrintersFromFirebase();
        displayPrintersProducts();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Не удалось загрузить данные о 3D принтерах');
    }
}

// Загрузка 3D принтеров из Firebase
async function loadPrintersFromFirebase() {
    console.log('=== ЗАГРУЗКА 3D ПРИНТЕРОВ ИЗ FIREBASE ===');
    
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
        
        // Фильтруем только 3D принтеры
        printersData = allProducts.filter(product => {
            const name = (product.name || product.наименование || '').toLowerCase();
            const category = (product.category || product.категория || '').toLowerCase();
            const description = (product.description || product.описание || '').toLowerCase();
            const tags = (product.tags || product.теги || '').toLowerCase();
            
            // Логика фильтрации для 3D принтеров
            const isPrinter = 
                // Проверяем категорию
                category === '3d принтеры' ||
                category === '3d принтер' ||
                category === '3d-принтеры' ||
                category === '3d-принтер' ||
                category === 'принтеры' ||
                category === 'принтер' ||
                category === '3d printers' ||
                category === '3d printer' ||
                category === 'printers' ||
                category === 'printer' ||
                // Проверяем теги
                tags.includes('3d принтер') ||
                tags.includes('3d-принтер') ||
                tags.includes('принтер') ||
                tags.includes('3d printer') ||
                tags.includes('printer') ||
                tags.includes('3d печать') ||
                tags.includes('3d printing') ||
                tags.includes('стереолитография') ||
                tags.includes('sla') ||
                tags.includes('dlp') ||
                tags.includes('polyjet') ||
                // Проверяем название
                name.includes('3d принтер') ||
                name.includes('3d-принтер') ||
                name.includes('принтер') ||
                name.includes('3d printer') ||
                name.includes('printer') ||
                name.includes('форм') ||  // Form labs
                name.includes('formlabs') ||
                name.includes('nextdent') ||
                name.includes('asiga') ||
                name.includes('dental') ||
                // Проверяем описание
                description.includes('3d принтер') ||
                description.includes('3d печать') ||
                description.includes('принтер') ||
                description.includes('стереолитография') ||
                description.includes('фотополимер');
            
            if (isPrinter) {
                console.log(`✅ Найден 3D принтер: ${name}`);
                console.log(`   Категория: ${category}`);
                console.log(`   Теги: ${tags}`);
            } else {
                console.log(`❌ Продукт не является 3D принтером: ${name} (категория: ${category})`);
            }
            
            return isPrinter;
        });
        
        console.log(`Найдено ${printersData.length} 3D принтеров из ${allProducts.length} общих продуктов`);
        
        if (printersData.length === 0) {
            console.warn('Не найдено ни одного 3D принтера');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки 3D принтеров:', error);
        throw error;
    }
}

// Отображение 3D принтеров
function displayPrintersProducts() {
    console.log('=== ОТОБРАЖЕНИЕ 3D ПРИНТЕРОВ ===');
    
    const container = document.getElementById('3d-printers-products-container');
    if (!container) {
        console.error('Контейнер 3d-printers-products-container не найден');
        return;
    }
    
    if (printersData.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <h5>3D принтеры пока не добавлены</h5>
                <p class="mb-0">Скоро здесь появится каталог 3D принтеров для стоматологии</p>
            </div>
        `;
        return;
    }
    
    let productsHTML = '<div class="row">';
    
    printersData.forEach(product => {
        const productCard = createPrinterProductCard(product);
        productsHTML += productCard;
    });
    
    productsHTML += '</div>';
    container.innerHTML = productsHTML;
    
    console.log(`Отображено ${printersData.length} 3D принтеров`);
}

// Создание карточки 3D принтера
function createPrinterProductCard(product) {
    const name = product.name || product.наименование || 'Без названия';
    const description = product.description || product.описание || 'Описание отсутствует';
    const specifications = product.specifications || product.характеристики || '';
    const price = product.price || product.цена || '';
    
    // Определяем изображение
    let imageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        imageHTML = `<img src="${imageUrl}" class="printer-image" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    
    const placeholderHTML = `
        <div class="printer-image-placeholder" ${imageUrl ? 'style="display: none;"' : ''}>
            <i class="fas fa-cube"></i>
        </div>
    `;
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card printer-card h-100 shadow-sm">
                <div class="card-body d-flex flex-column">
                    <div class="text-center mb-3">
                        ${imageHTML}
                        ${placeholderHTML}
                    </div>
                    <h5 class="card-title text-center">${name}</h5>
                    <p class="card-text flex-grow-1">${description}</p>
                    ${specifications ? `
                        <div class="specs-preview mb-3">
                            <small class="text-muted">
                                <i class="fas fa-list me-1"></i>
                                ${specifications.substring(0, 100)}${specifications.length > 100 ? '...' : ''}
                            </small>
                        </div>
                    ` : ''}
                    ${price ? `
                        <div class="price-info mb-3 text-center">
                            <span class="badge bg-success fs-6">
                                <i class="fas fa-tag me-1"></i>${price}
                            </span>
                        </div>
                    ` : ''}
                    <div class="mt-auto">
                        <button class="btn btn-primary w-100" onclick="showPrinterProductDetails('${product.id}')">
                            <i class="fas fa-info-circle me-2"></i>Подробнее
                        </button>
                    </div>
                </div>
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

// Показать детали 3D принтера
function showPrinterProductDetails(productId) {
    const product = printersData.find(p => p.id === productId);
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
        modalImageHTML = `<img src="${imageUrl}" class="printer-modal-image mb-3" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    
    const modalPlaceholderHTML = `
        <div class="printer-modal-image-placeholder mb-3" ${imageUrl ? 'style="display: none;"' : ''}>
            <i class="fas fa-cube"></i>
        </div>
    `;
    
    // Создаем модальное окно
    const modalHTML = `
        <div class="modal fade" id="printerProductModal" tabindex="-1" aria-hidden="true">
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
    const existingModal = document.getElementById('printerProductModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('printerProductModal'));
    modal.show();
}

// Показать ошибку
function showError(message) {
    const container = document.getElementById('3d-printers-products-container');
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
    console.log('DOM загружен, инициализируем страницу 3D принтеров');
    
    // Небольшая задержка для загрузки Firebase
    setTimeout(() => {
        initializePrinters();
    }, 1000);
});
