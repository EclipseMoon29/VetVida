/* ============================================================
   VETVIDA — TIENDA (tienda.js)
   Conectado al backend real:
     POST /api/pedidos       → guarda compra en MySQL → aparece en admin
     POST /api/clientes      → guarda cliente en MySQL → aparece en admin
   Si el servidor no está corriendo, todo funciona en modo offline
   y el carrito se guarda en localStorage.
   ============================================================ */

/* ══ LOADER ══ */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 2000);
});

/* ══ CURSOR ══ */
document.addEventListener('DOMContentLoaded', () => {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursor-ring');

  if (cursor && ring) {
    let mx=0, my=0, rx=0, ry=0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      cursor.style.left = mx + 'px'; cursor.style.top  = my + 'px';
      rx += (mx - rx) * 0.14;       ry += (my - ry) * 0.14;
      ring.style.left = rx + 'px';  ring.style.top  = ry + 'px';
      requestAnimationFrame(loop);
    })();
  }

  renderProducts();
  initSlider();
  setMinDate();
  cargarCarritoLocal(); // Restaura carrito si había algo guardado
});

/* ══ SLIDER ══ */
function initSlider() {
  const track  = document.getElementById('sliderTrack');
  const dotsEl = document.getElementById('sliderDots');
  if (!track || !dotsEl) return;

  let current = 0;
  const TOTAL = track.children.length;

  for (let i = 0; i < TOTAL; i++) {
    const d = document.createElement('button');
    d.className = 'slider-dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goTo(i);
    dotsEl.appendChild(d);
  }

  function goTo(n) {
    current = (n + TOTAL) % TOTAL;
    track.style.transform = `translateX(-${current * 100}%)`;
    document.querySelectorAll('.slider-dot').forEach((d, i) =>
      d.classList.toggle('active', i === current));
  }

  window.moveSlide = dir => goTo(current + dir);
  window.goToSlide = goTo;

  let auto = setInterval(() => window.moveSlide(1), 5000);
  const section = document.querySelector('.slider-section');
  if (section) {
    section.addEventListener('mouseenter', () => clearInterval(auto));
    section.addEventListener('mouseleave', () => { auto = setInterval(() => window.moveSlide(1), 5000); });
  }

  let tx = 0;
  track.addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
  track.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) window.moveSlide(dx < 0 ? 1 : -1);
  });
}

