// Скрипт для загрузки фрезерных станков и оборудования из Firebase

let frezyData = [];
let productsDb = null;

// Инициализация и загрузка данных
async function initializeFrezy() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ФРЕЗЕРНЫХ СТАНКОВ ===');
    
    try {
        // Получаем Firestore для товаров
        productsDb = window.getProductsFirestore();
        console.log('Firestore для товаров получен');
        
        await loadFrezyFromFirebase();
        displayFrezyProducts();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Не удалось загрузить данные о фрезерных станках');
    }
}

// Загрузка фрезерных станков из Firebase
async function loadFrezyFromFirebase() {
    console.log('=== ЗАГРУЗКА ФРЕЗЕРНЫХ СТАНКОВ ИЗ FIREBASE ===');
    
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
        
        // Фильтруем только фрезерные станки и оборудование, исключаем фрезы (инструменты)
        frezyData = allProducts.filter(product => {
            const name = (product.name || product.наименование || '').toLowerCase();
            const category = (product.category || product.категория || '').toLowerCase();
            const description = (product.description || product.описание || '').toLowerCase();
            const tags = (product.tags || product.теги || '').toLowerCase();
            
            // Исключаем фрезы (инструменты) - режущий инструмент
            const isMillingTool = 
                // Исключаем категории инструментов
                category === 'фрезы' ||
                category === 'фреза' ||
                category === 'burrs' ||
                category === 'burs' ||
                category === 'drill' ||
                category === 'drills' ||
                category === 'инструменты' ||
                category === 'инструмент' ||
                category === 'tools' ||
                category === 'tool' ||
                // Исключаем теги инструментов
                tags.includes('фреза') ||
                tags.includes('фрезы') ||
                tags.includes('burr') ||
                tags.includes('bur') ||
                tags.includes('drill') ||
                tags.includes('инструмент') ||
                tags.includes('режущий') ||
                tags.includes('tool') ||
                tags.includes('cutting') ||
                // Исключаем названия инструментов (но не станков)
                name.startsWith('фреза ') ||
                name.startsWith('фрез ') ||
                (name.includes('фреза') && !name.includes('станок') && !name.includes('машин') && !name.includes('фрезерн')) ||
                (name.includes('фрез') && !name.includes('станок') && !name.includes('машин') && !name.includes('фрезерн') && !name.includes('mill')) ||
                name.includes('burr') ||
                name.includes('bur ') ||
                name.includes('drill') && !name.includes('станок') ||
                name.includes('бор') ||
                name.includes('сверл') && !name.includes('станок') ||
                name.includes('x-mill') ||
                name.includes('xtcera') ||
                // Исключаем описания инструментов
                (description.includes('фреза') && !description.includes('станок') && !description.includes('машин')) ||
                (description.includes('фрез') && !description.includes('станок') && !description.includes('машин') && !description.includes('фрезерн')) ||
                description.includes('burr') ||
                description.includes('режущий инструмент') ||
                description.includes('стоматологический инструмент') ||
                description.includes('cutting tool');
            
            if (isMillingTool) {
                console.log(`❌ Исключен инструмент: ${name} (фреза/бор)`);
                return false;
            }
            
            // Логика фильтрации для фрезерных станков и оборудования
            const isMillingMachine = 
                // Проверяем категорию
                category === 'фрезерные станки' ||
                category === 'фрезерный станок' ||
                category === 'milling' ||
                category === 'фрезеровка' ||
                category === 'станки' ||
                category === 'оборудование' ||
                category === 'машины' ||
                // Проверяем теги
                tags.includes('фрезерный') ||
                tags.includes('milling') ||
                tags.includes('станок') ||
                tags.includes('фрезеровка') ||
                tags.includes('cadcam') ||
                tags.includes('cad/cam') ||
                tags.includes('машина') ||
                tags.includes('оборудование') ||
                // Проверяем название
                name.includes('фрезерн') ||
                name.includes('milling') && name.includes('machine') ||
                name.includes('станок') ||
                name.includes('mill') && !name.includes('ing tool') ||
                name.includes('cnc') ||
                name.includes('cadcam') ||
                name.includes('cad/cam') ||
                name.includes('машин') ||
                // Проверяем описание
                description.includes('фрезерн') ||
                description.includes('milling') && description.includes('machine') ||
                description.includes('станок') ||
                description.includes('машин');
            
            if (isMillingMachine) {
                console.log(`✅ Найден фрезерный станок: ${name}`);
                console.log(`   Категория: ${category}`);
                console.log(`   Теги: ${tags}`);
            } else {
                console.log(`❌ Продукт не является фрезерным станком: ${name} (категория: ${category})`);
            }
            
            return isMillingMachine;
        });
        
        console.log(`Найдено ${frezyData.length} фрезерных продуктов из ${allProducts.length} общих`);
        
        if (frezyData.length === 0) {
            console.warn('Не найдено ни одного фрезерного продукта');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки фрезерных станков:', error);
        throw error;
    }
}

