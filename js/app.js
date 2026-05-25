/* Arafah 1447 / 2026 - Helper Script */
(function(){
  'use strict';

  // =========================
  // 1. Countdown to Arafah
  // =========================
  // Astronomical Arafah for Egypt/Cairo: 26 May 2026 (9 Dhu al-Hijjah 1447)
  const ARAFAH_START = new Date('2026-05-26T00:00:00+03:00');

  function updateCountdown(){
    const now = new Date();
    const diff = ARAFAH_START - now;
    const elDays = document.getElementById('cd-days');
    const elHours = document.getElementById('cd-hours');
    const elMinutes = document.getElementById('cd-minutes');
    const elSeconds = document.getElementById('cd-seconds');
    if (!elDays && !elHours) return;
    if (diff <= 0) {
      if(elDays) elDays.textContent = '0';
      if(elHours) elHours.textContent = '00';
      if(elMinutes) elMinutes.textContent = '00';
      if(elSeconds) elSeconds.textContent = '00';
      const hero = document.querySelector('.hero');
      if (hero && !document.getElementById('arafah-msg')) {
        const msg = document.createElement('div');
        msg.id = 'arafah-msg';
        msg.style.cssText = 'margin-top:1rem; padding:1rem; border-radius:12px; background:rgba(45,106,79,0.25); border:1px solid var(--green-light); color:#b7e4c7; font-weight:700;';
        msg.textContent = '✨ اليوم هو يوم عرفة! اللهم تقبل منا ومن جميع المسلمين. اجعله سبباً في العتق من النار.';
        hero.appendChild(msg);
      }
      return;
    }
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    if(elDays) elDays.textContent = String(d);
    if(elHours) elHours.textContent = String(h).padStart(2,'0');
    if(elMinutes) elMinutes.textContent = String(m).padStart(2,'0');
    if(elSeconds) elSeconds.textContent = String(s).padStart(2,'0');
  }

  // =========================
  // 2. Prayer Times (Cairo, Summer Time EEST UTC+3)
  // =========================
  const CAIRO = { lat: 30.0444, lng: 31.2357 };
  const CAIRO_TZ = 'Africa/Cairo';

  function formatTimeCairo(date){
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: CAIRO_TZ,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch(e) {
      const utc = date.getTime() + (date.getTimezoneOffset()*60000);
      const cairo = new Date(utc + (3*60*60*1000));
      return String(cairo.getHours()).padStart(2,'0') + ':' + String(cairo.getMinutes()).padStart(2,'0');
    }
  }

  function getArafahPrayerTimes(){
    const target = new Date('2026-05-26T12:00:00+03:00');
    if (typeof adhan !== 'undefined' && adhan.CalculationMethod) {
      try {
        const coords = new adhan.Coordinates(CAIRO.lat, CAIRO.lng);
        const params = adhan.CalculationMethod.Egyptian();
        const date = new adhan.DateUtils(target);
        const prayers = new adhan.PrayerTimes(coords, date, params);
        return {
          fajr: prayers.fajr, sunrise: prayers.sunrise, dhuhr: prayers.dhuhr,
          asr: prayers.asr, maghrib: prayers.maghrib, isha: prayers.isha
        };
      } catch(e) { console.warn('Adhan error', e); }
    }
    return {
      fajr: new Date('2026-05-26T03:30:00+03:00'),
      sunrise: new Date('2026-05-26T05:00:00+03:00'),
      dhuhr: new Date('2026-05-26T11:53:00+03:00'),
      asr: new Date('2026-05-26T15:29:00+03:00'),
      maghrib: new Date('2026-05-26T18:32:00+03:00'),
      isha: new Date('2026-05-26T20:02:00+03:00')
    };
  }

  function renderPrayerTimes(){
    const grid = document.getElementById('prayerGrid');
    if (!grid) return;
    const times = getArafahPrayerTimes();
    const names = {
      fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر',
      asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء'
    };
    const now = new Date();
    let currentKey = '';
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: CAIRO_TZ, hour:'numeric', minute:'numeric', second:'numeric', hour12:false
      }).formatToParts(now);
      const get = (t) => parseInt(parts.find(p=>p.type===t)?.value||0,10);
      const cairoNowMin = get('hour')*60 + get('minute');
      const mins = {};
      for (const k of Object.keys(names)) {
        const d = new Date(times[k]);
        mins[k] = (d.getHours()*60 + d.getMinutes());
      }
      const order = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
      for (let i=order.length-1;i>=0;i--){
        if (cairoNowMin >= mins[order[i]]) { currentKey = order[i]; break; }
      }
    } catch(e) {}

    grid.innerHTML = '';
    for (const key of ['fajr','sunrise','dhuhr','asr','maghrib','isha']){
      const t = times[key];
      const timeStr = formatTimeCairo(t);
      const box = document.createElement('div');
      box.className = 'prayer-box' + (key===currentKey ? ' active' : '');
      box.innerHTML = `<div class="prayer-name">${names[key]}</div><div class="prayer-time">${timeStr}</div>`;
      grid.appendChild(box);
    }
  }

  // =========================
  // 3. Counters (localStorage)
  // =========================
  const STORAGE_PREFIX = 'arafah1447_';
  const COUNTERS = { tahlil: 0, salah: 0, istighfar: 0, quran: 0 };

  function loadCounters(){
    for (const k in COUNTERS){
      const v = localStorage.getItem(STORAGE_PREFIX + 'cnt_' + k);
      COUNTERS[k] = v ? parseInt(v,10) : 0;
    }
    updateCounterUI();
  }
  function saveCounters(){
    for (const k in COUNTERS){
      localStorage.setItem(STORAGE_PREFIX + 'cnt_' + k, String(COUNTERS[k]));
    }
  }
  function updateCounterUI(){
    for (const k in COUNTERS){
      const el = document.getElementById('c-'+k);
      if (el) el.textContent = String(COUNTERS[k]);
      const tag = document.getElementById('t-'+k);
      if (tag){
        const goals = { tahlil:1000, salah:500, istighfar:1000, quran:30 };
        if (COUNTERS[k] >= goals[k]) tag.className = 'tag tag-gold';
        else tag.className = 'tag tag-green';
      }
    }
  }
  window.inc = function(key){
    COUNTERS[key] = (COUNTERS[key] || 0) + 1;
    saveCounters(); updateCounterUI();
  };
  window.dec = function(key){
    COUNTERS[key] = Math.max(0, (COUNTERS[key] || 0) - 1);
    saveCounters(); updateCounterUI();
  };
  window.resetCounter = function(key){
    if (confirm('هل تريد تصفير العداد؟')) {
      COUNTERS[key] = 0; saveCounters(); updateCounterUI();
    }
  };

  // =========================
  // 4. Checklists
  // =========================
  function restoreCheckboxes(){
    document.querySelectorAll('input[type="checkbox"]').forEach(ch=>{
      const id = ch.dataset.id || ch.getAttribute('data-id');
      if (!id) return;
      const v = localStorage.getItem(STORAGE_PREFIX + 'chk_' + id);
      if (v !== null) ch.checked = (v==='1');
      const item = ch.closest('.checklist-item');
      if (item) item.classList.toggle('checked', ch.checked);
    });
  }
  function saveCheckbox(ch){
    const id = ch.dataset.id || ch.getAttribute('data-id');
    if (!id) return;
    localStorage.setItem(STORAGE_PREFIX + 'chk_' + id, ch.checked ? '1' : '0');
  }

  window.toggleQuick = function(el){
    const ch = el.querySelector('input[type="checkbox"]');
    if (!ch) return;
    ch.checked = !ch.checked;
    el.classList.toggle('checked', ch.checked);
    saveCheckbox(ch);
  };
  window.toggleCheck = window.toggleQuick;
  window.toggleGoal  = window.toggleQuick;

  document.addEventListener('change', function(e){
    const ch = e.target.closest('input[type="checkbox"]');
    if (ch && (ch.dataset.id || ch.getAttribute('data-id'))){
      saveCheckbox(ch);
      const item = ch.closest('.checklist-item');
      if (item) item.classList.toggle('checked', ch.checked);
    }
  });

  // =========================
  // 5. Accordion
  // =========================
  window.toggleAccordion = function(header){
    header.classList.toggle('open');
    const body = header.nextElementSibling;
    if (body) body.classList.toggle('open');
  };

  // =========================
  // 6. Copy Dua
  // =========================
  window.copyDua = function(btn){
    const item = btn.closest('.dua-item');
    const textEl = item.querySelector('.dua-text');
    if (!textEl) return;
    const text = textEl.textContent.trim();
    navigator.clipboard.writeText(text).then(()=>{
      const old = btn.textContent;
      btn.textContent = '✓ تم النسخ';
      btn.style.borderColor = 'var(--green-light)';
      btn.style.color = 'var(--green-light)';
      setTimeout(()=>{ btn.textContent = old; btn.style.borderColor=''; btn.style.color=''; }, 1500);
    }).catch(()=>{
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      const old = btn.textContent; btn.textContent='✓ تم النسخ'; setTimeout(()=>btn.textContent=old,1500);
    });
  };

  // =========================
  // 7. Active nav
  // =========================
  function setActiveNav(){
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav .nav-link').forEach(a=>{
      a.classList.toggle('active', a.getAttribute('href')===path);
    });
  }

  // =========================
  // 8. Service Worker (PWA)
  // =========================
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }

  // =========================
  // 9. ✦ Install PWA Button (زر التثبيت الدائم)
  // =========================
  // الفكرة:
  // - زر عائم يظهر دائماً في كل الصفحات تلقائياً
  // - لا يختفي إلا بعد التثبيت الفعلي (display-mode: standalone)
  //   أو حدث appinstalled (لكروم/أندرويد).
  // - على Safari/iOS (لا يوجد beforeinstallprompt) يفتح نافذة بتعليمات
  //   "أضف إلى الشاشة الرئيسية".
  // - الحالة محفوظة في localStorage احتياطاً.

  let deferredInstallPrompt = null;
  const INSTALLED_KEY = STORAGE_PREFIX + 'pwa_installed';

  function isStandalone(){
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
        || window.navigator.standalone === true
        || document.referrer.startsWith('android-app://');
  }

  function isAlreadyInstalled(){
    return isStandalone() || localStorage.getItem(INSTALLED_KEY) === '1';
  }

  function isIOS(){
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }
  function isIOSSafari(){
    const ua = navigator.userAgent;
    return isIOS() && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  }

  function buildInstallUI(){
    // لا نُنشئ الزر إذا كان مثبتاً
    if (isAlreadyInstalled()) return;
    if (document.getElementById('pwaInstallBtn')) return;

    // الزر العائم
    const btn = document.createElement('button');
    btn.id = 'pwaInstallBtn';
    btn.className = 'pwa-install-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'تثبيت التطبيق');
    btn.innerHTML = `
      <span class="pwa-install-icon" aria-hidden="true">⬇</span>
      <span class="pwa-install-text">ثبّت التطبيق</span>
    `;
    btn.addEventListener('click', onInstallClick);
    document.body.appendChild(btn);

    // النافذة (modal) لتعليمات iOS وكأي fallback
    const modal = document.createElement('div');
    modal.id = 'pwaInstallModal';
    modal.className = 'pwa-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="pwa-modal-backdrop" data-close="1"></div>
      <div class="pwa-modal-card" role="document">
        <button class="pwa-modal-close" type="button" aria-label="إغلاق" data-close="1">×</button>
        <div class="pwa-modal-title">📲 ثبّت التطبيق على جهازك</div>
        <div class="pwa-modal-body" id="pwaModalBody">
          <!-- يُحقن بحسب نوع الجهاز -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e)=>{
      if (e.target.dataset.close === '1') closeModal();
    });
    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModalForIOS(){
    const body = document.getElementById('pwaModalBody');
    if (!body) return;
    body.innerHTML = `
      <p>لتثبيت الموقع كتطبيق على شاشتك الرئيسية على <strong>iPhone/iPad</strong> اتّبع الخطوات:</p>
      <ol class="pwa-steps">
        <li>اضغط على زر <strong>المشاركة</strong>
          <span class="pwa-ios-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M8 8l4-4 4 4"/><path d="M20 16v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4"/></svg>
          </span>
          أسفل الشاشة في Safari.
        </li>
        <li>اختر «<strong>أضف إلى الشاشة الرئيسية</strong>» (Add to Home Screen).</li>
        <li>اضغط «<strong>إضافة</strong>» في الأعلى.</li>
      </ol>
      <p class="pwa-note">⚠️ يجب استخدام متصفح <strong>Safari</strong> وليس Chrome على iPhone.</p>
      <button class="btn btn-outline pwa-btn-done" type="button" data-close="1">حسناً، فهمت</button>
    `;
    openModal();
  }

  function openModalForGenericFallback(){
    const body = document.getElementById('pwaModalBody');
    if (!body) return;
    body.innerHTML = `
      <p>لتثبيت الموقع كتطبيق:</p>
      <ol class="pwa-steps">
        <li>افتح قائمة المتصفح <strong>⋮</strong> (الثلاث نقاط).</li>
        <li>اختر «<strong>تثبيت التطبيق</strong>» أو «<strong>إضافة إلى الشاشة الرئيسية</strong>».</li>
        <li>أكّد الإضافة.</li>
      </ol>
      <p class="pwa-note">إن لم تجد الخيار، تأكد من أنك تستخدم Chrome أو Edge أو متصفحاً يدعم PWA.</p>
      <button class="btn btn-outline pwa-btn-done" type="button" data-close="1">حسناً</button>
    `;
    openModal();
  }

  function openModal(){
    const m = document.getElementById('pwaInstallModal');
    if (!m) return;
    m.classList.add('open');
    m.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    const m = document.getElementById('pwaInstallModal');
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  async function onInstallClick(){
    // إذا كان لدينا حدث محفوظ (Chrome/Edge/Android) → عرض نافذة النظام مباشرة
    if (deferredInstallPrompt){
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted'){
          markInstalled();
        }
        // لا نلغي deferredInstallPrompt حتى لو رفض، حتى يستطيع الضغط مرة ثانية
        // لكن Chrome يستهلكه مرة واحدة، فنفرّغه:
        deferredInstallPrompt = null;
        // لو رفض المستخدم، يبقى الزر ظاهراً (لن نخفيه)
      } catch(e){
        console.warn('Install prompt failed', e);
        openModalForGenericFallback();
      }
      return;
    }

    // لا يوجد حدث: على iOS اعرض شرح Safari, وإلا اعرض fallback
    if (isIOS()){
      openModalForIOS();
    } else {
      openModalForGenericFallback();
    }
  }

  function markInstalled(){
    localStorage.setItem(INSTALLED_KEY, '1');
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) btn.remove();
    const modal = document.getElementById('pwaInstallModal');
    if (modal) modal.remove();
  }

  // التقاط حدث beforeinstallprompt قبل أن يفقده المتصفح
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredInstallPrompt = e;
    // الزر موجود أصلاً، فقط نتأكد من ظهوره
    if (!document.getElementById('pwaInstallBtn') && !isAlreadyInstalled()){
      buildInstallUI();
    }
  });

  // عند التثبيت الفعلي
  window.addEventListener('appinstalled', ()=>{
    markInstalled();
  });

  // لو تم فتح الموقع في وضع تطبيق (standalone) لاحقاً نختفي
  if (window.matchMedia){
    try {
      window.matchMedia('(display-mode: standalone)').addEventListener('change', (e)=>{
        if (e.matches) markInstalled();
      });
    } catch(_){}
  }

  // =========================
  // Init
  // =========================
  document.addEventListener('DOMContentLoaded', function(){
    updateCountdown();
    setInterval(updateCountdown, 1000);
    renderPrayerTimes();
    loadCounters();
    restoreCheckboxes();
    setActiveNav();
    buildInstallUI();
  });

})();