/* ══ CATÁLOGO ══ */
const PRODUCTOS = [
  {id:1,  nombre:'Antiparasitario Interno',     cat:'medicina',  animales:['perro','gato'],          emoji:'💊', precio:3200,  desc:'Comprimidos para eliminar parásitos internos. Sabor carne.',   badge:'top' },
  {id:2,  nombre:'Antipulgas y Garrapatas',     cat:'medicina',  animales:['perro','gato'],          emoji:'🧴', precio:4800,  desc:'Pipeta mensual de amplio espectro. Protección duradera.',      badge:'top' },
  {id:3,  nombre:'Vitaminas para Aves',         cat:'medicina',  animales:['ave'],                   emoji:'💉', precio:2100,  desc:'Suplemento vitamínico en gotas para pájaros y loros.',         badge:null  },
  {id:4,  nombre:'Probiótico Digestivo',        cat:'medicina',  animales:['perro','gato','conejo'], emoji:'🌿', precio:3600,  desc:'Restaura la flora intestinal. Ideal post-antibióticos.',       badge:'new' },
  {id:5,  nombre:'Colirio Oftálmico',           cat:'medicina',  animales:['perro','gato'],          emoji:'👁️',precio:2800,  desc:'Limpieza y tratamiento de ojos. Fórmula suave.',              badge:null  },
  {id:6,  nombre:'Calcio para Reptiles',        cat:'medicina',  animales:['reptil'],                emoji:'🦴', precio:1900,  desc:'Suplemento en polvo para espolvorear sobre el alimento.',      badge:null  },
  {id:7,  nombre:'Omega 3 Pelaje Brillante',    cat:'medicina',  animales:['perro','gato'],          emoji:'✨', precio:4100,  desc:'Ácidos grasos esenciales para pelo y piel saludables.',        badge:'new' },
  {id:8,  nombre:'Antibacterial Peces',         cat:'medicina',  animales:['pez'],                   emoji:'🐠', precio:1600,  desc:'Tratamiento de infecciones bacterianas en acuarios.',          badge:null  },
  {id:9,  nombre:'Croquetas Premium Perro',     cat:'comida',    animales:['perro'],                 emoji:'🍖', precio:8500,  desc:'Alimento balanceado adulto. Sin colorantes. 3kg.',             badge:'top' },
  {id:10, nombre:'Croquetas Gato Adulto',       cat:'comida',    animales:['gato'],                  emoji:'🐟', precio:7200,  desc:'Con atún y pollo. Enriquecida con taurina. 2kg.',              badge:'top' },
  {id:11, nombre:'Alimento Húmedo Perro',       cat:'comida',    animales:['perro'],                 emoji:'🥫', precio:1200,  desc:'Lata con carne real. Ideal para complementar la dieta seca.',  badge:null  },
  {id:12, nombre:'Alimento para Aves',          cat:'comida',    animales:['ave'],                   emoji:'🌾', precio:2400,  desc:'Mix de semillas y frutas deshidratadas. 1kg.',                 badge:null  },
  {id:13, nombre:'Pellets para Conejos',        cat:'comida',    animales:['conejo'],                emoji:'🥕', precio:3100,  desc:'Alimento completo con heno, zanahoria y vegetales. 1,5kg.',    badge:'new' },
  {id:14, nombre:'Alimento para Reptiles',      cat:'comida',    animales:['reptil'],                emoji:'🦗', precio:2700,  desc:'Grillos y tenebrios deshidratados. Alto valor proteico.',      badge:null  },
  {id:15, nombre:'Snack Dental Perro',          cat:'comida',    animales:['perro'],                 emoji:'🦷', precio:2200,  desc:'Palitos masticables para higiene bucal. Pack x12.',            badge:'sale'},
  {id:16, nombre:'Alimento Peces Tropicales',   cat:'comida',    animales:['pez'],                   emoji:'🐡', precio:1400,  desc:'Hojuelas premium para peces de agua cálida.',                  badge:null  },
  {id:17, nombre:'Comida Gato Kitten',          cat:'comida',    animales:['gato'],                  emoji:'🍗', precio:6800,  desc:'Formulado para gatitos hasta 12 meses. 1,5kg.',                badge:'new' },
  {id:18, nombre:'Shampoo Anti-Pulgas',         cat:'baño',      animales:['perro'],                 emoji:'🧴', precio:3400,  desc:'Con citronela y lavanda. 500ml. Ph neutro.',                   badge:'top' },
  {id:19, nombre:'Shampoo para Gatos',          cat:'baño',      animales:['gato'],                  emoji:'🛁', precio:2900,  desc:'Fórmula suave sin alcohol. Para pelaje largo y corto.',        badge:null  },
  {id:20, nombre:'Colonia para Mascotas',       cat:'baño',      animales:['perro','gato'],          emoji:'🌸', precio:2100,  desc:'Perfume de larga duración. Aroma lavanda y vainilla.',         badge:null  },
  {id:21, nombre:'Cortaúñas Profesional',       cat:'baño',      animales:['perro','gato','conejo'], emoji:'✂️', precio:4200,  desc:'Acero inoxidable con guía de seguridad.',                     badge:null  },
  {id:22, nombre:'Cepillo Cardador',            cat:'baño',      animales:['perro','gato'],          emoji:'🪮', precio:3100,  desc:'Púas redondeadas. Elimina pelo muerto eficazmente.',          badge:'new' },
  {id:23, nombre:'Toallitas Húmedas',           cat:'baño',      animales:['perro','gato','conejo'], emoji:'🧻', precio:1800,  desc:'Pack x50. Sin alcohol. Para ojos, patas y cuerpo.',            badge:null  },
  {id:24, nombre:'Secador Silencioso',          cat:'baño',      animales:['perro','gato'],          emoji:'💨', precio:18500, desc:'Bajo ruido para no asustar a tu mascota. 2 velocidades.',      badge:'new' },
  {id:25, nombre:'Pelota Kong Rellenable',      cat:'juguetes',  animales:['perro'],                 emoji:'🎾', precio:5200,  desc:'Goma resistente. Rellená con premios.',                        badge:'top' },
  {id:26, nombre:'Rascador para Gatos',         cat:'juguetes',  animales:['gato'],                  emoji:'🏗️',precio:12000, desc:'Torre con cuerda sisal, plataformas y juguete colgante.',     badge:'top' },
  {id:27, nombre:'Juguete Interactivo Ave',     cat:'juguetes',  animales:['ave'],                   emoji:'🪀', precio:1900,  desc:'Espejo con campana y argollas de colores.',                    badge:null  },
  {id:28, nombre:'Túnel para Conejos',          cat:'juguetes',  animales:['conejo'],                emoji:'🕳️',precio:3800,  desc:'Túnel plegable de tela. Estimula el instinto explorador.',    badge:'new' },
  {id:29, nombre:'Puntero Láser',               cat:'juguetes',  animales:['gato'],                  emoji:'🔴', precio:2200,  desc:'5 figuras distintas y luz LED. Pilas incluidas.',              badge:null  },
  {id:30, nombre:'Hueso de Cuero Crudo',        cat:'juguetes',  animales:['perro'],                 emoji:'🦴', precio:1400,  desc:'100% natural. Limpia los dientes y fortalece la mandíbula.',   badge:'sale'},
  {id:31, nombre:'Pelota Sonajero Gato',        cat:'juguetes',  animales:['gato'],                  emoji:'🔔', precio:1100,  desc:'Con cascabel y plumas. Pack x6.',                              badge:null  },
  {id:32, nombre:'Cueva para Reptil',           cat:'juguetes',  animales:['reptil'],                emoji:'🪨', precio:4400,  desc:'Resina apta para terrarios. Escondite natural.',               badge:null  },
  {id:33, nombre:'Campera Polar Perro',         cat:'ropa',      animales:['perro'],                 emoji:'🧥', precio:7800,  desc:'Forro polar suave. Tallas XS a XL.',                           badge:'new' },
  {id:34, nombre:'Sweater de Lana Gato',        cat:'ropa',      animales:['gato'],                  emoji:'🧶', precio:5500,  desc:'Tejido elástico. Para gatos que toleran ropa.',                badge:null  },
  {id:35, nombre:'Capa Impermeable',            cat:'ropa',      animales:['perro'],                 emoji:'🌧️',precio:9200,  desc:'Ajustable con capucha. Ideal para días de lluvia.',            badge:'top' },
  {id:36, nombre:'Zapatillas para Perro',       cat:'ropa',      animales:['perro'],                 emoji:'👟', precio:6400,  desc:'Pack x4. Suela antideslizante. Protege del frío.',             badge:'new' },
  {id:37, nombre:'Disfraz Halloween',           cat:'ropa',      animales:['perro'],                 emoji:'🎃', precio:4800,  desc:'Diseño calabaza. Tallas S, M y L. Cierre velcro.',            badge:'sale'},
  {id:38, nombre:'Pañuelo Bandana',             cat:'ropa',      animales:['perro','gato'],          emoji:'🪢', precio:1600,  desc:'Ajustable. Varios diseños. 100% algodón.',                     badge:null  },
  {id:39, nombre:'Cama Cueva Polar',            cat:'camas',     animales:['perro','gato'],          emoji:'🛏️',precio:11500, desc:'Interior polar súper suave. Razas pequeñas.',                  badge:'top' },
  {id:40, nombre:'Cama Ortopédica Grande',      cat:'camas',     animales:['perro'],                 emoji:'🛋️',precio:18000, desc:'Espuma viscoelástica para razas grandes y seniors.',          badge:'new' },
  {id:41, nombre:'Hamaca para Gato',            cat:'camas',     animales:['gato'],                  emoji:'🌙', precio:5400,  desc:'Se cuelga en la ventana. Soporta hasta 8kg.',                  badge:'new' },
  {id:42, nombre:'Nido para Aves',              cat:'camas',     animales:['ave'],                   emoji:'🪺', precio:2800,  desc:'Paja trenzada para canarios y periquitos.',                    badge:null  },
  {id:43, nombre:'Casa de Mimbre Conejo',       cat:'camas',     animales:['conejo'],                emoji:'🏠', precio:7200,  desc:'Madera y mimbre. Natural y masticable.',                       badge:null  },
  {id:44, nombre:'Cama Impermeable Perro',      cat:'camas',     animales:['perro'],                 emoji:'💧', precio:8900,  desc:'Funda lavable. Relleno antialérgico. Varios tamaños.',         badge:'sale'},
  {id:45, nombre:'Comedero Automático',         cat:'comederos', animales:['perro','gato'],          emoji:'🥣', precio:22000, desc:'Dispensador programable con temporizador y pantalla LCD.',     badge:'new' },
  {id:46, nombre:'Bebedero Fuente',             cat:'comederos', animales:['perro','gato'],          emoji:'⛲', precio:14500, desc:'Fuente circulante con filtro de carbón. 2 litros.',            badge:'top' },
  {id:47, nombre:'Set Comedero + Bebedero',     cat:'comederos', animales:['perro','gato'],          emoji:'🫙', precio:6800,  desc:'Acero inoxidable antibacterial. Base antideslizante.',         badge:null  },
  {id:48, nombre:'Comedero Colgante Aves',      cat:'comederos', animales:['ave'],                   emoji:'🐦', precio:1600,  desc:'Para jaulas. Acrílico transparente y fácil de limpiar.',       badge:null  },
  {id:49, nombre:'Bebedero Biberón Conejo',     cat:'comederos', animales:['conejo'],                emoji:'🍶', precio:1900,  desc:'Tubo de acero inoxidable con boquilla de bola. 250ml.',        badge:null  },
  {id:50, nombre:'Comedero Lento Antiansiedad', cat:'comederos', animales:['perro'],                 emoji:'🐌', precio:4200,  desc:'Laberinto que frena la ingesta. Mejora la digestión.',         badge:'new' },
  {id:51, nombre:'Acuario Starter Kit',         cat:'comederos', animales:['pez'],                   emoji:'🐟', precio:32000, desc:'Acuario 20L con filtro, iluminación LED y termómetro.',        badge:'new' },
  {id:52, nombre:'Terrario Reptil 60cm',        cat:'comederos', animales:['reptil'],                emoji:'🦎', precio:28000, desc:'Vidrio templado con ventilación y puerta frontal deslizante.',  badge:null  },
];

