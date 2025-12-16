/* src/index.js - MENTOR ONAYLI VERSİYON */

// NOT: Swiper'ı CDN'den aldığımız için import etmiyoruz.
// Doğrudan global 'Swiper' nesnesini kullanıyoruz.

const BASE_URL = "https://tasty-treats-backend.p.goit.global/api";

// --- SEÇİCİLER ---
const recipesContainer = document.querySelector('.js-recipes-grid');
const favoritesContainer = document.querySelector('.js-favorites-grid');
const paginationContainer = document.getElementById('pagination');

// Sidebar
const categoriesList = document.querySelector('.js-categories-list');
const popularList = document.querySelector('.js-popular-list');
const allCategoriesBtn = document.querySelector('.all-categories-btn');

// Modallar
const recipeModal = document.getElementById('recipe-modal');
const orderModal = document.getElementById('order-modal');
const ratingModal = document.getElementById('rating-modal');
const modalContent = document.getElementById('modal-content');
const orderForm = document.getElementById('order-form');
const ratingForm = document.getElementById('rating-form');

// Filtreler
const searchInput = document.getElementById('search-input');
const timeSelect = document.getElementById('time-select');
const areaSelect = document.getElementById('area-select');
const ingredientSelect = document.getElementById('ingredient-select');
const resetButton = document.getElementById('reset-filters');

// Durum (State)
let filters = {
    category: '',
    title: '',
    area: '',
    ingredient: '',
    time: '',
    limit: window.innerWidth < 768 ? 6 : (window.innerWidth < 1280 ? 8 : 9),
    page: 1
};
let currentRecipeId = null;

// --- BAŞLATICI ---
async function init() {
    setupTheme();
    setupMobileMenu();
    setupCommonListeners(); // Modal kapatma vb.

    // Sepet (Order) butonlarını dinle
    setupOrderButtons();

    if (recipesContainer) {
        // --- ANASAYFA ---
        initSwiper(); // Slider başlat

        await fetchCategories();
        await fetchPopularRecipes();
        await fetchAreas();
        await fetchIngredients();
        fillTimeSelect();

        fetchRecipes();

        addHomeEventListeners(); // Filtreler
        setupRecipeClicks(recipesContainer); // Grid tıklamaları (Favori/Detay)

        // Resize Limiti
        window.addEventListener('resize', () => {
            const newLimit = window.innerWidth < 768 ? 6 : (window.innerWidth < 1280 ? 8 : 9);
            if(filters.limit !== newLimit) { filters.limit = newLimit; fetchRecipes(); }
        });
    } else if (favoritesContainer) {
        // --- FAVORİLER SAYFASI ---
        loadFavorites();
        setupRecipeClicks(favoritesContainer);
    }
}

