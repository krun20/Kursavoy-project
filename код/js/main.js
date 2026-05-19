// DOM элементы
const burgerMenu = document.getElementById('burgerMenu');
const navMenu = document.getElementById('navMenu');
const bookingModal = document.getElementById('bookingModal');
const successModal = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModal');
const closeSuccessModalBtn = document.getElementById('closeSuccessModal');
const modalOverlay = document.getElementById('modalOverlay');
const successModalOverlay = document.getElementById('successModalOverlay');
const bookingForm = document.getElementById('bookingForm');

// Бургер меню
if (burgerMenu && navMenu) {
  burgerMenu.addEventListener('click', () => {
    burgerMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      burgerMenu.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });
}

// Модальные окна
function openBookingModal() {
  if (bookingModal) {
    bookingModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeBookingModal() {
  if (bookingModal) {
    bookingModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function openSuccessModal() {
  if (successModal) {
    successModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeSuccessModal() {
  if (successModal) {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', closeBookingModal);
}

if (closeSuccessModalBtn) {
  closeSuccessModalBtn.addEventListener('click', closeSuccessModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', closeBookingModal);
}

if (successModalOverlay) {
  successModalOverlay.addEventListener('click', closeSuccessModal);
}

// Валидация формы
if (bookingForm) {
  const phoneInput = bookingForm.querySelector('input[name="phone"]');
  const submitBtn = bookingForm.querySelector('button[type="submit"]');

  function normalizePhone(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function isValidByPhone(value) {
    const v = normalizePhone(value).replace(/\s+/g, '');
    const phoneRegex = new RegExp('^\\+375\\d{9}$');
    return phoneRegex.test(v);
  }

  function updateSubmitState() {
    if (!submitBtn) return;
    const ok = isValidByPhone(phoneInput?.value);
    submitBtn.disabled = !ok;
    submitBtn.classList.toggle('is-disabled', !ok);
  }

  if (phoneInput) {
    phoneInput.setAttribute('inputmode', 'tel');
    phoneInput.setAttribute('pattern', '^\\+375\\s?\\d{2}\\s?\\d{3}\\s?\\d{2}\\s?\\d{2}$');
    phoneInput.setAttribute('title', 'Введите номер в формате: +375 29 123 45 67');

    phoneInput.addEventListener('input', updateSubmitState);
    phoneInput.addEventListener('blur', updateSubmitState);
  }

  updateSubmitState();

  // Отправка формы
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(bookingForm);
    const data = {
      lastName: formData.get('lastName'),
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName'),
      phone: formData.get('phone'),
      email: formData.get('email')
    };

    if (!data.lastName || !data.firstName || !data.middleName || !data.phone || !data.email) {
      alert('Пожалуйста, заполните все поля!');
      return;
    }

    if (!isValidByPhone(data.phone)) {
      alert('Введите номер телефона в формате: +375 29 123 45 67');
      updateSubmitState();
      return;
    }

    console.log('Форма отправлена:', data);

    bookingForm.reset();
    updateSubmitState();
    closeBookingModal();

    setTimeout(() => {
      openSuccessModal();
    }, 300);

    setTimeout(() => {
      closeSuccessModal();
    }, 3300);
  });
}

// Вспомогательные функции для товаров
function getProductImagePathForHome(product) {
  const brandToImage = {
    bbs: 'bbs.svg',
    enkei: 'enkei.svg',
    michelin: 'michelin.svg',
    pirelli: 'pirelli.svg',
    vossen: 'vossen.svg',
    bridgestone: 'bridgestone.svg'
  };
  const brandKey = product.brand.toLowerCase();
  return `images/${brandToImage[brandKey] || (product.category === 'wheels' ? 'vossen.svg' : 'pirelli.svg')}`;
}

function renderStarsHome(rating) {
  let out = '';
  for (let i = 1; i <= 5; i++) {
    const cls = i <= rating ? 'star' : 'star star-empty';
    out += `<img class="${cls}" src="images/Star 26.svg" alt="">`;
  }
  return out;
}

// Загрузка популярных товаров
const popularProductsContainer = document.getElementById('popularProducts');

function loadPopularProducts() {
  const container = document.getElementById('popularProducts');
  if (!container) return;

  const products = [
    { name: 'BBS', brand: 'BBS', category: 'wheels', season: 'all', size: 'R19', price: 1200, rating: 5, reviews: 28 },
    { name: 'Vossen', brand: 'Vossen', category: 'wheels', season: 'all', size: 'R20', price: 2300, rating: 5, reviews: 15 },
    { name: 'Pirelli', brand: 'Pirelli', category: 'tires', season: 'summer', size: '225/50 R17', price: 260, rating: 5, reviews: 38 }
  ];

  function seasonName(s) {
    return { summer: 'Летние', winter: 'Зимние', all: 'Всесезонные' }[s] || s;
  }

  container.innerHTML = products.map(p => `
    <article class="product-catalog-card">
      <div class="product-catalog-image-wrapper">
        <img src="${getProductImagePathForHome(p)}" alt="" class="product-catalog-image" loading="lazy" onerror="this.onerror=null;this.src='images/pirelli.svg';">
      </div>
      <p class="product-catalog-brand">${p.brand}</p>
      <h3 class="product-catalog-name">${p.name}</h3>
      <p class="product-catalog-meta">${p.size} • ${seasonName(p.season)}</p>
      <div class="product-rating">
        <div class="stars">${renderStarsHome(p.rating)}</div>
        <span class="reviews">(${p.reviews})</span>
      </div>
      <p class="product-catalog-price">${p.price.toFixed(0)} BYN</p>
      <button type="button" class="btn btn-primary book-btn" data-product="${p.name.replace(/"/g, '&quot;')}">Забронировать</button>
    </article>
  `).join('');

  document.querySelectorAll('.book-btn').forEach(btn => {
    btn.addEventListener('click', () => openBookingModal());
  });
}

if (popularProductsContainer) {
  loadPopularProducts();
}

// Плавный скролл по якорным ссылкам
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});