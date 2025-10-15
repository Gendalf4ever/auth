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
        
        // Фильтруем только 3D принтеры, исключаем камеры полимеризации, ультразвуковые ванны и прочее оборудование
        printersData = allProducts.filter(product => {
            const name = (product.name || product.наименование || '').toLowerCase();
            const category = (product.category || product.категория || '').toLowerCase();
            const description = (product.description || product.описание || '').toLowerCase();
            const tags = (product.tags || product.теги || '').toLowerCase();
            
            // Исключаем камеры полимеризации, ультразвуковые ванны, материалы, запчасти и прочее оборудование
            const isExcluded = 
                // Камеры полимеризации
                name.includes('камера') ||
                name.includes('полимериз') ||
                name.includes('cure') ||
                name.includes('curing') ||
                category.includes('камера') ||
                category.includes('полимериз') ||
                category.includes('cure') ||
                category.includes('curing') ||
                tags.includes('камера') ||
                tags.includes('полимериз') ||
                tags.includes('cure') ||
                tags.includes('curing') ||
                // Ультразвуковые ванны
                name.includes('ультразвук') ||
                name.includes('ванна') ||
                name.includes('ultrasonic') ||
                name.includes('wash') ||
                name.includes('cleaning') ||
                category.includes('ультразвук') ||
                category.includes('ванна') ||
                category.includes('ultrasonic') ||
                tags.includes('ультразвук') ||
                tags.includes('ванна') ||
                tags.includes('ultrasonic') ||
                // Прочее оборудование
                name.includes('печь') ||
                name.includes('sinter') ||
                name.includes('furnace') ||
                name.includes('oven') ||
                category.includes('печь') ||
                category.includes('sinter') ||
                category.includes('furnace') ||
                tags.includes('печь') ||
                tags.includes('sinter') ||
                tags.includes('furnace') ||
                // Материалы для печати (фотополимеры, смолы)
                name.includes('фотополимер') ||
                name.includes('photopolymer') ||
                name.includes('смола') ||
                name.includes('resin') ||
                name.includes('полимер') ||
                category.includes('фотополимер') ||
                category.includes('photopolymer') ||
                category.includes('смола') ||
                category.includes('resin') ||
                category.includes('материал') ||
                category.includes('material') ||
                tags.includes('фотополимер') ||
                tags.includes('photopolymer') ||
                tags.includes('смола') ||
                tags.includes('resin') ||
                tags.includes('материал') ||
                tags.includes('material') ||
                // Запчасти и расходники
                name.includes('lcd матрица') ||
                name.includes('lcd') ||
                name.includes('матрица') ||
                name.includes('экран') ||
                name.includes('screen') ||
                name.includes('пленк') ||
                name.includes('film') ||
                name.includes('fep') ||
                name.includes('nfep') ||
                name.includes('acf') ||
                name.includes('комплект') ||
                category.includes('запчасти') ||
                category.includes('расходник') ||
                category.includes('spare') ||
                category.includes('parts') ||
                category.includes('consumable') ||
                tags.includes('запчасти') ||
                tags.includes('расходник') ||
                tags.includes('spare') ||
                tags.includes('parts') ||
                tags.includes('lcd') ||
                tags.includes('fep') ||
                tags.includes('пленка') ||
                description.includes('lcd матрица') ||
                description.includes('пленка для');
            
            if (isExcluded) {
                console.log(`❌ Исключено оборудование: ${name} (не принтер)`);
                return false;
            }
            
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
                name.includes('принтер') && !name.includes('камера') ||
                name.includes('3d printer') ||
                name.includes('printer') && !name.includes('cure') ||
                name.includes('форм') ||  // Form labs
                name.includes('formlabs') ||
                name.includes('nextdent') ||
                name.includes('asiga') ||
                // Проверяем описание
                description.includes('3d принтер') ||
                description.includes('3d печать') ||
                description.includes('стереолитография');
            
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

// Создание карточки 3D принтера (в стиле циркониевых материалов)
function createPrinterProductCard(product) {
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
        imageHTML = `<img src="${imageUrl}" class="printer-product-image" alt="${name}">`;
    } else {
        imageHTML = `
            <div class="printer-product-placeholder">
                <i class="fas fa-print"></i>
            </div>
        `;
    }
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="printer-product-card">
                <div class="printer-image-container">
                    ${imageHTML}
                </div>
                <h5 class="printer-product-title">${name}</h5>
                <p class="printer-product-description">${shortDescription}</p>
                ${shortSpecs && shortSpecs !== 'Характеристики не указаны' ? `
                    <div class="specs-preview small mb-3">
                        <strong>Характеристики:</strong>
                        <p class="mb-0">${shortSpecs}</p>
                    </div>
                ` : ''}
                <button class="btn btn-outline-primary printer-details-btn" onclick="showPrinterProductDetails('${product.id}')">
                    <i class="fas fa-info-circle me-2"></i>Подробнее
                </button>
            </div>
        </div>
    `;
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
    const specifications = product.specifications || product.характеристики || 'Характеристики не указаны';
    
    // Определяем изображение для модального окна
    let modalImageHTML = '';
    const imageUrl = product.img_url || product.image_url || product.изображение || product.картинка;
    
    if (imageUrl) {
        modalImageHTML = `<img src="${imageUrl}" class="printer-modal-image mb-3" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    
    const modalPlaceholderHTML = `
        <div class="printer-modal-image-placeholder mb-3" ${imageUrl ? 'style="display: none;"' : ''}>
            <i class="fas fa-print"></i>
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
