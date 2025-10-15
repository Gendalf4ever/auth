// Скрипт для загрузки дисков PMMA и WAX Upcera из Firebase

let rmmaData = [];
let productsDb = null;

// Инициализация и загрузка данных
async function initializeRmma() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ PMMA ===');
    
    try {
        // Получаем Firestore для товаров
        productsDb = window.getProductsFirestore();
        console.log('Firestore для товаров получен');
        
        await loadRmmaFromFirebase();
        displayRmmaProducts();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Не удалось загрузить данные о дисках PMMA');
    }
}

// Загрузка дисков PMMA и WAX из Firebase
async function loadRmmaFromFirebase() {
    console.log('=== ЗАГРУЗКА ДИСКОВ PMMA И WAX ИЗ FIREBASE ===');
    
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
        
        // Фильтруем только диски PMMA и WAX Upcera (исключаем циркониевые)
        rmmaData = allProducts.filter(product => {
            const name = (product.name || product.наименование || '').toLowerCase();
            const category = (product.category || product.категория || '').toLowerCase();
            const description = (product.description || product.описание || '').toLowerCase();
            const tags = (product.tags || product.теги || '').toLowerCase();
            const brand = (product.brand || product.бренд || '').toLowerCase();
            
            // Исключаем циркониевые диски
            const isZircon = 
                name.includes('цирконий') || name.includes('zircon') || name.includes('zro2') ||
                category.includes('цирконий') || category.includes('zircon') ||
                tags.includes('цирконий') || tags.includes('zircon') ||
                description.includes('цирконий') || description.includes('zircon');
            
            if (isZircon) {
                console.log(`❌ Исключен циркониевый диск: ${name}`);
                return false;
            }
            
            // Логика фильтрации для дисков PMMA и WAX Upcera
            const isRmmaDisk = 
                // Проверяем бренд Upcera
                (brand.includes('upcera') || name.includes('upcera')) &&
                (
                    // Проверяем на PMMA
                    name.includes('pmma') || name.includes('пмма') || name.includes('rmma') || name.includes('рмма') ||
                    category.includes('pmma') || category.includes('пмма') || category.includes('rmma') || category.includes('рмма') ||
                    tags.includes('pmma') || tags.includes('пмма') || tags.includes('rmma') || tags.includes('рмма') ||
                    // Проверяем на WAX
                    name.includes('wax') || name.includes('воск') ||
                    category.includes('wax') || category.includes('воск') ||
                    tags.includes('wax') || tags.includes('воск') ||
                    // Проверяем описание
                    description.includes('pmma') || description.includes('пмма') ||
                    description.includes('wax') || description.includes('воск') ||
                    description.includes('временн')
                );
            
            if (isRmmaDisk) {
                console.log(`✅ Найден диск PMMA/WAX Upcera: ${name}`);
                console.log(`   Категория: ${category}`);
                console.log(`   Бренд: ${brand}`);
                console.log(`   Теги: ${tags}`);
            } else {
                console.log(`❌ Продукт не является диском PMMA/WAX Upcera: ${name} (категория: ${category}, бренд: ${brand})`);
            }
            
            return isRmmaDisk;
        });
        
        console.log(`Найдено ${rmmaData.length} дисков PMMA/WAX Upcera из ${allProducts.length} общих продуктов`);
        
        if (rmmaData.length === 0) {
            console.warn('Не найдено ни одного диска PMMA/WAX Upcera');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки дисков PMMA:', error);
        throw error;
    }
}

