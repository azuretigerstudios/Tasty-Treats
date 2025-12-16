let e="https://tasty-treats-backend.p.goit.global/api",t=document.querySelector(".js-recipes-grid"),i=document.querySelector(".js-categories-list"),a=document.querySelector(".js-popular-list");async function n(){if(i)try{let t=await fetch(`${e}/categories`);i.innerHTML=(await t.json()).map(e=>`<li><button>${e.name}</button></li>`).join("")}catch(e){}}async function s(){if(a)try{let t=await fetch(`${e}/recipes/popular`);a.innerHTML=(await t.json()).map(e=>`
            <li style="display:flex; gap:10px; margin-bottom:10px;">
                <img src="${e.preview}" style="width:50px; height:50px; border-radius:5px;">
                <div><h5 style="margin:0; font-size:12px;">${e.title}</h5><p style="margin:0; font-size:10px;">${e.description.substring(0,30)}...</p></div>
            </li>`).join("")}catch(e){}}async function c(){if(t)try{let i=await fetch(`${e}/recipes?limit=9`);t.innerHTML=(await i.json()).results.map(e=>`
            <div class="recipe-card" style="background-image: url('${e.preview}')">
                <div class="card-icons"><button>\u{1F90D}</button></div>
                <div class="card-info">
                    <h3 class="card-title">${e.title}</h3>
                    <p class="card-desc">${e.description}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:orange">\u{2B50} ${Math.round(e.rating)}</span>
                        <button class="see-recipe-btn">See recipe</button>
                    </div>
                </div>
            </div>
        `).join("")}catch(e){}}(async function e(){new Swiper(".hero-swiper",{loop:!0,autoplay:{delay:3e3},pagination:{el:".swiper-pagination",clickable:!0}}),await n(),await s(),c(),document.querySelector(".theme-switch").addEventListener("click",()=>{document.body.classList.toggle("dark-theme")})})();
//# sourceMappingURL=favorites.31f6a119.js.map
