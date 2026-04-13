/* ══════════════════════════════
   1. CURSOR PERSONALIZADO
   ══════════════════════════════
   El cursor principal sigue exactamente al mouse.
   El anillo exterior va con un pequeño retraso (efecto lag).
*/
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');

let mouseX = 0, mouseY = 0;   // Posición real del mouse
let ringX  = 0, ringY  = 0;   // Posición interpolada del anillo

// Actualiza la posición del mouse en cada movimiento
document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Animación continua del cursor (suavizado del anillo)
function animateCursor() {
  // El cursor pequeño sigue al mouse directamente
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';

  // El anillo grande va con inercia (interpolación lineal)
  ringX += (mouseX - ringX) * 0.14;
  ringY += (mouseY - ringY) * 0.14;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';

  requestAnimationFrame(animateCursor);
}

animateCursor();


/* ══════════════════════════════
   2. NAVBAR (EFECTO SCROLL)
   ══════════════════════════════
   Agrega la clase "scrolled" cuando el usuario
   baja más de 40px, achicando el padding del nav.
*/
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});


/* ══════════════════════════════
   3. GRILLA DE PUNTOS DECORATIVA
   ══════════════════════════════
   Genera 36 puntos pequeños en el panel derecho del hero.
   Podés cambiar la cantidad modificando el número en el loop.
*/
const dotsGrid = document.getElementById('dotsGrid');

for (let i = 0; i < 36; i++) {
  const dot = document.createElement('div');
  dot.className = 'dot';
  dotsGrid.appendChild(dot);
}


/* ══════════════════════════════
   4. CONTADORES ANIMADOS
   ══════════════════════════════
   Anima el número de 0 hasta el valor final (data-target).
   Usa easing cúbico para un movimiento más natural.

   Para cambiar un contador: modificá el atributo
   data-target en el HTML del elemento .stat-num
*/
function animateCounter(element) {
  const target   = parseInt(element.dataset.target);
  const duration = 1800; // duración en milisegundos
  let startTime  = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;

    const elapsed  = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing: ease-out cúbico (empieza rápido, frena al final)
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);

    // Agrega '+' o '%' solo al terminar
    element.textContent = current.toLocaleString('es-AR') + (progress === 1 ? '+' : '');

    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}


/* ══════════════════════════════
   5. SCROLL REVEAL
   ══════════════════════════════
   Observa los elementos con clase "reveal".
   Cuando entran al viewport, les agrega "visible"
   (que en CSS los hace aparecer con fade + slide up).

   Para agregar el efecto a un nuevo elemento,
   simplemente dale la clase "reveal" en el HTML.
*/
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // Si el elemento tiene contadores, los activa
        const counters = entry.target.querySelectorAll('[data-target]');
        counters.forEach(animateCounter);

        // Deja de observar una vez que apareció
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 } // Se activa cuando el 15% del elemento es visible
);

// Registra todos los elementos con clase "reveal"
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


// Observador separado para los contadores del hero
// (que no tienen clase "reveal" pero sí data-target)
const heroContent = document.querySelector('.hero-content');
if (heroContent) {
  const heroCounterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('[data-target]').forEach(animateCounter);
          heroCounterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  heroCounterObserver.observe(heroContent);
}


/* ══════════════════════════════
   6. PARALLAX EN TEXTO DEL HERO
   ══════════════════════════════
   El texto gigante de fondo ("VET") se mueve
   más lento que el scroll, creando profundidad.
   Ajustá el multiplicador (0.3) para más/menos efecto.
*/
window.addEventListener('scroll', () => {
  const bgText = document.querySelector('.hero-bg-text');
  if (bgText) {
    bgText.style.transform = `translateY(${window.scrollY * 0.3}px)`;
  }
});


/* ══════════════════════════════
   7. FECHA MÍNIMA EN FORMULARIO
   ══════════════════════════════
   Impide seleccionar fechas pasadas o el día de hoy
   (mínimo: mañana).
*/
const dateInput = document.getElementById('f-fecha');
if (dateInput) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = tomorrow.toISOString().split('T')[0];
}