/* ══ ESTADO ══ */
let activeAnimal = 'todos', activeCat = 'todas', cart = [];
let selPayMethod = 'tarjeta-credito', selCuotas = 3, cuotaTipo = 'sin';

/* ══ PERSISTENCIA DEL CARRITO ══
   Guarda el carrito en localStorage para que no se pierda
   si el usuario recarga la página.
*/
function guardarCarrito() {
  localStorage.setItem('vv_cart', JSON.stringify(cart));
}
function cargarCarritoLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem('vv_cart') || '[]');
    if (saved.length) {
      cart = saved;
      updateCartUI();
      renderProducts();
    }
  } catch {}
}

/* ══ FILTROS ══ */
function filterAnimal(btn) {
  document.querySelectorAll('.animal-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeAnimal = btn.dataset.animal;
  renderProducts();
}
function filterCat(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeCat = btn.dataset.cat;
  renderProducts();
}
function filterAndGo(cat) {
  const btn = [...document.querySelectorAll('.cat-btn')].find(b => b.dataset.cat === cat);
  if (btn) filterCat(btn);
  document.querySelector('.filters-bar')?.scrollIntoView({ behavior: 'smooth' });
}

/* ══ RENDER PRODUCTOS ══ */
function renderProducts() {
  const q    = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const ae = { perro:'🐶', gato:'🐱', ave:'🦜', conejo:'🐰', reptil:'🦎', pez:'🐠' };
  const filtered = PRODUCTOS.filter(p =>
    (activeAnimal === 'todos' || p.animales.includes(activeAnimal)) &&
    (activeCat    === 'todas' || p.cat === activeCat) &&
    (!q || p.nombre.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
  );

  const info = document.getElementById('resultsInfo');
  if (info) info.innerHTML = `Mostrando <strong>${filtered.length}</strong> producto${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><div class="emoji">🔍</div><h3>Sin resultados</h3><p>Probá cambiando los filtros.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const inCart = cart.find(c => c.id === p.id);
    const tags   = p.animales.map(a => `<span class="animal-tag">${ae[a]}</span>`).join('');
    const badge  = p.badge ? `<span class="product-badge badge-${p.badge}">${p.badge==='new'?'Nuevo':p.badge==='sale'?'Oferta':'Popular'}</span>` : '';
    return `
      <div class="product-card">
        <div class="product-img">${badge}<div class="product-animal-tags">${tags}</div>${p.emoji}</div>
        <div class="product-body">
          <p class="product-cat">${p.cat}</p>
          <h3 class="product-name">${p.nombre}</h3>
          <p class="product-desc">${p.desc}</p>
        </div>
        <div class="product-footer">
          <span class="product-price">$${p.precio.toLocaleString('es-AR')}</span>
          <button class="add-btn ${inCart ? 'added' : ''}" onclick="addToCart(${p.id})">${inCart ? '✓' : '+'}</button>
        </div>
      </div>`;
  }).join('');
}

/* ══ CARRITO ══ */
function addToCart(id) {
  const p  = PRODUCTOS.find(x => x.id === id);
  const ex = cart.find(c => c.id === id);
  ex ? ex.qty++ : cart.push({ ...p, qty: 1 });
  guardarCarrito();
  updateCartUI();
  renderProducts();
  showToast(`🐾 ¡${p.nombre} agregado!`);
}
function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  guardarCarrito();
  updateCartUI();
  renderProducts();
}
function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  item.qty <= 0 ? removeFromCart(id) : (guardarCarrito(), updateCartUI());
}
function updateCartUI() {
  const total = cart.reduce((s, c) => s + c.precio * c.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');
  if (countEl) countEl.textContent = count;
  if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-AR')}`;

  const el = document.getElementById('cartItems');
  if (!el) return;
  if (!cart.length) {
    el.innerHTML = `<div class="cart-empty"><div class="emoji">🛒</div><p>Tu carrito está vacío</p></div>`;
    return;
  }
  el.innerHTML = cart.map(c => `
    <div class="cart-item">
      <div class="cart-item-icon">${c.emoji}</div>
      <div class="cart-item-info">
        <p class="cart-item-name">${c.nombre}</p>
        <p class="cart-item-price">$${(c.precio * c.qty).toLocaleString('es-AR')}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${c.id},-1)">−</button>
          <span class="qty-num">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${c.id},1)">+</button>
          <button class="remove-item" onclick="removeFromCart(${c.id})">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}
function toggleCart() {
  document.getElementById('cartPanel')?.classList.toggle('open');
  document.getElementById('cartOverlay')?.classList.toggle('open');
}

/* ══ CHECKOUT ══ */
function openCheckout() {
  if (!cart.length) { showToast('⚠️ Tu carrito está vacío'); return; }
  toggleCart();
  const total = cart.reduce((s, c) => s + c.precio * c.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const payTotalEl = document.getElementById('payTotal');
  const payItemsEl = document.getElementById('payItems');
  if (payTotalEl) payTotalEl.textContent = `$${total.toLocaleString('es-AR')}`;
  if (payItemsEl) payItemsEl.textContent = `${count} producto${count !== 1 ? 's' : ''}`;
  selPayMethod = 'tarjeta-credito';
  document.querySelectorAll('.pay-method').forEach((m, i) => m.classList.toggle('selected', i === 0));
  document.getElementById('cuotasSection')?.classList.add('visible');
  renderCuotas(total);
  document.getElementById('payFormSection').style.display = '';
  document.getElementById('paySuccessSection')?.classList.remove('visible');
  openModal('payModal');
}

function selectPayMethod(el, method) {
  document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');
  selPayMethod = method;
  const show = ['tarjeta-credito', 'mercadopago'].includes(method);
  document.getElementById('cuotasSection')?.classList.toggle('visible', show);
  if (show) renderCuotas(cart.reduce((s, c) => s + c.precio * c.qty, 0), method === 'mercadopago' ? 6 : 12);
}
function setCuotaTipo(btn, tipo) {
  document.querySelectorAll('.cuota-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  cuotaTipo = tipo;
  renderCuotas(cart.reduce((s, c) => s + c.precio * c.qty, 0), selPayMethod === 'mercadopago' ? 6 : 12);
}
function renderCuotas(total, max = 12) {
  const planes = cuotaTipo === 'sin'
    ? [{ n:1,int:0 },{ n:3,int:0 },{ n:6,int:0 },{ n:12,int:0 }]
    : [{ n:6,int:.08 },{ n:9,int:.15 },{ n:12,int:.22 },{ n:18,int:.35 },{ n:24,int:.50 }];
  const grid = document.getElementById('cuotasGrid');
  if (!grid) return;
  grid.innerHTML = planes.filter(p => p.n <= max).map(p => {
    const tf = total * (1 + p.int), vc = Math.ceil(tf / p.n), sel = selCuotas === p.n;
    const bc = p.int === 0 ? 'sin' : 'con', bt = p.int === 0 ? 'Sin interés' : `+${Math.round(p.int * 100)}% interés`;
    return `<div class="cuota-card ${sel ? 'selected' : ''}" onclick="selectCuota(this,${p.n})">
      <div class="cuota-num">${p.n}<span>x</span></div>
      <div class="cuota-valor">$${vc.toLocaleString('es-AR')}/mes</div>
      <span class="cuota-badge ${bc}">${bt}</span></div>`;
  }).join('');
}
function selectCuota(el, n) {
  document.querySelectorAll('.cuota-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selCuotas = n;
}

/* ══ CONFIRMACIÓN DE COMPRA
   Envía el pedido al backend → aparece en el panel admin.
   Si no hay conexión, guarda en localStorage.
══ */
async function confirmPayment() {
  const nombre   = document.getElementById('buyerNombre')?.value.trim();
  const apellido = document.getElementById('buyerApellido')?.value.trim();
  const email    = document.getElementById('buyerEmail')?.value.trim();
  const tel      = document.getElementById('buyerTel')?.value.trim();
  const dir      = document.getElementById('buyerDir')?.value.trim();

  if (!nombre || !apellido || !email || !tel || !dir) {
    showToast('⚠️ Completá todos tus datos');
    return;
  }

  // Deshabilitar botón mientras se procesa
  const btn = document.querySelector('.confirm-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Procesando…'; }

  const total = cart.reduce((s, c) => s + c.precio * c.qty, 0);

  const payload = {
    cliente_nombre:  `${nombre} ${apellido}`,
    cliente_email:   email,
    cliente_tel:     tel,
    direccion_envio: dir,
    metodo_pago:     selPayMethod,
    cuotas:          selCuotas,
    items: cart.map(c => ({ id: c.id, qty: c.qty })),
  };

  // ── Llamar al backend ──
  const result = await VetAPI.crearPedido(payload);
  if (btn) { btn.disabled = false; btn.textContent = 'Confirmar compra →'; }

  const needsCuotas = ['tarjeta-credito', 'mercadopago'].includes(selPayMethod);
  const vc = needsCuotas ? Math.ceil(total / selCuotas) : null;
  const mn = {
    'tarjeta-credito':'Tarjeta de crédito', 'tarjeta-debito':'Tarjeta de débito',
    'transferencia':'Transferencia bancaria', 'mercadopago':'MercadoPago',
    'efectivo':'Efectivo', 'qr':'Código QR',
  };

  if (result.ok || result.offline) {
    // Mostrar pantalla de éxito
    const detailEl = document.getElementById('paySuccessDetail');
    if (detailEl) detailEl.innerHTML = `
      <div><span>Comprador</span><span>${nombre} ${apellido}</span></div>
      <div><span>Email</span><span>${email}</span></div>
      <div><span>Método</span><span>${mn[selPayMethod]}</span></div>
      ${needsCuotas ? `<div><span>Plan</span><span>${selCuotas} cuota${selCuotas > 1 ? 's' : ''} de $${vc.toLocaleString('es-AR')}</span></div>` : ''}
      <div><span>Total</span><span>$${total.toLocaleString('es-AR')}</span></div>
      ${result.offline ? '<div><span>Estado</span><span>⚠️ Sin conexión — se sincronizará pronto</span></div>' : ''}
      ${result.ok && result.data.pedido_id ? `<div><span>Nº pedido</span><span>#${result.data.pedido_id}</span></div>` : ''}`;

    document.getElementById('payFormSection').style.display = 'none';
    document.getElementById('paySuccessSection')?.classList.add('visible');

    // Si estaba offline, guardar para sincronizar después
    if (result.offline) guardarPedidoLocal(payload);

    // Vaciar carrito
    cart = [];
    guardarCarrito();
    updateCartUI();
    renderProducts();
    limpiarCamposPago();
  } else {
    showToast(`⚠️ ${result.data.error || 'Error al procesar el pago. Intentá de nuevo.'}`, 'error');
  }
}

/* Guarda pedido localmente si no hay servidor */
function guardarPedidoLocal(payload) {
  const pendientes = JSON.parse(localStorage.getItem('vv_pedidos_offline') || '[]');
  pendientes.push({ ...payload, guardadoEn: new Date().toISOString() });
  localStorage.setItem('vv_pedidos_offline', JSON.stringify(pendientes));
}

function limpiarCamposPago() {
  ['buyerNombre','buyerApellido','buyerEmail','buyerTel','buyerDir'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

/* ══ MODALES ══ */
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') ['payModal', 'registerModal'].forEach(id => closeModal(id));
});

/* ══ REGISTRO DE CLIENTE
   Envía los datos al backend → aparece en la tabla de Clientes del admin.
══ */
function togglePet(btn) { btn.classList.toggle('selected'); }
function toggleCheck(row) {
  const c = row.querySelector('.custom-check');
  const chk = c.classList.toggle('checked');
  c.textContent = chk ? '✓' : '';
}

async function submitRegister() {
  const nombre   = document.getElementById('regNombre')?.value.trim();
  const apellido = document.getElementById('regApellido')?.value.trim() || '';
  const email    = document.getElementById('regEmail')?.value.trim();
  const password = document.getElementById('regPass')?.value;

  if (!nombre || !email || !password) {
    showToast('⚠️ Completá nombre, email y contraseña');
    return;
  }
  if (password.length < 8) {
    showToast('⚠️ La contraseña debe tener al menos 8 caracteres');
    return;
  }

  // Botón de carga
  const btn = document.querySelector('.register-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Creando cuenta…'; }

  // Preferencias de notificación
  const rows = document.querySelectorAll('.check-row');
  const notif_ofertas    = rows[0]?.querySelector('.custom-check')?.classList.contains('checked') ?? true;
  const notif_novedades  = rows[1]?.querySelector('.custom-check')?.classList.contains('checked') ?? true;
  const notif_pedidos    = rows[2]?.querySelector('.custom-check')?.classList.contains('checked') ?? false;
  const notif_newsletter = rows[3]?.querySelector('.custom-check')?.classList.contains('checked') ?? false;

  const payload = {
    nombre, apellido, email,
    notif_ofertas, notif_novedades, notif_pedidos, notif_newsletter,
  };

  // ── Llamar al backend ──
  const result = await VetAPI.registrarCliente(payload);
  if (btn) { btn.disabled = false; btn.textContent = 'Crear mi cuenta →'; }

  if (result.ok) {
    closeModal('registerModal');
    showToast(`🎉 ¡Bienvenido/a, ${nombre}! Revisá tu email 📧`);
    limpiarFormularioRegistro();
  } else if (result.offline) {
    // Sin servidor: igual damos la bienvenida y guardamos localmente
    closeModal('registerModal');
    showToast(`🎉 ¡Bienvenido/a, ${nombre}! Revisá tu email 📧`);
    localStorage.setItem('vv_cliente_offline', JSON.stringify({ ...payload, guardadoEn: new Date().toISOString() }));
    limpiarFormularioRegistro();
  } else if (result.status === 409) {
    showToast('⚠️ Ya existe una cuenta con ese email');
  } else {
    showToast(`⚠️ ${result.data.error || 'Error al registrarse. Intentá de nuevo.'}`);
  }
}

function limpiarFormularioRegistro() {
  ['regNombre','regApellido','regEmail','regPass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.querySelectorAll('.pet-check-btn').forEach(b => b.classList.remove('selected'));
}

/* ══ TOAST ══ */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

/* ══ FECHA MÍNIMA ══ */
function setMinDate() {
  const dateInput = document.getElementById('f-fecha');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
  }
}