// Отображение фрезерных станков
function displayFrezyProducts() {
    console.log('=== ОТОБРАЖЕНИЕ ФРЕЗЕРНЫХ СТАНКОВ ===');
    
    const container = document.getElementById('frezy-products-container');
    if (!container) {
        console.error('Контейнер frezy-products-container не найден');
        return;
    }
    
    if (frezyData.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <h5>Фрезерные станки пока не добавлены</h5>
                <p class="mb-0">Скоро здесь появится информация о фрезерных станках и оборудовании</p>
            </div>
        `;
        return;
    }
    
    let productsHTML = '<div class="row">';
    
    frezyData.forEach(product => {
        const productCard = createFrezyProductCard(product);
        productsHTML += productCard;
    });
    
    productsHTML += '</div>';
    container.innerHTML = productsHTML;
    
    console.log(`Отображено ${frezyData.length} фрезерных станков`);
}

// Создание карточки фрезерного станка (в стиле циркониевых материалов)
function createFrezyProductCard(product) {
    const name = product.name || product.наименование || 'Без названия';
    const fullDescription = product.description || product.описание || 'Описание отсутствует';
    const specifications = product.specifications || product.характеристики || '';
    
    // Сокращаем описание до первых 50 символов + "..."
    const shortDescription = fullDescription.length > 50 
        ? fullDescription.substring(0, 50) + '...' 
        : fullDescription;
    
    // Сокращаем характеристики до первых 80 символов + "..."
    const shortSpecs = specifications && specifications.length > 80 
        ? specifications.substring(0, 80) + '...' 
        : specifications;
    
    // Определяем изображение
    let imageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        imageHTML = `<img src="${imageUrl}" class="frezy-product-image" alt="${name}">`;
    } else {
        imageHTML = `
            <div class="frezy-product-placeholder">
                <i class="fas fa-cogs"></i>
            </div>
        `;
    }
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="frezy-product-card">
                <div class="frezy-image-container">
                    ${imageHTML}
                </div>
                <h5 class="frezy-product-title">${name}</h5>
                <p class="frezy-product-description">${shortDescription}</p>
                ${shortSpecs && shortSpecs !== 'Характеристики не указаны' ? `
                    <div class="specs-preview small mb-3">
                        <strong>Характеристики:</strong>
                        <p class="mb-0">${shortSpecs}</p>
                    </div>
                ` : ''}
                <button class="btn btn-outline-primary frezy-details-btn" onclick="showFrezyProductDetails('${product.id}')">
                    <i class="fas fa-info-circle me-2"></i>Подробнее
                </button>
            </div>
        </div>
    `;
}

// Показать детали фрезерного станка
function showFrezyProductDetails(productId) {
    const product = frezyData.find(p => p.id === productId);
    if (!product) {
        console.error('Продукт не найден:', productId);
        return;
    }
    
    const name = product.name || product.наименование || 'Без названия';
    const description = product.description || product.описание || 'Описание отсутствует';
    const specifications = product.specifications || product.характеристики || 'Характеристики не указаны';
    
    // Определяем изображение для модального окна
    let modalImageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        modalImageHTML = `<img src="${imageUrl}" class="frezy-modal-image mb-3" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    
    const modalPlaceholderHTML = `
        <div class="frezy-modal-image-placeholder mb-3" ${imageUrl ? 'style="display: none;"' : ''}>
            <i class="fas fa-cogs"></i>
        </div>
    `;
    
    // Создаем модальное окно
    const modalHTML = `
        <div class="modal fade" id="frezyProductModal" tabindex="-1" aria-hidden="true">
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
                            <p>${specifications}</p>
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
    const existingModal = document.getElementById('frezyProductModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('frezyProductModal'));
    modal.show();
}

// Показать ошибку
function showError(message) {
    const container = document.getElementById('frezy-products-container');
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
    console.log('DOM загружен, инициализируем страницу фрезерных станков');
    
    // Небольшая задержка для загрузки Firebase
    setTimeout(() => {
        initializeFrezy();
    }, 1000);
});