// --- 1. SWIPER (SLIDER) ---
function initSwiper() {
    // Swiper CDN ile yüklendiği için direkt kullanabiliriz
    if (typeof Swiper !== 'undefined') {
        new Swiper('.hero-swiper', {
            loop: true,
            autoplay: { delay: 5000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            allowTouchMove: true,
        });
    } else {
        console.warn('Swiper not loaded yet.');
    }
}

// --- 2. SEPET (ORDER) İŞLEMLERİ ---
function setupOrderButtons() {
    // Event Delegation kullanarak tüm "js-open-order" butonlarını yakalıyoruz
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.js-open-order')) {
            e.preventDefault();
            toggleModal(orderModal);
        }
    });

    // Form Gönderme
    if(orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(orderForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await fetch(`${BASE_URL}/orders/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if(!res.ok) throw new Error('Sipariş hatası');

                alert('Siparişiniz alındı! 🛒 Afiyet olsun.');
                toggleModal(orderModal);
                orderForm.reset();
            } catch(error) {
                alert('Bir hata oluştu. Lütfen tekrar deneyin.');
                console.error(error);
            }
        });
    }

    // Kapatma butonu
    const closeBtn = document.querySelector('.js-close-order');
    if(closeBtn) closeBtn.addEventListener('click', () => toggleModal(orderModal));
}

// --- 3. FAVORİ İŞLEMLERİ ---
async function handleFavoriteClick(id, btn) {
    let favs = JSON.parse(localStorage.getItem('favorites')) || [];
    const index = favs.findIndex(f => f._id === id);

    if (index === -1) {
        // Ekleme İşlemi
        try {
            // Önce butonu aktif yap (Hızlı tepki için)
            btn.classList.add('active');
            btn.innerHTML = '❤️';

            const res = await fetch(`${BASE_URL}/recipes/${id}`);
            if(!res.ok) throw new Error('Veri alınamadı');
            const recipe = await res.json();

            // Tekrar kontrol et (Belki kullanıcı spam yapmıştır)
            let currentFavs = JSON.parse(localStorage.getItem('favorites')) || [];
            if (!currentFavs.some(f => f._id === id)) {
                currentFavs.push(recipe);
                localStorage.setItem('favorites', JSON.stringify(currentFavs));
            }
        } catch(e) {
            console.error(e);
            // Hata olursa geri al
            btn.classList.remove('active');
            btn.innerHTML = '🤍';
        }
    } else {
        // Çıkarma İşlemi
        favs.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favs));
        btn.classList.remove('active');
        btn.innerHTML = '🤍';

        // Eğer favoriler sayfasındaysak anında sil
        if(favoritesContainer) loadFavorites();
    }
}

function loadFavorites() {
    const favs = JSON.parse(localStorage.getItem('favorites')) || [];
    if(favs.length === 0) {
        favoritesContainer.innerHTML = '<p style="text-align:center; width:100%; margin-top:20px;">Henüz favori tarifiniz yok. 🤷‍♂️</p>';
    } else {
        renderRecipes(favs, favoritesContainer);
    }
}

// --- 4. DATA FETCHING (KATEGORİLER & TARİFLER) ---
async function fetchCategories() {
    if(!categoriesList) return;
    try {
        const res = await fetch(`${BASE_URL}/categories`);
        const data = await res.json();

        categoriesList.innerHTML = data.map(cat => `
            <li><button class="category-btn" data-category="${cat.name}">${cat.name}</button></li>
        `).join('');

        categoriesList.addEventListener('click', (e) => {
            if(e.target.classList.contains('category-btn')) {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                if(allCategoriesBtn) allCategoriesBtn.classList.remove('active');
                e.target.classList.add('active');

                filters.category = e.target.dataset.category;
                filters.page = 1;
                fetchRecipes();
            }
        });

        if(allCategoriesBtn) {
            allCategoriesBtn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                allCategoriesBtn.classList.add('active');
                filters.category = '';
                filters.page = 1;
                fetchRecipes();
            });
        }
    } catch(e) { console.error(e); }
}

async function fetchRecipes() {
    try {
        const params = new URLSearchParams(filters);
        for(const [k, v] of [...params.entries()]) if(!v) params.delete(k);

        const res = await fetch(`${BASE_URL}/recipes?${params}`);
        const data = await res.json();

        if (data.results.length === 0) {
            recipesContainer.innerHTML = '<p style="grid-column:1/-1; text-align:center;">Tarif bulunamadı.</p>';
            paginationContainer.innerHTML = '';
            return;
        }

        renderRecipes(data.results, recipesContainer);
        renderPagination(data.totalPages, filters.page);
    } catch(e) { console.error(e); }
}

function renderRecipes(recipes, container) {
    const favs = JSON.parse(localStorage.getItem('favorites')) || [];

    container.innerHTML = recipes.map(r => {
        const isFav = favs.some(f => f._id === r._id);
        return `
        <div class="recipe-card" style="background-image: url('${r.preview}');">
            <div class="card-icons">
                 <button class="heart-btn js-add-fav ${isFav ? 'active' : ''}" data-id="${r._id}">
                    ${isFav ? '❤️' : '🤍'}
                 </button>
            </div>
            <div class="card-info">
                <h3 class="card-title">${r.title}</h3>
                <p class="card-desc">${r.description || ''}</p>
                <div class="card-bottom">
                    <span class="rating">⭐ ${Math.round(r.rating*10)/10}</span>
                    <button class="see-recipe-btn" data-id="${r._id}">See recipe</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// --- 5. ORTAK OLAYLAR ---
function setupRecipeClicks(container) {
    container.addEventListener('click', (e) => {
        // Kalp Butonu
        const heartBtn = e.target.closest('.js-add-fav');
        if (heartBtn) {
            const id = heartBtn.dataset.id;
            handleFavoriteClick(id, heartBtn);
            return;
        }

        // Detay Butonu
        const detailBtn = e.target.closest('.see-recipe-btn');
        if (detailBtn) {
            openRecipeModal(detailBtn.dataset.id);
        }
    });
}

function toggleModal(modal) {
    if(!modal) return;
    modal.classList.toggle('is-hidden');
    document.body.style.overflow = modal.classList.contains('is-hidden') ? 'auto' : 'hidden';
}

function setupCommonListeners() {
    [recipeModal, orderModal, ratingModal].forEach(m => {
        if(m) m.addEventListener('click', e => { if(e.target===m) toggleModal(m); });
    });
    document.addEventListener('keydown', e => {
        if(e.key==="Escape") [recipeModal, orderModal, ratingModal].forEach(m => { if(m && !m.classList.contains('is-hidden')) toggleModal(m); });
    });

    // Modal Close Butonları
    const closeRecipe = document.getElementById('close-modal');
    if(closeRecipe) closeRecipe.addEventListener('click', () => toggleModal(recipeModal));

    const closeRating = document.querySelector('.js-close-rating');
    if(closeRating) closeRating.addEventListener('click', () => toggleModal(ratingModal));
}

// --- 6. RECIPE MODAL ---
async function openRecipeModal(id) {
    currentRecipeId = id;
    try {
        toggleModal(recipeModal);
        modalContent.innerHTML = '<div style="padding:20px; text-align:center;">Yükleniyor...</div>';

        const res = await fetch(`${BASE_URL}/recipes/${id}`);
        const recipe = await res.json();

        let video = `<img src="${recipe.preview}" style="width:100%; border-radius:10px;">`;
        if (recipe.youtube) {
            const vId = recipe.youtube.split('v=')[1];
            if(vId) video = `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${vId}" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>`;
        }

        const favs = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFav = favs.some(f => f._id === recipe._id);

        modalContent.innerHTML = `
            ${video}
            <h2 class="modal-title" style="margin-top:15px;">${recipe.title}</h2>
            <div style="margin:10px 0;"><span style="background:#9BB537; color:#fff; padding:4px 10px; border-radius:15px; font-size:12px;">${recipe.time} min</span></div>
            <p class="modal-instructions" style="font-size:14px; opacity:0.8;">${recipe.instructions}</p>
            <div style="margin-bottom:20px;">
                <h4>Ingredients:</h4>
                <ul style="display:grid; grid-template-columns:1fr 1fr; gap:5px; font-size:13px;">
                    ${recipe.ingredients.map(i=>`<li>• ${i.name} <span style="opacity:0.6">(${i.measure})</span></li>`).join('')}
                </ul>
            </div>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button id="modal-fav-btn" style="background:${isFav?'#ccc':'#9BB537'}; color:white; border:none; padding:10px 20px; border-radius:8px;">${isFav?'Remove Favorite':'Add to Favorite'}</button>
                <button id="modal-rate-btn" style="background:orange; color:white; border:none; padding:10px 20px; border-radius:8px;">Give Rating</button>
            </div>
        `;

        document.getElementById('modal-fav-btn').addEventListener('click', (e) => {
            // Modal içinden favori işlemi
            handleFavoriteClick(recipe._id, { classList: { add:()=>{}, remove:()=>{} }, innerHTML: '' }); // Fake buton objesi
            // Buton metnini güncelle
            e.target.innerText = e.target.innerText.includes('Add') ? 'Remove Favorite' : 'Add to Favorite';
            e.target.style.background = e.target.innerText.includes('Add') ? '#9BB537' : '#ccc';
            // Izgarayı güncelle
            const gridBtn = document.querySelector(`.js-add-fav[data-id="${recipe._id}"]`);
            if(gridBtn) {
                gridBtn.classList.toggle('active');
                gridBtn.innerHTML = gridBtn.classList.contains('active') ? '❤️' : '🤍';
            }
        });

        document.getElementById('modal-rate-btn').addEventListener('click', () => toggleModal(ratingModal));

    } catch(e) { console.error(e); }
}

// --- 7. DİĞER (Popüler, Filtreler, Pagination vb.) ---
// ... (fetchAreas, fetchIngredients, renderPagination, setupTheme vb. kodlar aynen çalışır) ...
// Hata olmaması için kısaca buraya ekliyorum:

async function fetchPopularRecipes() {
    if(!popularList) return;
    try {
        const res = await fetch(`${BASE_URL}/recipes/popular`);
        const data = await res.json();
        popularList.innerHTML = data.map(r => `
            <li data-id="${r._id}">
                <img src="${r.preview}">
                <div class="popular-info"><h4>${r.title}</h4><p>${r.description.substring(0,40)}...</p></div>
            </li>`).join('');
        popularList.addEventListener('click', e => {
            const item = e.target.closest('li');
            if(item) openRecipeModal(item.dataset.id);
        });
    } catch(e){}
}

async function fetchAreas() { try{const r=await fetch(`${BASE_URL}/areas`);const d=await r.json();d.sort((a,b)=>a.name.localeCompare(b.name));areaSelect.innerHTML+=d.map(i=>`<option value="${i.name}">${i.name}</option>`).join('');}catch(e){} }
async function fetchIngredients() { try{const r=await fetch(`${BASE_URL}/ingredients`);const d=await r.json();d.sort((a,b)=>a.name.localeCompare(b.name));ingredientSelect.innerHTML+=d.map(i=>`<option value="${i._id}">${i.name}</option>`).join('');}catch(e){} }
function fillTimeSelect() { let m=""; for(let i=5;i<=120;i+=5) m+=`<option value="${i}">${i} min</option>`; timeSelect.innerHTML+=m; }

function renderPagination(total, current) {
    if(!paginationContainer) return; paginationContainer.innerHTML = ''; if(total<=1) return;
    let h=''; for(let i=1;i<=total;i++) if(i===1||i===total||(i>=current-1&&i<=current+1)) h+=`<button class="pagination-btn ${i===current?'active':''}" data-page="${i}">${i}</button>`;
    paginationContainer.innerHTML = h;
    paginationContainer.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { filters.page=Number(b.dataset.page); fetchRecipes(); window.scrollTo(0,0); }));
}

function addHomeEventListeners() {
    let t; if(searchInput) searchInput.addEventListener('input', e=>{ clearTimeout(t); t=setTimeout(()=>{filters.title=e.target.value.trim(); filters.page=1; fetchRecipes();},500); });
    if(areaSelect) areaSelect.addEventListener('change', e=>{filters.area=e.target.value; filters.page=1; fetchRecipes();});
    if(ingredientSelect) ingredientSelect.addEventListener('change', e=>{filters.ingredient=e.target.value; filters.page=1; fetchRecipes();});
    if(timeSelect) timeSelect.addEventListener('change', e=>{filters.time=e.target.value; filters.page=1; fetchRecipes();});
    if(resetButton) resetButton.addEventListener('click', ()=>{
        searchInput.value=""; areaSelect.value=""; ingredientSelect.value=""; timeSelect.value="";
        filters={category:'',title:'',area:'',ingredient:'',time:'',limit:filters.limit,page:1};
        document.querySelectorAll('.category-btn').forEach(b=>b.classList.remove('active'));
        if(allCategoriesBtn) allCategoriesBtn.classList.add('active');
        fetchRecipes();
    });
}

function setupRatingModal() {
    const stars = document.getElementById('stars-container');
    if(stars) {
        stars.innerHTML = [1,2,3,4,5].map(i=>`<span class="star-label" data-value="${i}" style="font-size:30px;cursor:pointer;color:#ddd;">★</span>`).join('');
        stars.addEventListener('click', e => {
            if(e.target.classList.contains('star-label')) {
                const v = e.target.dataset.value; document.getElementById('rating-input').value = v; document.getElementById('rating-value').innerText = v+'.0';
                document.querySelectorAll('.star-label').forEach(s => s.style.color = s.dataset.value <= v ? 'orange' : '#ddd');
            }
        });
    }
    if(ratingForm) ratingForm.addEventListener('submit', async e => {
        e.preventDefault();
        try { await fetch(`${BASE_URL}/recipes/${currentRecipeId}/rating`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({rate:Number(ratingForm.elements['rate'].value), email:ratingForm.elements['email'].value}) }); alert('Puan gönderildi!'); toggleModal(ratingModal); ratingForm.reset(); } catch(e){ alert('Hata.'); }
    });
}

function setupTheme() {
    const btn = document.querySelector('.theme-switch'); if(!btn) return;
    if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark-theme');
    btn.addEventListener('click', () => { document.body.classList.toggle('dark-theme'); localStorage.setItem('theme', document.body.classList.contains('dark-theme')?'dark':'light'); });
}
function setupMobileMenu() {
    const o=document.querySelector('.js-open-menu'), c=document.querySelector('.js-close-menu'), m=document.querySelector('.js-menu-container');
    if(o&&c&&m) { const t=()=>m.classList.toggle('is-hidden'); o.addEventListener('click',t); c.addEventListener('click',t); }
}

init();