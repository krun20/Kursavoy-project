// Глобальные переменные 
let allProducts = [];
let filteredProducts = [];
// все активные фильтры
let currentFilters = {
  category: 'all',
  sizes: [],
  seasons: [],
  brands: [],
  priceMin: 0,
  priceMax: Infinity
};
let sortMode = 'popular';

//  DOM элементы 
const catalogProductsContainer = document.getElementById('catalogProducts');
const productCountHeader = document.getElementById('productCountHeader');
const productCountShown = document.getElementById('productCountShown');
const resetFiltersBtn = document.getElementById('resetFilters');
const categorySelect = document.getElementById('categorySelect');
const sizeFiltersContainer = document.getElementById('sizeFilters');
const brandFiltersContainer = document.getElementById('brandFilters');
const priceMinInput = document.getElementById('priceMin');
const priceMaxInput = document.getElementById('priceMax');
const priceGroupTitle = document.getElementById('priceGroupTitle');
const catalogSort = document.getElementById('catalogSort');

//  Загрузка товаров из XML
async function loadProducts() {
  try {
    const response = await fetch('data/products.xml');
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const products = xmlDoc.getElementsByTagName('product');
    allProducts = Array.from(products).map(product => ({
      id: product.getElementsByTagName('id')[0].textContent,
      name: product.getElementsByTagName('name')[0].textContent,
      category: product.getElementsByTagName('category')[0].textContent,
      season: product.getElementsByTagName('season')[0].textContent,
      brand: product.getElementsByTagName('brand')[0].textContent,
      size: product.getElementsByTagName('size')[0].textContent,
      price: parseFloat(product.getElementsByTagName('price')[0].textContent),
      rating: parseInt(product.getElementsByTagName('rating')[0].textContent),
      reviews: parseInt(product.getElementsByTagName('reviews')[0].textContent),
      sale: product.getElementsByTagName('sale')[0].textContent === 'true'
    }));

    filteredProducts = [...allProducts];

    // Диапазон цен по данным (для подписи как на макете)
    const prices = allProducts.map(p => p.price).filter(n => Number.isFinite(n));
    const dataMin = prices.length ? Math.min(...prices) : 0;
    const dataMax = prices.length ? Math.max(...prices) : 3000;

    if (priceMinInput && !priceMinInput.value) priceMinInput.value = String(Math.floor(dataMin));
    if (priceMaxInput && !priceMaxInput.value) priceMaxInput.value = String(Math.ceil(Math.max(dataMax, 3000)));

    currentFilters.priceMin = parseFloat(priceMinInput?.value) || 0;
    currentFilters.priceMax = parseFloat(priceMaxInput?.value) || Infinity;
    updatePriceTitle();
    
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      currentFilters.category = categoryParam;
      updateActiveTab();
    }

    generateDynamicFilters();
    applyFilters();
    renderProducts();
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
  }
}

function updatePriceTitle() {
  if (!priceGroupTitle) return;
  const min = priceMinInput?.value !== '' ? (parseFloat(priceMinInput.value) || 0) : 0;
  const maxRaw = priceMaxInput?.value !== '' ? parseFloat(priceMaxInput.value) : NaN;
  const max = Number.isFinite(maxRaw) ? maxRaw : 3000;
  priceGroupTitle.textContent = `Цена: ${min}-${max} BYN`;
}

function sortProducts(list) {
  const out = [...list];
  switch (sortMode) {
    case 'price-asc':
      return out.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return out.sort((a, b) => b.price - a.price);
    case 'rating-desc':
      return out.sort((a, b) => (b.rating - a.rating) || (b.reviews - a.reviews));
    case 'popular':
    default:
      return out.sort((a, b) => (b.reviews - a.reviews) || (b.rating - a.rating));
  }
}

function salePercent(product) {
  if (!product.sale) return null;
  return 10;
}

//  Генерация динамических фильтров 
function generateDynamicFilters() {
  // Получаем уникальные размеры
  const sizes = [...new Set(allProducts.map(p => p.size))].sort();
  sizeFiltersContainer.innerHTML = sizes.map(size => `
    <label class="checkbox-label">
      <input type="checkbox" name="size" value="${size}">
      <span>${size}</span>
    </label>
  `).join('');

  // Получаем уникальные бренды
  const brands = [...new Set(allProducts.map(p => p.brand))].sort();
  brandFiltersContainer.innerHTML = brands.map(brand => `
    <label class="checkbox-label">
      <input type="checkbox" name="brand" value="${brand}">
      <span>${brand}</span>
    </label>
  `).join('');

  // Добавляем обработчики для новых чекбоксов
  attachCheckboxListeners();
}

// Обновление активной вкладки
function updateActiveTab() {
  if (categorySelect) {
    categorySelect.value = currentFilters.category;
  }
}

