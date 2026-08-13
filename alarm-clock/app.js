(function () {
  'use strict';

  var STORAGE_KEY = 'reliableAlarmClock.alarms.v1';
  var WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'];

  /** @typedef {{id:string, time:string, label:string, days:number[], enabled:boolean, requireMath:boolean, snoozeLimit:number, _lastFiredKey:?string}} Alarm */

  /** @type {Alarm[]} */
  var alarms = loadAlarms();

  /** currently ringing / snoozing alarm session, or null */
  var activeSession = null; // {alarm, snoozeCount, snoozeUntil, isTest}

  var selectedDays = [];

  // ---------- persistence ----------
  function loadAlarms() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(function (a) {
        return {
          id: a.id,
          time: a.time,
          label: a.label || '',
          days: Array.isArray(a.days) ? a.days : [],
          enabled: !!a.enabled,
          requireMath: a.requireMath !== false,
          snoozeLimit: typeof a.snoozeLimit === 'number' ? a.snoozeLimit : 3,
          _lastFiredKey: null
        };
      });
    } catch (e) {
      return [];
    }
  }

  function saveAlarms() {
    var serializable = alarms.map(function (a) {
      return {
        id: a.id, time: a.time, label: a.label, days: a.days,
        enabled: a.enabled, requireMath: a.requireMath, snoozeLimit: a.snoozeLimit
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  }

  // ---------- utils ----------
  function pad(n) { return String(n).padStart(2, '0'); }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function nextOccurrence(alarm, now) {
    var parts = alarm.time.split(':').map(Number);
    for (var i = 0; i < 8; i++) {
      var d = new Date(now);
      d.setDate(d.getDate() + i);
      d.setHours(parts[0], parts[1], 0, 0);
      if (d <= now) continue;
      if (alarm.days.length > 0 && alarm.days.indexOf(d.getDay()) === -1) continue;
      return d;
    }
    return null;
  }

  // ---------- audio (Web Audio API siren, no external files) ----------
  var audioCtx = null;
  var oscNode = null, gainNode = null, sirenTimer = null, mediaDest = null;
  var audioSinkEl = document.getElementById('audioSink');

  function ensureAudioContext() {
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }
  // Unlock audio on the first user interaction so the alarm can play later
  // without needing a fresh gesture at the moment it fires. On iOS this also
  // primes the <audio> element used below to route sound around the silent switch.
  function unlockAudio() {
    ensureAudioContext();
    if (audioSinkEl && audioSinkEl.paused) {
      audioSinkEl.muted = true;
      var p = audioSinkEl.play();
      if (p && p.then) {
        p.then(function () { audioSinkEl.pause(); audioSinkEl.muted = false; }).catch(function () { audioSinkEl.muted = false; });
      }
    }
  }
  document.addEventListener('click', unlockAudio, { capture: true });
  document.addEventListener('touchstart', unlockAudio, { capture: true });

  function startAlarmSound() {
    var ctx = ensureAudioContext();
    if (!ctx) return;
    stopAlarmSound();

    gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);

    oscNode = ctx.createOscillator();
    oscNode.type = 'square';
    oscNode.frequency.setValueAtTime(440, ctx.currentTime);
    oscNode.connect(gainNode);

    // Route through a real <audio> element when possible. On iOS, sound played
    // via a media element is treated as "media playback" rather than "ambient"
    // audio, which is far more likely to still be audible even when the
    // phone's physical Ring/Silent switch is set to silent.
    if (audioSinkEl && ctx.createMediaStreamDestination) {
      mediaDest = ctx.createMediaStreamDestination();
      gainNode.connect(mediaDest);
      audioSinkEl.muted = false;
      audioSinkEl.srcObject = mediaDest.stream;
      var playPromise = audioSinkEl.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
    } else {
      gainNode.connect(ctx.destination);
    }

    oscNode.start();

    // Siren-style pitch sweep so it's harder to sleep through.
    var up = true;
    sirenTimer = setInterval(function () {
      if (!oscNode) return;
      var t = ctx.currentTime;
      oscNode.frequency.cancelScheduledValues(t);
      oscNode.frequency.setValueAtTime(oscNode.frequency.value, t);
      oscNode.frequency.linearRampToValueAtTime(up ? 880 : 440, t + 0.45);
      up = !up;
    }, 500);

    // Volume ramps up over 25s so it starts gentle but becomes loud and stays loud.
    gainNode.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 25);
  }

  function stopAlarmSound() {
    if (sirenTimer) { clearInterval(sirenTimer); sirenTimer = null; }
    if (oscNode) { try { oscNode.stop(); } catch (e) {} oscNode.disconnect(); oscNode = null; }
    if (gainNode) { gainNode.disconnect(); gainNode = null; }
    if (mediaDest) { mediaDest.disconnect(); mediaDest = null; }
    if (audioSinkEl) { try { audioSinkEl.pause(); } catch (e) {} audioSinkEl.srcObject = null; }
  }

  // ---------- wake lock (best-effort, keeps screen on while ringing) ----------
  var wakeLock = null;
  function requestWakeLock() {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(function (lock) {
        wakeLock = lock;
      }).catch(function () {});
    }
  }
  function releaseWakeLock() {
    if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
  }
  document.addEventListener('visibilitychange', function () {
    if (activeSession && !activeSession.snoozeUntil && document.visibilityState === 'visible') {
      requestWakeLock();
    }
  });

  // ---------- notifications (best-effort, for when the tab is backgrounded) ----------
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(function () {});
  }
  function notifyRinging(alarm) {
    if (!document.hidden) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('⏰ 起きる時間です！', {
          body: alarm.label ? alarm.label + '（' + alarm.time + '）' : alarm.time,
          tag: 'reliable-alarm-clock',
          requireInteraction: true
        });
      } catch (e) {}
    }
  }

  // ---------- DOM refs ----------
  var $ = function (id) { return document.getElementById(id); };
  var nowTimeEl = $('nowTime');
  var nowDateEl = $('nowDate');
  var nextAlarmBox = $('nextAlarmBox');
  var nextAlarmValue = $('nextAlarmValue');
  var alarmForm = $('alarmForm');
  var timeInput = $('timeInput');
  var labelInput = $('labelInput');
  var daysPicker = $('daysPicker');
  var mathToggle = $('mathToggle');
  var snoozeLimitInput = $('snoozeLimitInput');
  var alarmListEl = $('alarmList');
  var emptyMsg = $('emptyMsg');
  var testBtn = $('testBtn');

  var ringingOverlay = $('ringingOverlay');
  var ringingTimeEl = $('ringingTime');
  var ringingAlarmLabelEl = $('ringingAlarmLabel');
  var snoozeStatusEl = $('snoozeStatus');
  var snoozeBtn = $('snoozeBtn');
  var stopBtn = $('stopBtn');

  var mathModal = $('mathModal');
  var mathProgress = $('mathProgress');
  var mathQuestion = $('mathQuestion');
  var mathAnswer = $('mathAnswer');
  var mathSubmit = $('mathSubmit');
  var mathFeedback = $('mathFeedback');

  // ---------- clock ----------
  function renderClock() {
    var now = new Date();
    nowTimeEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
    nowDateEl.textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日（' + WEEKDAY_JA[now.getDay()] + '）';
    renderNextAlarm(now);
  }

  function renderNextAlarm(now) {
    var best = null;
    alarms.forEach(function (a) {
      if (!a.enabled) return;
      var occ = nextOccurrence(a, now);
      if (occ && (!best || occ < best.time)) best = { alarm: a, time: occ };
    });
    if (!best) { nextAlarmBox.hidden = true; return; }
    nextAlarmBox.hidden = false;
    var sameDay = best.time.toDateString() === now.toDateString();
    var prefix = sameDay ? '今日' : (best.time.getDate() === now.getDate() + 1 ? '明日' : (best.time.getMonth() + 1) + '/' + best.time.getDate());
    nextAlarmValue.textContent = prefix + ' ' + pad(best.time.getHours()) + ':' + pad(best.time.getMinutes()) + (best.alarm.label ? '（' + best.alarm.label + '）' : '');
  }

  // ---------- alarm list rendering ----------
  function renderAlarmList() {
    alarmListEl.innerHTML = '';
    emptyMsg.hidden = alarms.length > 0;
    alarms
      .slice()
      .sort(function (a, b) { return a.time.localeCompare(b.time); })
      .forEach(function (a) {
        var li = document.createElement('li');
        li.className = 'alarm-item' + (a.enabled ? '' : ' disabled');

        var main = document.createElement('div');
        main.className = 'alarm-main';
        var timeDiv = document.createElement('div');
        timeDiv.className = 'alarm-time';
        timeDiv.textContent = a.time;
        var metaDiv = document.createElement('div');
        metaDiv.className = 'alarm-meta';
        var dayText = a.days.length === 0
          ? '1回のみ'
          : a.days.slice().sort().map(function (d) { return WEEKDAY_JA[d]; }).join('');
        metaDiv.textContent = (a.label ? a.label + ' ・ ' : '') + dayText + (a.requireMath ? ' ・ 計算問題あり' : '');
        main.appendChild(timeDiv);
        main.appendChild(metaDiv);

        var controls = document.createElement('div');
        controls.className = 'alarm-controls';

        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'toggle' + (a.enabled ? ' on' : '');
        toggle.setAttribute('aria-label', 'アラームの有効/無効を切り替え');
        toggle.addEventListener('click', function () {
          a.enabled = !a.enabled;
          a._lastFiredKey = null;
          saveAlarms();
          renderAlarmList();
        });

        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'delete-btn';
        del.textContent = '✕';
        del.setAttribute('aria-label', '削除');
        del.addEventListener('click', function () {
          alarms = alarms.filter(function (x) { return x.id !== a.id; });
          saveAlarms();
          renderAlarmList();
        });

        controls.appendChild(toggle);
        controls.appendChild(del);

        li.appendChild(main);
        li.appendChild(controls);
        alarmListEl.appendChild(li);
      });
  }

  // ---------- add alarm form ----------
  daysPicker.querySelectorAll('.day-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var day = Number(btn.dataset.day);
      var idx = selectedDays.indexOf(day);
      if (idx === -1) { selectedDays.push(day); btn.classList.add('active'); }
      else { selectedDays.splice(idx, 1); btn.classList.remove('active'); }
    });
  });

  alarmForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!timeInput.value) return;
    var limit = Number(snoozeLimitInput.value);
    alarms.push({
      id: uid(),
      time: timeInput.value,
      label: labelInput.value.trim(),
      days: selectedDays.slice(),
      enabled: true,
      requireMath: mathToggle.checked,
      snoozeLimit: isNaN(limit) ? 3 : Math.max(0, limit),
      _lastFiredKey: null
    });
    saveAlarms();
    renderAlarmList();
    renderClock();
    alarmForm.reset();
    selectedDays = [];
    daysPicker.querySelectorAll('.day-btn.active').forEach(function (b) { b.classList.remove('active'); });
    mathToggle.checked = true;
    snoozeLimitInput.value = 3;
  });

  // ---------- ringing flow ----------
  function startRinging(alarm, session) {
    ringingTimeEl.textContent = pad(new Date().getHours()) + ':' + pad(new Date().getMinutes());
    ringingAlarmLabelEl.textContent = alarm.label || '';
    updateSnoozeStatus(alarm, session);
    ringingOverlay.hidden = false;
    startAlarmSound();
    requestWakeLock();
    notifyRinging(alarm);
    if (navigator.vibrate) {
      try { navigator.vibrate([500, 200, 500, 200, 500]); } catch (e) {}
    }
  }

  function updateSnoozeStatus(alarm, session) {
    var remaining = Math.max(0, alarm.snoozeLimit - session.snoozeCount);
    snoozeStatusEl.textContent = 'スヌーズ残り ' + remaining + ' 回';
    snoozeBtn.disabled = remaining <= 0;
    snoozeBtn.textContent = remaining <= 0 ? '😴 スヌーズ上限に達しました' : '😴 あと5分スヌーズ';
  }

  function fullyStop(session) {
    stopAlarmSound();
    releaseWakeLock();
    ringingOverlay.hidden = true;
    if (session.alarm.days.length === 0 && !session.isTest) {
      session.alarm.enabled = false; // one-shot alarms fire only once
      saveAlarms();
      renderAlarmList();
    }
    activeSession = null;
  }

  snoozeBtn.addEventListener('click', function () {
    if (!activeSession) return;
    var alarm = activeSession.alarm;
    if (activeSession.snoozeCount >= alarm.snoozeLimit) return;
    activeSession.snoozeCount += 1;
    activeSession.snoozeUntil = Date.now() + 5 * 60 * 1000;
    stopAlarmSound();
    releaseWakeLock();
    ringingOverlay.hidden = true;
  });

  stopBtn.addEventListener('click', function () {
    if (!activeSession) return;
    if (activeSession.alarm.requireMath) {
      openMathChallenge(activeSession);
    } else {
      fullyStop(activeSession);
    }
  });

  // ---------- math challenge ----------
  var mathState = null; // {level, index, total, session}

  function generateProblem(level) {
    if (level <= 1) {
      var a1 = randInt(3, 25), b1 = randInt(1, a1);
      var op1 = Math.random() < 0.5 ? '+' : '-';
      if (op1 === '+') return { q: a1 + ' + ' + b1, answer: a1 + b1 };
      return { q: a1 + ' - ' + b1, answer: a1 - b1 };
    }
    if (level === 2) {
      var a2 = randInt(15, 70), b2 = randInt(15, 70);
      if (Math.random() < 0.5) return { q: a2 + ' + ' + b2, answer: a2 + b2 };
      var hi = Math.max(a2, b2), lo = Math.min(a2, b2);
      return { q: hi + ' - ' + lo, answer: hi - lo };
    }
    var a3 = randInt(3, 12), b3 = randInt(3, 12);
    return { q: a3 + ' × ' + b3, answer: a3 * b3 };
  }

  function openMathChallenge(session) {
    var level = 1 + session.snoozeCount;
    mathState = { level: level, index: 0, total: 3, session: session, current: generateProblem(level) };
    mathFeedback.textContent = '';
    mathAnswer.value = '';
    renderMathQuestion();
    mathModal.hidden = false;
    setTimeout(function () { mathAnswer.focus(); }, 50);
  }

  function renderMathQuestion() {
    mathProgress.textContent = '問題 ' + (mathState.index + 1) + ' / ' + mathState.total;
    mathQuestion.textContent = mathState.current.q + ' = ?';
  }

  function submitMathAnswer() {
    if (!mathState) return;
    var val = Number(mathAnswer.value);
    if (mathAnswer.value.trim() === '' || isNaN(val)) {
      mathFeedback.textContent = '数字を入力してください';
      return;
    }
    if (val !== mathState.current.answer) {
      mathFeedback.textContent = '不正解！もう一度';
      mathAnswer.value = '';
      mathAnswer.focus();
      return;
    }
    mathFeedback.textContent = '';
    mathState.index += 1;
    if (mathState.index >= mathState.total) {
      var session = mathState.session;
      mathModal.hidden = true;
      mathState = null;
      fullyStop(session);
      return;
    }
    mathState.current = generateProblem(mathState.level);
    mathAnswer.value = '';
    renderMathQuestion();
  }

  mathSubmit.addEventListener('click', submitMathAnswer);
  mathAnswer.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); submitMathAnswer(); }
  });

  // ---------- test alarm ----------
  testBtn.addEventListener('click', function () {
    if (activeSession) return;
    var testAlarm = {
      id: 'test', time: pad(new Date().getHours()) + ':' + pad(new Date().getMinutes()),
      label: 'テストアラーム', days: [], enabled: true, requireMath: true, snoozeLimit: 3
    };
    activeSession = { alarm: testAlarm, snoozeCount: 0, snoozeUntil: null, isTest: true };
    startRinging(testAlarm, activeSession);
  });

  // ---------- main tick loop ----------
  function tick() {
    renderClock();

    var now = new Date();

    if (activeSession && activeSession.snoozeUntil) {
      if (now.getTime() >= activeSession.snoozeUntil) {
        activeSession.snoozeUntil = null;
        startRinging(activeSession.alarm, activeSession);
        updateSnoozeStatus(activeSession.alarm, activeSession);
      }
      return;
    }

    if (activeSession) {
      updateSnoozeStatus(activeSession.alarm, activeSession);
      return;
    }

    var hhmm = pad(now.getHours()) + ':' + pad(now.getMinutes());
    var dateKey = now.toDateString() + '_' + hhmm;

    for (var i = 0; i < alarms.length; i++) {
      var alarm = alarms[i];
      if (!alarm.enabled) continue;
      if (alarm.time !== hhmm) continue;
      if (alarm._lastFiredKey === dateKey) continue;
      if (alarm.days.length > 0 && alarm.days.indexOf(now.getDay()) === -1) continue;

      alarm._lastFiredKey = dateKey;
      activeSession = { alarm: alarm, snoozeCount: 0, snoozeUntil: null, isTest: false };
      startRinging(alarm, activeSession);
      break;
    }
  }

  setInterval(tick, 1000);
  tick();
  renderAlarmList();

  // ---------- iPhone (iOS Safari) guidance ----------
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS reports as Mac
  var isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  if (isIOS && !isStandalone) {
    // Not yet added to the Home Screen: show install + reliability instructions,
    // and skip the generic "keep this tab open" warning to avoid duplicate advice.
    $('iosInstallHint').hidden = false;
  } else {
    // Show the "keep this tab open" warning; browsers throttle/mute background tabs.
    $('permissionWarning').hidden = false;
  }
})();