/* ══════════════════════════════
   8. ENVÍO DEL FORMULARIO
   ══════════════════════════════
   Valida que todos los campos obligatorios estén
   completos antes de mostrar la confirmación.
   
   CAMPOS OBLIGATORIOS:
   - Nombre (#f-nombre)
   - Teléfono (#f-tel)
   - Mascota (#f-mascota)
   - Especie (#f-especie)
   - Servicio (#f-servicio)
   - Fecha (#f-fecha)
   - Horario (#f-horario)

   Para conectar con un backend real, reemplazá el
   bloque de "Simulación de éxito" por un fetch() o
   una llamada a tu API.
*/
async function submitForm() {
  // ── Recolectar valores ──
  const nombre      = document.getElementById('f-nombre').value.trim();
  const tel         = document.getElementById('f-tel').value.trim();
  const mascota     = document.getElementById('f-mascota').value.trim();
  const especie     = document.getElementById('f-especie').value;
  const servicio    = document.getElementById('f-servicio').value;
  const fecha       = document.getElementById('f-fecha').value;
  const horario     = document.getElementById('f-horario').value;
  const comentarios = document.getElementById('f-comentarios')?.value.trim() || '';

  // ── Validación ──
  if (!nombre || !tel || !mascota || !especie || !servicio || !fecha || !horario) {
    showToast('⚠️ Por favor completá todos los campos', 'error');
    return;
  }

  // ── Deshabilitar botón mientras se envía ──
  const btn = document.querySelector('.btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

  // Mapear servicio al enum del backend
  const servicioMap = {
    'Consulta general':       'consulta-general',
    'Vacunación':             'vacunacion',
    'Laboratorio':            'laboratorio',
    'Cirugía':                'cirugia',
    'Diagnóstico por imagen': 'imagen',
    'Estética':               'estetica',
  };

  // Normalizar hora: "09:00 - 10:00" → "09:00:00"
  let horaFinal = horario.split(' - ')[0].trim();
  if (horaFinal.split(':').length === 2) horaFinal += ':00';

  const payload = {
    cliente_nombre: nombre,
    cliente_tel:    tel,
    mascota_nombre: mascota,
    especie:        especie.toLowerCase(),
    servicio:       servicioMap[servicio] || 'consulta-general',
    fecha,
    hora:           horaFinal,
    comentarios,
  };

  console.log('[VetVida] Enviando turno:', payload);

  // ── Enviar al backend ──
  const result = await VetAPI.crearTurno(payload);

  if (btn) { btn.disabled = false; btn.textContent = 'Reservar turno →'; }

  console.log('[VetVida] Respuesta del servidor:', result);

  if (result.ok) {
    showToast(`🐾 ¡Turno #${result.data.turno_id} reservado! Te confirmamos pronto, ${nombre}.`, 'success');
    limpiarFormulario();
  } else if (result.offline) {
    // Sin servidor: guardar localmente con aviso claro
    guardarTurnoLocal(payload);
    showToast('⚠️ Sin conexión al servidor. El turno se guardó localmente — iniciá el backend con "npm run dev".', 'error');
  } else {
    showToast(`⚠️ ${result.data.error || 'Error al reservar. Revisá la consola.'}`, 'error');
  }
}

/* Guarda el turno en localStorage si el servidor no está disponible */
function guardarTurnoLocal(payload) {
  const pendientes = JSON.parse(localStorage.getItem('vv_turnos_pendientes') || '[]');
  pendientes.push({ ...payload, guardadoEn: new Date().toISOString() });
  localStorage.setItem('vv_turnos_pendientes', JSON.stringify(pendientes));
}


/* Muestra el toast de notificación
   tipo: 'success' (verde) o 'error' (terracotta)
*/
function showToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');

  toast.textContent = mensaje;
  toast.style.background = tipo === 'error' ? '#C4714A' : '';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    // Restaura el color original después de la animación de salida
    setTimeout(() => { toast.style.background = ''; }, 400);
  }, 3500);
}


/* Limpia todos los campos del formulario */
function limpiarFormulario() {
  const camposTexto = ['f-nombre', 'f-tel', 'f-mascota', 'f-comentarios'];
  const camposSelect = ['f-especie', 'f-servicio', 'f-fecha', 'f-horario'];

  camposTexto.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  camposSelect.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}