//  Рендеринг товаров 
function renderProducts() {
  if (filteredProducts.length === 0) {
    catalogProductsContainer.innerHTML = '';
    if (productCountHeader) productCountHeader.textContent = '0';
    if (productCountShown) productCountShown.textContent = '0';
    return;
  }

  const html = sortProducts(filteredProducts).map(product => {
    const stars = renderStars(product.rating);
    const imagePath = getProductImagePath(product);
    const discount = salePercent(product);

    return `
      <article class="product-catalog-card">
        ${discount ? `<div class="sale-badge">-${discount}%</div>` : ''}
        <div class="product-catalog-image-wrapper">
          <img src="${imagePath}" alt="${product.name}" class="product-catalog-image" onerror="this.onerror=null;this.src='images/pirelli.svg';">
        </div>
        <p class="product-catalog-brand">${product.brand}</p>
        <h3 class="product-catalog-name">${product.name}</h3>
        <p class="product-catalog-meta">${product.size} • ${getSeasonName(product.season)}</p>
        <div class="product-rating">
          <div class="stars">${stars}</div>
          <span class="reviews">(${product.reviews})</span>
        </div>
        <p class="product-catalog-price">${product.price.toFixed(0)} BYN</p>
        <button class="btn btn-primary" onclick="openBookingModal()">Забронировать</button>
      </article>
    `;
  }).join('');

  catalogProductsContainer.innerHTML = html;
  const count = filteredProducts.length;
  if (productCountHeader) productCountHeader.textContent = String(count);
  if (productCountShown) productCountShown.textContent = String(count);
}

//  Звезды рейтинга 
function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    const cls = i <= rating ? 'star' : 'star star-empty';
    stars += `<img class="${cls}" src="images/Star 26.svg" alt="">`;
  }
  return stars;
}

// Получение пути к изображению 
function getProductImagePath(product) {
  const brandToImage = {
    bbs: 'bbs.svg',
    bridgestone: 'bridgestone.svg',
    enkei: 'enkei.svg',
    michelin: 'michelin.svg',
    pirelli: 'pirelli.svg',
    vossen: 'vossen.svg'
  };
  const brandKey = product.brand.toLowerCase();
  return `images/${brandToImage[brandKey] || (product.category === 'wheels' ? 'vossen.svg' : 'pirelli.svg')}`;
}

// Название сезона
function getSeasonName(season) {
  const seasons = {
    'summer': 'Летние',
    'winter': 'Зимние',
    'all': 'Всесезонные'
  };
  return seasons[season] || season;
}


// Применение фильтров 
function applyFilters() {
  const matchedProducts = allProducts.filter(product => {
   
    if (currentFilters.category !== 'all' && product.category !== currentFilters.category) {
      return false;
    }

    
    if (currentFilters.sizes.length > 0 && !currentFilters.sizes.includes(product.size)) {
      return false;
    }

   
    if (currentFilters.seasons.length > 0 && !currentFilters.seasons.includes(product.season)) {
      return false;
    }


    if (currentFilters.brands.length > 0 && !currentFilters.brands.includes(product.brand)) {
      return false;
    }

    
    if (product.price < currentFilters.priceMin || product.price > currentFilters.priceMax) {
      return false;
    }

    return true;
  });

  filteredProducts = matchedProducts;
  renderProducts();
}


// Категория
if (categorySelect) {
  categorySelect.addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    updateActiveTab();
    applyFilters();
  });
}

// Чекбоксы размеров, сезонов и брендов
function attachCheckboxListeners() {
  // Размеры
  document.querySelectorAll('input[name="size"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentFilters.sizes.push(e.target.value);
      } else {
        currentFilters.sizes = currentFilters.sizes.filter(s => s !== e.target.value);
      }
      applyFilters();
    });
  });

  // Сезоны
  document.querySelectorAll('input[name="season"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentFilters.seasons.push(e.target.value);
      } else {
        currentFilters.seasons = currentFilters.seasons.filter(s => s !== e.target.value);
      }
      applyFilters();
    });
  });

  // Бренды
  document.querySelectorAll('input[name="brand"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentFilters.brands.push(e.target.value);
      } else {
        currentFilters.brands = currentFilters.brands.filter(b => b !== e.target.value);
      }
      applyFilters();
    });
  });
}

// Фильтр по цене
if (priceMinInput) {
  priceMinInput.addEventListener('input', (e) => {
    currentFilters.priceMin = parseFloat(e.target.value) || 0;
    updatePriceTitle();
    applyFilters();
  });
}

if (priceMaxInput) {
  priceMaxInput.addEventListener('input', (e) => {
    const v = e.target.value;
    currentFilters.priceMax = v === '' ? 3000 : (parseFloat(v) || 3000);
    updatePriceTitle();
    applyFilters();
  });
}

if (catalogSort) {
  catalogSort.addEventListener('change', (e) => {
    sortMode = e.target.value;
    renderProducts();
  });
}

// Сброс фильтров
if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener('click', () => {
    currentFilters = {
      category: 'all',
      sizes: [],
      seasons: [],
      brands: [],
      priceMin: 0,
      priceMax: 3000
    };

    // Сброс вкладок
    updateActiveTab();

    // Сброс чекбоксов
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });

    // Сброс цен
    if (priceMinInput) priceMinInput.value = '0';
    if (priceMaxInput) priceMaxInput.value = '3000';
    currentFilters.priceMin = 0;
    currentFilters.priceMax = 3000;
    updatePriceTitle();

    applyFilters();
  });
}

//  Инициализация 
loadProducts();
