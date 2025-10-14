// Скрипт для загрузки циркониевых материалов из Firebase

let zirkonData = [];
let productsDb = null;

// Инициализация и загрузка данных
async function initializeZirkon() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ЦИРКОНИЯ ===');
    
    try {
        // Получаем Firestore для товаров
        productsDb = window.getProductsFirestore();
        console.log('Firestore для товаров получен');
        
        await loadZirkonFromFirebase();
        displayZirkonProducts();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Не удалось загрузить данные о цирконии');
    }
}

// Загрузка циркониевых материалов из Firebase
async function loadZirkonFromFirebase() {
    console.log('=== ЗАГРУЗКА ЦИРКОНИЯ ИЗ FIREBASE ===');
    
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
        
        // Фильтруем только циркониевые материалы
        zirkonData = allProducts.filter(product => {
            const name = (product.name || product.наименование || '').toLowerCase();
            const category = (product.category || product.категория || '').toLowerCase();
            const description = (product.description || product.описание || '').toLowerCase();
            const tags = (product.tags || product.теги || '').toLowerCase();
            
            // Используем ту же логику, что и в educational-catalog.js
            const isZirkon = 
                // Проверяем категорию
                category === 'цирконий' ||
                category === 'zircon' ||
                category === 'zirconia' ||
                category === 'zirconium' ||
                category === 'циркон' ||
                category === 'zro2' ||
                category === 'зро2' ||
                // Проверяем теги
                tags.includes('цирконий') ||
                tags.includes('zircon') ||
                tags.includes('zirconia') ||
                tags.includes('zirconium') ||
                tags.includes('циркон') ||
                tags.includes('zro2') ||
                tags.includes('зро2') ||
                // Проверяем название (строго по ключевым словам)
                name.includes('zircon') ||
                name.includes('циркон') ||
                name.includes('zro2') ||
                name.includes('зро2') ||
                name.includes('цирконий') ||
                name.includes('zirconia') ||
                name.includes('zirconium');
            
            return isZirkon;
        });
        
        console.log(`Найдено циркониевых материалов: ${zirkonData.length}`);
        
        // Логируем найденные товары с подробностями
        zirkonData.forEach(product => {
            const name = product.name || product.наименование || 'Без названия';
            const category = product.category || product.категория || 'Без категории';
            const tags = product.tags || product.теги || 'Без тегов';
            console.log(`- ${name} | Категория: ${category} | Теги: ${tags}`);
        });
        
        // Логируем все товары для отладки (первые 10)
        console.log('=== ПЕРВЫЕ 10 ТОВАРОВ ИЗ БАЗЫ (для отладки) ===');
        allProducts.slice(0, 10).forEach(product => {
            const name = product.name || product.наименование || 'Без названия';
            const category = product.category || product.категория || 'Без категории';
            const tags = product.tags || product.теги || 'Без тегов';
            
            // Проверяем, прошел ли товар фильтр
            const nameLower = name.toLowerCase();
            const categoryLower = category.toLowerCase();
            const tagsLower = tags.toLowerCase();
            
            const passesFilter = 
                categoryLower === 'цирконий' ||
                categoryLower === 'zircon' ||
                categoryLower === 'zirconia' ||
                categoryLower === 'zirconium' ||
                categoryLower === 'циркон' ||
                categoryLower === 'zro2' ||
                categoryLower === 'зро2' ||
                tagsLower.includes('цирконий') ||
                tagsLower.includes('zircon') ||
                tagsLower.includes('zirconia') ||
                tagsLower.includes('zirconium') ||
                tagsLower.includes('циркон') ||
                tagsLower.includes('zro2') ||
                tagsLower.includes('зро2') ||
                nameLower.includes('zircon') ||
                nameLower.includes('циркон') ||
                nameLower.includes('zro2') ||
                nameLower.includes('зро2') ||
                nameLower.includes('цирконий') ||
                nameLower.includes('zirconia') ||
                nameLower.includes('zirconium');
            
            console.log(`${passesFilter ? '✅' : '❌'} ${name} | Категория: ${category} | Теги: ${tags}`);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки из Firebase:', error);
        throw error;
    }
}

// Отображение товаров на странице
function displayZirkonProducts() {
    const container = document.getElementById('zirkon-products-container');
    
    if (!container) {
        console.warn('Контейнер для товаров не найден');
        return;
    }
    
    if (zirkonData.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-info-circle me-2"></i>
                Циркониевые материалы не найдены в базе данных.
            </div>
        `;
        return;
    }
    
    let productsHTML = '<div class="row g-4">';
    
    zirkonData.forEach(product => {
        const name = product.name || product.наименование || 'Без названия';
        const description = product.description || product.описание || 'Описание отсутствует';
        const specs = product.specifications || product.характеристики || 'Характеристики не указаны';
        const imageUrl = product.img_url || product.image || product.изображение || '';
        const price = product.price || product.цена || '';
        const discountPrice = product.price_skidka || product['аукционная цена'] || '';
        
        productsHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 product-card">
                    ${imageUrl ? `
                        <img src="${imageUrl}" class="card-img-top product-image" alt="${name}" loading="lazy" onerror="this.style.display='none'">
                    ` : `
                        <div class="card-img-top product-image-placeholder">
                            <i class="fas fa-tooth"></i>
                        </div>
                    `}
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${name}</h5>
                        <p class="card-text small text-muted">${truncateText(description, 100)}</p>
                        ${specs && specs !== 'Характеристики не указаны' ? `
                            <div class="specs-preview small mb-3">
                                <strong>Характеристики:</strong>
                                <p class="mb-0">${truncateText(specs, 80)}</p>
                            </div>
                        ` : ''}
                        <div class="mt-auto">
                            <button class="btn btn-outline-primary btn-sm w-100" onclick="showProductDetails('${product.id}')">
                                <i class="fas fa-info-circle me-2"></i>Подробнее
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    productsHTML += '</div>';
    container.innerHTML = productsHTML;
}

// Показать детали товара в модальном окне
function showProductDetails(productId) {
    const product = zirkonData.find(p => p.id === productId);
    
    if (!product) {
        console.error('Товар не найден:', productId);
        return;
    }
    
    const name = product.name || product.наименование || 'Без названия';
    const description = product.description || product.описание || 'Описание отсутствует';
    const specs = product.specifications || product.характеристики || 'Характеристики не указаны';
    const imageUrl = product.img_url || product.image || product.изображение || '';
    const price = product.price || product.цена || '';
    const discountPrice = product.price_skidka || product['аукционная цена'] || '';
    
    const modalHTML = `
        <div class="modal fade" id="productModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-5">
                                ${imageUrl ? `
                                    <img src="${imageUrl}" class="img-fluid rounded product-modal-image" alt="${name}" onerror="this.style.display='none'">
                                ` : `
                                    <div class="product-modal-image-placeholder">
                                        <i class="fas fa-tooth"></i>
                                    </div>
                                `}
                            </div>
                            <div class="col-md-7">
                                <h6 class="text-muted">Описание</h6>
                                <p>${description}</p>
                                
                                ${specs && specs !== 'Характеристики не указаны' ? `
                                    <h6 class="text-muted mt-3">Характеристики</h6>
                                    <div class="specs-detail">
                                        ${formatSpecifications(specs)}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Удаляем предыдущее модальное окно, если есть
    const existingModal = document.getElementById('productModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
    
    // Удаляем модальное окно после закрытия
    document.getElementById('productModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Вспомогательная функция для обрезки текста
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Форматирование характеристик
function formatSpecifications(specs) {
    if (!specs) return '';
    
    // Если характеристики - строка с переносами строк
    if (specs.includes('\n')) {
        return specs.split('\n')
            .filter(line => line.trim())
            .map(line => `<div class="spec-item"><i class="fas fa-check-circle text-success me-2"></i>${line.trim()}</div>`)
            .join('');
    }
    
    // Если характеристики - строка с точками с запятой
    if (specs.includes(';')) {
        return specs.split(';')
            .filter(line => line.trim())
            .map(line => `<div class="spec-item"><i class="fas fa-check-circle text-success me-2"></i>${line.trim()}</div>`)
            .join('');
    }
    
    // Если характеристики - строка с запятыми
    if (specs.includes(',')) {
        return specs.split(',')
            .filter(line => line.trim())
            .map(line => `<div class="spec-item"><i class="fas fa-check-circle text-success me-2"></i>${line.trim()}</div>`)
            .join('');
    }
    
    // Иначе возвращаем как есть
    return `<div class="spec-item">${specs}</div>`;
}

// Показать ошибку
function showError(message) {
    const container = document.getElementById('zirkon-products-container');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Небольшая задержка, чтобы Firebase успел инициализироваться
    setTimeout(() => {
        initializeZirkon();
    }, 500);
});

