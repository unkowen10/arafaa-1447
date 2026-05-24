/* Arafah 1447 / 2026 - Helper Script */
(function(){
  'use strict';

  // =========================
  // 1. Countdown to Arafah
  // =========================
  // Astronomical Arafah for Egypt/Cairo: 26 May 2026 (9 Dhu al-Hijjah 1447)
  // Countdown to midnight start of that day in Cairo timezone (UTC+3)
  const ARAFAH_START = new Date('2026-05-26T00:00:00+03:00');

  function updateCountdown(){
    const now = new Date();
    const diff = ARAFAH_START - now;
    const elDays = document.getElementById('cd-days');
    const elHours = document.getElementById('cd-hours');
    const elMinutes = document.getElementById('cd-minutes');
    const elSeconds = document.getElementById('cd-seconds');
    if (!elDays && !elHours) return; // not on this page
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
    // Use Intl to format for Cairo timezone
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: CAIRO_TZ,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch(e) {
      // fallback to simple offset +3 (EEST) for May
      const utc = date.getTime() + (date.getTimezoneOffset()*60000);
      const cairo = new Date(utc + (3*60*60*1000));
      return String(cairo.getHours()).padStart(2,'0') + ':' + String(cairo.getMinutes()).padStart(2,'0');
    }
  }

  function getArafahPrayerTimes(){
    const target = new Date('2026-05-26T12:00:00+03:00'); // noon Cairo time
    if (typeof adhan !== 'undefined' && adhan.CalculationMethod) {
      try {
        const coords = new adhan.Coordinates(CAIRO.lat, CAIRO.lng);
        // Egyptian General Authority of Survey
        const params = adhan.CalculationMethod.Egyptian();
        const date = new adhan.DateUtils(target);
        const prayers = new adhan.PrayerTimes(coords, date, params);
        return {
          fajr: prayers.fajr,
          sunrise: prayers.sunrise,
          dhuhr: prayers.dhuhr,
          asr: prayers.asr,
          maghrib: prayers.maghrib,
          isha: prayers.isha
        };
      } catch(e) { console.warn('Adhan error', e); }
    }
    // Fallback static approximate times for Cairo 26 May (EEST)
    // These are rough estimates based on Cairo summer schedule
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
    // Determine current prayer in Cairo for highlighting
    const now = new Date();
    // Convert now to Cairo time for comparison
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
      // Find last passed prayer
      const order = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
      for (let i=order.length-1;i>=0;i--){
        if (cairoNowMin >= mins[order[i]]) { currentKey = order[i]; break; }
      }
    } catch(e) { /* ignore highlight if fails */ }

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
      // tag color
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
    saveCounters();
    updateCounterUI();
  };
  window.dec = function(key){
    COUNTERS[key] = Math.max(0, (COUNTERS[key] || 0) - 1);
    saveCounters();
    updateCounterUI();
  };
  window.resetCounter = function(key){
    if (confirm('هل تريد تصفير العداد؟')) {
      COUNTERS[key] = 0;
      saveCounters();
      updateCounterUI();
    }
  };

  // =========================
  // 4. Checklists (localStorage)
  // =========================
  function restoreCheckboxes(){
    document.querySelectorAll('input[type="checkbox"]').forEach(ch=>{
      const id = ch.dataset.id || ch.getAttribute('data-id');
      if (!id) return;
      const v = localStorage.getItem(STORAGE_PREFIX + 'chk_' + id);
      if (v !== null) ch.checked = (v==='1');
      // visual parent
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
  window.toggleCheck = function(el){
    const ch = el.querySelector('input[type="checkbox"]');
    if (!ch) return;
    ch.checked = !ch.checked;
    el.classList.toggle('checked', ch.checked);
    saveCheckbox(ch);
  };
  window.toggleGoal = function(el){
    const ch = el.querySelector('input[type="checkbox"]');
    if (!ch) return;
    ch.checked = !ch.checked;
    el.classList.toggle('checked', ch.checked);
    saveCheckbox(ch);
  };

  // Attach listeners for inline checkboxes too
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
      // fallback
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
  // 9. Print checks: keep state in print
  // =========================
  document.querySelectorAll('.print-check').forEach(ch=>{
    ch.addEventListener('change', ()=>{
      // No localStorage for print-only, but keep visual
    });
  });

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

    // Open first accordion on duas page
    const firstAcc = document.querySelector('.accordion-header');
    if (firstAcc && !firstAcc.classList.contains('open')) {
      // Leave closed by default, user can open
    }
  });

})();