// Отображение дисков PMMA
function displayRmmaProducts() {
    console.log('=== ОТОБРАЖЕНИЕ ДИСКОВ PMMA ===');
    
    const container = document.getElementById('rmma-products-container');
    if (!container) {
        console.error('Контейнер rmma-products-container не найден');
        return;
    }
    
    if (rmmaData.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <h5>Диски PMMA пока не добавлены</h5>
                <p class="mb-0">Скоро здесь появятся диски PMMA и WAX от Upcera</p>
            </div>
        `;
        return;
    }
    
    let productsHTML = '<div class="row">';
    
    rmmaData.forEach(product => {
        const productCard = createRmmaProductCard(product);
        productsHTML += productCard;
    });
    
    productsHTML += '</div>';
    container.innerHTML = productsHTML;
    
    console.log(`Отображено ${rmmaData.length} дисков PMMA/WAX`);
}

// Создание карточки диска PMMA
function createRmmaProductCard(product) {
    const name = product.name || product.наименование || 'Без названия';
    const fullDescription = product.description || product.описание || 'Описание отсутствует';
    
    // Сокращаем описание до первых 50 символов + "..."
    const shortDescription = fullDescription.length > 50 
        ? fullDescription.substring(0, 50) + '...' 
        : fullDescription;
    
    // Определяем тип диска
    const isWax = name.toLowerCase().includes('wax') || name.toLowerCase().includes('воск');
    const typeLabel = isWax ? 'WAX' : 'PMMA';
    const badgeClass = isWax ? 'bg-info' : 'bg-primary';
    
    // Определяем изображение
    let imageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        imageHTML = `<img src="${imageUrl}" class="rmma-product-image" alt="${name}">`;
    } else {
        imageHTML = `
            <div class="rmma-product-placeholder">
                <i class="fas fa-shapes"></i>
            </div>
        `;
    }
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="rmma-product-card">
                <div class="rmma-image-container">
                    ${imageHTML}
                </div>
                <div class="rmma-badges">
                    <span class="badge ${badgeClass}">${typeLabel}</span>
                    <span class="badge bg-secondary">Upcera</span>
                </div>
                <h5 class="rmma-product-title">${name}</h5>
                <p class="rmma-product-description">${shortDescription}</p>
                <button class="btn btn-outline-primary rmma-details-btn" onclick="showRmmaProductDetails('${product.id}')">
                    <i class="fas fa-info-circle me-2"></i>Подробнее
                </button>
            </div>
        </div>
    `;
}

// Показать детали диска PMMA
function showRmmaProductDetails(productId) {
    const product = rmmaData.find(p => p.id === productId);
    if (!product) {
        console.error('Продукт не найден:', productId);
        return;
    }
    
    const name = product.name || product.наименование || 'Без названия';
    const description = product.description || product.описание || 'Описание отсутствует';
    const specifications = product.specifications || product.характеристики || 'Характеристики не указаны';
    const price = product.price || product.цена || '';
    
    // Определяем тип диска
    const isWax = name.toLowerCase().includes('wax') || name.toLowerCase().includes('воск');
    const iconClass = isWax ? 'fas fa-circle' : 'fas fa-shapes';
    const typeLabel = isWax ? 'WAX' : 'PMMA';
    
    // Определяем изображение для модального окна
    let modalImageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        modalImageHTML = `<img src="${imageUrl}" class="rmma-modal-image mb-3" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    
    const modalPlaceholderHTML = `
        <div class="rmma-modal-image-placeholder mb-3" ${imageUrl ? 'style="display: none;"' : ''}>
            <i class="${iconClass}"></i>
        </div>
    `;
    
    // Создаем модальное окно
    const modalHTML = `
        <div class="modal fade" id="rmmaProductModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            ${name}
                            <span class="badge bg-info ms-2">${typeLabel}</span>
                            <span class="badge bg-secondary ms-1">Upcera</span>
                        </h5>
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
    const existingModal = document.getElementById('rmmaProductModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('rmmaProductModal'));
    modal.show();
}

// Показать ошибку
function showError(message) {
    const container = document.getElementById('rmma-products-container');
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
    console.log('DOM загружен, инициализируем страницу PMMA');
    
    // Небольшая задержка для загрузки Firebase
    setTimeout(() => {
        initializeRmma();
    }, 1000);
});
