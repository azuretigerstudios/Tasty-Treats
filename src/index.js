/* src/index.js */
/* import Swiper from 'swiper/bundle';
import 'swiper/css/bundle'; */

const BASE_URL = "https://tasty-treats-backend.p.goit.global/api";

const recipesContainer = document.querySelector('.js-recipes-grid');
const categoriesList = document.querySelector('.js-categories-list');
const popularList = document.querySelector('.js-popular-list');

// Başlatıcı
async function init() {
    setupSwiper(); // Slider'ı çalıştır
    await fetchCategories(); // Sidebar'ı doldur
    await fetchPopularRecipes(); // Popülerleri doldur
    fetchRecipes(); // Yemekleri getir

    // Tema yönetimi
    document.querySelector('.theme-switch').addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
    });
}

function setupSwiper() {
    new Swiper('.hero-swiper', {
        loop: true,
        autoplay: { delay: 3000 },
        pagination: { el: '.swiper-pagination', clickable: true },
    });
}

async function fetchCategories() {
    if(!categoriesList) return;
    try {
        const res = await fetch(`${BASE_URL}/categories`);
        const data = await res.json();
        categoriesList.innerHTML = data.map(cat => `<li><button>${cat.name}</button></li>`).join('');
    } catch(e) {}
}

async function fetchPopularRecipes() {
    if(!popularList) return;
    try {
        const res = await fetch(`${BASE_URL}/recipes/popular`);
        const data = await res.json();
        popularList.innerHTML = data.map(r => `
            <li style="display:flex; gap:10px; margin-bottom:10px;">
                <img src="${r.preview}" style="width:50px; height:50px; border-radius:5px;">
                <div><h5 style="margin:0; font-size:12px;">${r.title}</h5><p style="margin:0; font-size:10px;">${r.description.substring(0,30)}...</p></div>
            </li>`).join('');
    } catch(e) {}
}

async function fetchRecipes() {
    if(!recipesContainer) return;
    try {
        const res = await fetch(`${BASE_URL}/recipes?limit=9`);
        const data = await res.json();

        recipesContainer.innerHTML = data.results.map(r => `
            <div class="recipe-card" style="background-image: url('${r.preview}')">
                <div class="card-icons"><button>🤍</button></div>
                <div class="card-info">
                    <h3 class="card-title">${r.title}</h3>
                    <p class="card-desc">${r.description}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:orange">⭐ ${Math.round(r.rating)}</span>
                        <button class="see-recipe-btn">See recipe</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch(e) {}
}

init();