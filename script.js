(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var state = { name: '', date: null, place: '', phone: '' };

  /* ---------- قراءة t.txt ----------
     السطر الأول = اسم الطالبة
     أسطر اختيارية بصيغة  مفتاح: قيمة
       date / التاريخ : 2026-12-20 18:00
       place / المكان : قاعة ...
       phone / رقم    : 9647XXXXXXXXX
  */
  function parseInfo(text) {
    var lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var info = { name: '', date: '', place: '', phone: '' };
    var keys = {
      date: ['date', 'التاريخ', 'الموعد'],
      place: ['place', 'location', 'المكان', 'الموقع'],
      phone: ['phone', 'whatsapp', 'رقم', 'الهاتف', 'واتساب']
    };
    lines.forEach(function (line, i) {
      var m = line.match(/^([^:=：]+)\s*[:=：]\s*(.+)$/);
      if (m) {
        var k = m[1].trim().toLowerCase();
        for (var f in keys) {
          if (keys[f].indexOf(k) !== -1) { info[f] = m[2].trim(); return; }
        }
        if (['name', 'الاسم'].indexOf(k) !== -1) { info.name = m[2].trim(); return; }
      }
      if (i === 0 && !info.name) info.name = line;
    });
    return info;
  }

  function applyInfo(info) {
    if (info.name) {
      state.name = info.name;
      $('gradName').textContent = info.name;
      document.title = 'دعوة حفل السكراب | ' + info.name;
    } else {
      $('gradName').textContent = 'اسم الطالبة';
    }

    if (info.place) { state.place = info.place; $('dPlace').textContent = info.place; }

    if (info.date) {
      var d = new Date(info.date.replace(' ', 'T'));
      if (!isNaN(d)) {
        state.date = d;
        $('dDate').textContent = d.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        var hasTime = /\d{1,2}:\d{2}/.test(info.date);
        if (hasTime) {
          $('dTime').textContent = d.toLocaleTimeString('ar-IQ', { hour: 'numeric', minute: '2-digit' });
        }
        $('countWrap').hidden = false;
        $('calBtn').hidden = false;
        startCountdown();
      } else {
        $('dDate').textContent = info.date;
      }
    }

    if (info.phone) {
      var num = info.phone.replace(/[^\d]/g, '');
      if (num) {
        state.phone = num;
        var msg = encodeURIComponent('السلام عليكم، أؤكد حضوري لحفل السكراب الخاص بـ ' + (state.name || '') + ' 💙');
        var a = $('rsvpBtn');
        a.href = 'https://wa.me/' + num + '?text=' + msg;
        a.hidden = false;
      }
    }
  }

  /* القيم الافتراضية داخل الدعوة (ملف t.txt و b.jpg يغيّرونها إذا انضافوا) */
  var DEFAULTS = {
    name: 'وسن سامر خزعل',
    date: '2026-12-12 09:00',
    place: '',
    phone: ''
  };
  applyInfo(DEFAULTS);

  (function () {
    var probe = new Image();
    probe.onload = function () { $('photo').src = 'b.jpg?v=' + Date.now(); $('photo').classList.remove('missing'); };
    probe.src = 'b.jpg?v=' + Date.now();
  })();

  fetch('t.txt', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('no file'); return r.arrayBuffer(); })
    .then(function (buf) { applyInfo(parseInfo(new TextDecoder('utf-8').decode(buf))); })
    .catch(function () {});

  /* ---------- العد التنازلي ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function startCountdown() {
    function tick() {
      var diff = state.date - new Date();
      if (diff < 0) diff = 0;
      var s = Math.floor(diff / 1000);
      $('cdD').textContent = pad(Math.floor(s / 86400));
      $('cdH').textContent = pad(Math.floor(s % 86400 / 3600));
      $('cdM').textContent = pad(Math.floor(s % 3600 / 60));
      $('cdS').textContent = pad(s % 60);
    }
    tick();
    clearInterval(startCountdown.t);
    startCountdown.t = setInterval(tick, 1000);
  }

  /* ---------- دخول + موسيقى ---------- */
  var gate = $('gate'), bgm = $('bgm'), musicBtn = $('musicBtn');
  document.body.classList.add('locked');
  bgm.volume = 0.7;

  function setPlaying(on) { musicBtn.classList.toggle('playing', on); }

  $('gateEcg').addEventListener('click', revive);
  function revive() {
    if (gate.classList.contains('alive')) return;
    gate.classList.add('alive');
    $('gateHint').textContent = 'تم استرجاع النبض ✔  اهلًا بكِ';
  }

  $('enterBtn').addEventListener('click', function () {
    revive();
    var p = bgm.play();
    if (p && p.then) {
      p.then(function () { setPlaying(true); }).catch(function () { setPlaying(false); });
    }
    musicBtn.hidden = false;
    setTimeout(function () {
      gate.classList.add('hide');
      document.body.classList.remove('locked');
      observe();
    }, 650);
  });

  musicBtn.addEventListener('click', function () {
    if (bgm.paused) { bgm.play(); setPlaying(true); }
    else { bgm.pause(); setPlaying(false); }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && !bgm.paused) { bgm.pause(); bgm.dataset.auto = '1'; setPlaying(false); }
    else if (!document.hidden && bgm.dataset.auto === '1') { bgm.play(); bgm.dataset.auto = ''; setPlaying(true); }
  });

  /* ---------- ظهور تدريجي ---------- */
  function observe() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (e, i) {
      e.style.transitionDelay = (e.closest('.hero') ? i * 0.12 : 0) + 's';
      io.observe(e);
    });
  }

  /* ---------- العلامات الحيوية ---------- */
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  setInterval(function () {
    $('vHr').textContent = rnd(92, 118);
    $('vCo').textContent = rnd(34, 37);
    $('vBis').textContent = rnd(97, 100);
  }, 1100);

  /* ---------- جزيئات ---------- */
  (function () {
    var box = $('particles');
    for (var i = 0; i < 22; i++) {
      var p = document.createElement('i');
      p.style.left = rnd(0, 100) + '%';
      p.style.animationDuration = rnd(9, 20) + 's';
      p.style.animationDelay = '-' + rnd(0, 18) + 's';
      var s = rnd(3, 8);
      p.style.width = p.style.height = s + 'px';
      box.appendChild(p);
    }
  })();

  /* ---------- فراشات تطير بالخلفية ---------- */
  (function () {
    var box = $('butterflies');
    if (!box) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var palette = [
      ['#ff7eb3', '#ffd3e4'], ['#ff5c9a', '#ffc2d8'], ['#f59ac0', '#fff0f6'],
      ['#e0457f', '#ffb3cf'], ['#ffa6c9', '#ffffff'], ['#d96aa7', '#ffe0ee']
    ];
    var wing =
      '<path d="M50 40 C58 4 98 0 95 30 C93 48 72 52 50 42Z"/>' +
      '<path d="M50 42 C70 50 90 55 83 72 C77 83 58 67 50 46Z"/>';
    var inner =
      '<path d="M54 38 C62 16 86 12 86 30 C85 40 70 43 54 40Z" fill="var(--c2)" opacity=".75"/>' +
      '<circle cx="76" cy="26" r="4" fill="#fff" opacity=".8"/>';
    function svg() {
      return '<svg viewBox="0 0 100 80" aria-hidden="true">' +
        '<g class="wl"><g transform="translate(100 0) scale(-1 1)"><g fill="var(--c1)">' + wing + '</g>' + inner + '</g></g>' +
        '<g class="wr"><g fill="var(--c1)">' + wing + '</g>' + inner + '</g>' +
        '<rect x="48" y="26" width="4" height="34" rx="2" fill="#7a2a50"/>' +
        '<path d="M49 27 C44 14 40 12 38 10 M51 27 C56 14 60 12 62 10" stroke="#7a2a50" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
        '</svg>';
    }
    var W = innerWidth, H = innerHeight;
    addEventListener('resize', function () { W = innerWidth; H = innerHeight; });
    var count = W < 600 ? 7 : 11;
    var list = [];
    for (var i = 0; i < count; i++) {
      var size = rnd(26, 62);
      var el = document.createElement('div');
      el.className = 'bf';
      var c = palette[i % palette.length];
      el.style.setProperty('--c1', c[0]);
      el.style.setProperty('--c2', c[1]);
      el.style.width = size + 'px';
      el.style.height = size * 0.8 + 'px';
      el.style.opacity = (0.5 + size / 62 * 0.4).toFixed(2);
      if (size < 34) el.style.filter = 'blur(.7px) drop-shadow(0 3px 6px rgba(224,69,127,.2))';
      el.style.animationDuration = '';
      el.innerHTML = svg();
      var fl = el.querySelectorAll('.wl,.wr');
      for (var k = 0; k < fl.length; k++) {
        fl[k].style.animationDuration = (0.38 + Math.random() * 0.35).toFixed(2) + 's';
        fl[k].style.animationDelay = '-' + (Math.random() * 0.6).toFixed(2) + 's';
      }
      box.appendChild(el);
      list.push({
        el: el, w: size, h: size * 0.8,
        x: Math.random() * W, y: Math.random() * H,
        a: Math.random() * Math.PI * 2,
        sp: 0.35 + Math.random() * 0.55,
        t: Math.random() * 100,
        wob: 0.6 + Math.random() * 1.2
      });
    }
    function place(b) {
      var deg = b.a * 180 / Math.PI + 90;
      b.el.style.transform = 'translate(' + (b.x - b.w / 2) + 'px,' + (b.y - b.h / 2) + 'px) rotate(' + deg + 'deg)';
    }
    list.forEach(place);
    if (reduce) return;
    var last = performance.now();
    function frame(now) {
      var dt = Math.min((now - last) / 16.7, 3); last = now;
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        b.t += 0.02 * dt;
        b.a += (Math.sin(b.t * b.wob) * 0.035 + Math.sin(b.t * 0.37 + i) * 0.015) * dt;
        var m = 70;
        if (b.x < -m) b.a = steer(b.a, 0);
        else if (b.x > W + m) b.a = steer(b.a, Math.PI);
        if (b.y < -m) b.a = steer(b.a, Math.PI / 2);
        else if (b.y > H + m) b.a = steer(b.a, -Math.PI / 2);
        b.x += Math.cos(b.a) * b.sp * dt * 1.6;
        b.y += Math.sin(b.a) * b.sp * dt * 1.6 + Math.sin(b.t * 3 + i) * 0.25 * dt;
        place(b);
      }
      requestAnimationFrame(frame);
    }
    function steer(a, target) {
      var d = Math.atan2(Math.sin(target - a), Math.cos(target - a));
      return a + d * 0.08;
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- إضافة للتقويم (.ics) ---------- */
  $('calBtn').addEventListener('click', function () {
    if (!state.date) return;
    function f(d) { return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; }
    var end = new Date(state.date.getTime() + 4 * 3600 * 1000);
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ScrubParty//AR',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@scrubparty',
      'DTSTAMP:' + f(new Date()),
      'DTSTART:' + f(state.date),
      'DTEND:' + f(end),
      'SUMMARY:حفل السكراب – ' + (state.name || ''),
      'LOCATION:' + (state.place || ''),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'scrub-party.ics';
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- مشاركة ---------- */
  $('shareBtn').addEventListener('click', function () {
    var data = { title: document.title, text: 'دعوة حفل السكراب 💙', url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); }
    else if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href).then(function () {
        var b = $('shareBtn'), t = b.textContent;
        b.textContent = 'تم نسخ الرابط ✔';
        setTimeout(function () { b.textContent = t; }, 1800);
      });
    }
  });
})();
