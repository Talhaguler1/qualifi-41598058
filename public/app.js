(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const tr = document.body.dataset.locale === 'tr';
  const t = (a, b) => tr ? a : b;
  const segment = document.body.dataset.segment;
  const query = new URLSearchParams(location.search);
  const storage = {
    get(key, session = false) { try { return (session ? sessionStorage : localStorage).getItem(key); } catch { return null; } },
    set(key, value, session = false) { try { (session ? sessionStorage : localStorage).setItem(key, value); } catch {} },
    remove(key, session = false) { try { (session ? sessionStorage : localStorage).removeItem(key); } catch {} }
  };
  const uuid = () => crypto.randomUUID();
  const offers = segment === 'banks' ? ['risk'] : ['forecast', 'autopilot'];
  let solution = offers.includes(query.get('offer')) ? query.get('offer') : segment === 'finance' ? 'autopilot' : offers[0];
  let consentChoice = storage.get('qualifi.analytics');
  let visitorId = null;
  let measured = false;
  let observer;
  const impressionKeys = new Set();
  let config = null;
  let configPromise;
  let meetingLeadId = null;
  const leadIds = { pilot: uuid(), meeting: uuid(), waitlist: uuid() };
  const labels = { forecast: t('Nakit akışımı öngör', 'Forecast my cash flow'), autopilot: t('Takibi ajanıma devret', 'Delegate my follow-ups'), risk: t('Kurumsal risk analizi pilotu', 'Corporate risk analysis pilot') };
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const attribution = {};
  let firstAttribution = {};
  try { firstAttribution = JSON.parse(storage.get('qualifi.campaign', true) || '{}'); } catch {}
  for (const key of utmKeys) {
    const value = query.get(key);
    if (value && /^[a-zA-Z0-9_. -]{1,100}$/.test(value)) attribution[key] = value;
  }
  // Retain the entry campaign for this tab; never persist raw query strings or personal fields.
  if (Object.keys(attribution).length && !Object.keys(firstAttribution).length) {
    firstAttribution = attribution; storage.set('qualifi.campaign', JSON.stringify(firstAttribution), true);
  }
  let lastAttribution = {};
  try { lastAttribution = JSON.parse(storage.get('qualifi.last-campaign', true) || '{}'); } catch {}
  if (Object.keys(attribution).length) { lastAttribution = attribution; storage.set('qualifi.last-campaign', JSON.stringify(lastAttribution), true); }
  function context() {
    return { segment, locale: tr ? 'tr' : 'en', analyticsConsent: consentChoice === 'yes', visitorId,
      entryOffer: offers.includes(query.get('offer')) ? query.get('offer') : null, ...firstAttribution,
      ...Object.fromEntries(utmKeys.map(key => [`last_${key}`, lastAttribution[key] || ''])) };
  }
  async function post(url, payload, keepalive = false) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive });
    let data;
    try { data = await response.json(); } catch { throw new Error('unable_to_save'); }
    if (!response.ok) throw new Error(data.error || 'unable_to_save');
    return data;
  }
  function track(event, properties = {}) {
    if (consentChoice !== 'yes' || !visitorId) return;
    const payload = { id: uuid(), event, properties, context: context() };
    post('/api/events', payload, true).catch(() => {
      // The same event ID makes a retry safe if the first response was lost.
      setTimeout(() => { if (consentChoice === 'yes') post('/api/events', payload, true).catch(() => {}); }, 800);
    });
  }
  function beginMeasurement() {
    if (measured || consentChoice !== 'yes') return;
    measured = true;
    visitorId = storage.get('qualifi.visitor');
    if (!/^[a-f0-9-]{36}$/i.test(visitorId || '')) { visitorId = uuid(); storage.set('qualifi.visitor', visitorId); }
    track('landing_viewed');
    // Balance card position across measured visitors, retaining the same order on return.
    if (offers.length === 2 && parseInt(visitorId.slice(-1), 16) % 2) $('.solution-grid').append($('.solution-card'));
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const offer = entry.target.dataset.offer;
        if (impressionKeys.has(offer)) continue;
        impressionKeys.add(offer);
        track('solution_viewed', { solution: offer, position: String($$('.solution-card').indexOf(entry.target) + 1) });
      }
    }, { threshold: 0.5 });
    $$('.solution-card').forEach(card => observer.observe(card));
  }
  function setAnalytics(allow) {
    consentChoice = allow ? 'yes' : 'no';
    storage.set('qualifi.analytics', consentChoice);
    $('#consent-banner').hidden = true;
    if (allow) beginMeasurement();
    else { visitorId = null; measured = false; observer?.disconnect(); impressionKeys.clear(); storage.remove('qualifi.visitor'); }
  }
  $('#consent-accept').addEventListener('click', () => setAnalytics(true));
  $('#consent-decline').addEventListener('click', () => setAnalytics(false));
  $('#analytics-settings').addEventListener('click', () => { $('#consent-banner').hidden = false; $('#consent-accept').focus(); });
  if (consentChoice === 'yes') beginMeasurement();
  else if (consentChoice !== 'no') $('#consent-banner').hidden = false;
  function setSolution(next, record = false) {
    if (!offers.includes(next)) return;
    solution = next;
    $$('[data-select]').forEach(button => {
      const selected = button.dataset.select === solution;
      button.setAttribute('aria-pressed', String(selected));
      button.closest('.solution-card').classList.toggle('selected', selected);
    });
    const radio = $(`input[name="solution"][value="${solution}"]`);
    if (radio) radio.checked = true;
    $('#selected-summary').textContent = t('Seçilen hedef: ', 'Selected goal: ') + labels[solution];
    if (record) track('solution_selected', { solution, position: String($$('.solution-card').findIndex(card => card.dataset.offer === solution) + 1) });
  }
  setSolution(solution);
  $$('[data-select]').forEach(button => button.addEventListener('click', () => setSolution(button.dataset.select, true)));
  $$('input[name="solution"]').forEach(input => input.addEventListener('change', () => { setSolution(input.value); track('outcome_selected', { solution }); }));
  const focusStack = [];
  function openDialog(name, trigger) {
    const dialog = $(`#${name}-dialog`);
    if (!dialog) return;
    if (!dialog.open) { focusStack.push(trigger || document.activeElement); dialog.showModal(); }
    if (name === 'meeting') loadConfig();
  }
  $$('[data-open]').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.open;
    if (name !== 'privacy') {
      if (name === 'agent') track('agent_cta_clicked', { cta: 'agent', solution, position: button.dataset.position || 'dialog' });
      else track('lead_form_opened', { cta: name, solution, position: button.dataset.position || 'dialog' });
    }
    openDialog(name, button);
  }));
  $$('dialog').forEach(dialog => {
    $('[data-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => focusStack.pop()?.focus());
  });
  async function loadConfig() {
    if (!configPromise) configPromise = fetch('/api/config').then(r => { if (!r.ok) throw new Error(); return r.json(); }).catch(() => { configPromise = null; return { calendarUrl: '' }; });
    config = await configPromise;
    const link = $('#calendar-link');
    if (config.calendarUrl) {
      const calendar = new URL(config.calendarUrl);
      if (meetingLeadId) calendar.searchParams.set('qualifi_lead_id', meetingLeadId);
      link.href = calendar.href; link.hidden = false;
      $('#calendar-description').textContent = t('Takvimden uygun gün ve saati seçebilirsiniz. Rezervasyon onayı takvim sağlayıcısında gösterilir.', 'Choose an available date and time on the calendar. The calendar provider will confirm your reservation.');
    } else {
      link.hidden = true;
      $('#calendar-description').textContent = t('Takvim bağlantısı henüz eklenmedi. E-postanızı bırakarak görüşme talebinizi ekibimize iletebilirsiniz.', 'The calendar link has not been added yet. Leave your email to request a conversation with our team.');
    }
  }
  $('#calendar-link').addEventListener('click', () => track('calendar_opened', { cta: 'meeting', solution, position: 'dialog' }));
  const agentForm = $('#agent-form');
  let step = 0; let setupStarted = false;
  function errorText(error) {
    const errors = {
      invalid_contract: t('PDF veya UTF-8 TXT biçiminde geçerli bir dosya seçin.', 'Choose a valid PDF or UTF-8 TXT file.'),
      invalid_pdf: t('Bu dosya geçerli bir PDF görünmüyor. Başka bir dosya seçin.', 'This file does not appear to be a PDF. Choose another file.'),
      invalid_text: t('TXT dosyası UTF-8 metin olmalı.', 'TXT files must contain UTF-8 text.'),
      invalid_file_size: t('Dosya en fazla 5 MB olabilir.', 'Files must be no larger than 5 MB.'),
      request_too_large: t('Dosya en fazla 5 MB olabilir.', 'Files must be no larger than 5 MB.'),
      rate_limited: t('Çok fazla deneme yapıldı. Bir dakika bekleyip yeniden deneyin.', 'Too many attempts. Wait a minute and try again.'),
      email_and_consent_required: t('Geçerli e-posta ve veri kullanım onayı gerekli.', 'A valid email and data-use consent are required.')
    };
    return errors[error.message] || t('Kaydınız tamamlanamadı. Bilgileriniz burada duruyor; lütfen yeniden deneyin.', 'Your request could not be saved. Your details are still here; please try again.');
  }
  function showError(form, message) { const el = $('.form-error', form); el.textContent = message; el.hidden = false; }
  function clearError(form) { $('.form-error', form).hidden = true; }
  function showStep(next) {
    step = next; clearError(agentForm);
    $$('[data-step]', agentForm).forEach((field, i) => {
      field.hidden = i !== step;
      // Disable hidden controls so native submit validation never targets an invisible field.
      field.disabled = i !== step;
    });
    $$('.wizard-progress li').forEach((li, i) => { if (i === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    $('#wizard-back').hidden = step === 0;
    $('#wizard-next').hidden = step === 2;
    $('#wizard-submit').hidden = step !== 2;
    if ($('#agent-dialog').open) $(`[data-step="${step}"] input`, agentForm)?.focus();
  }
  function startSetup() { if (!setupStarted) { setupStarted = true; track('agent_setup_started', { solution }); } }
  agentForm.addEventListener('change', startSetup);
  function validFile() {
    if ($('input[name="fileMode"]:checked').value !== 'upload') return true;
    const file = $('#contract').files[0];
    if (!file) { showError(agentForm, t('Bir sözleşme seçin veya örnek sözleşmeyle devam edin.', 'Choose a file or continue with a sample agreement.')); return false; }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) { showError(agentForm, t('Dosya boş olmamalı ve 5 MB’ı geçmemeli.', 'Choose a non-empty file up to 5 MB.')); return false; }
    if (!/\.(pdf|txt)$/i.test(file.name)) { showError(agentForm, t('PDF veya TXT dosyası seçin.', 'Choose a PDF or TXT file.')); return false; }
    return true;
  }
  $('#wizard-next').addEventListener('click', () => {
    startSetup();
    if (step === 1 && !validFile()) return;
    showStep(Math.min(2, step + 1));
  });
  $('#wizard-back').addEventListener('click', () => showStep(Math.max(0, step - 1)));
  $$('input[name="fileMode"]').forEach(input => input.addEventListener('change', () => {
    $('#file-field').hidden = input.value !== 'upload'; clearError(agentForm);
  }));
  $('#contract').addEventListener('change', () => {
    const file = $('#contract').files[0];
    $('#file-status').textContent = file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB · ${t('Talep gönderilene kadar yüklenmez.', 'Not uploaded until you submit.')}` : '';
    if (file) track('contract_selected', { solution, fileMode: 'upload' });
  });
  $('select[name="channel"]').addEventListener('change', event => track('channel_preference_selected', { solution, channel: event.target.value }));
  function value(name, form) { return $(`[name="${name}"]`, form)?.value || ''; }
  async function encodeFile(file) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let i = 0; i < buffer.length; i += 32768) binary += String.fromCharCode(...buffer.subarray(i, i + 32768));
    return { type: /\.pdf$/i.test(file.name) ? 'application/pdf' : 'text/plain', base64: btoa(binary) };
  }
  async function submit(form, kind) {
    clearError(form);
    if (!form.reportValidity()) return;
    if (kind === 'pilot' && !validFile()) return;
    const button = $('button[type="submit"]', form);
    button.disabled = true; form.setAttribute('aria-busy', 'true');
    try {
      const payload = { id: leadIds[kind], kind, email: value('email', form), company: value('company', form), role: value('role', form), solution,
        consent: $('[name="consent"]', form).checked, website: value('website', form), context: context() };
      if (kind === 'pilot') {
        payload.fileMode = $('input[name="fileMode"]:checked').value;
        payload.channel = value('channel', agentForm);
        if (payload.fileMode === 'upload') payload.contract = await encodeFile($('#contract').files[0]);
      }
      const result = await post('/api/leads', payload);
      const success = $('.form-success', form.closest('dialog'));
      const title = { pilot: t('Pilot talebiniz alındı.', 'Your pilot request is saved.'), waitlist: t('Listedesiniz.', 'You’re on the list.'), meeting: t('Görüşme talebiniz alındı.', 'Your meeting request is saved.') }[kind];
      const detail = { pilot: t('Ekibimiz kapsamı değerlendirmek için bıraktığınız e-posta üzerinden iletişime geçebilir. Bu işlem canlı ajan etkinleştirmez.', 'Our team can contact you at the email you provided to discuss scope. This does not activate a live agent.'), waitlist: t('Pilot ve erken erişim gelişmelerini paylaşmak için e-posta adresiniz kaydedildi.', 'Your email has been saved for pilot and early-access updates.'), meeting: t('Bu bir görüşme talebidir; henüz gün ve saat rezervasyonu yapılmadı.', 'This is a conversation request; no date or time has been reserved yet.') }[kind];
      const strong = document.createElement('strong'); strong.textContent = title;
      const p = document.createElement('p'); p.textContent = detail;
      const reference = document.createElement('span'); reference.className = 'success-reference'; reference.textContent = `${t('Kayıt', 'Reference')}: ${result.id.slice(0, 8)}`;
      success.replaceChildren(strong, p, reference); success.hidden = false; form.hidden = true;
      const restart = document.createElement('button');
      restart.type = 'button'; restart.className = 'text-link restart-request';
      restart.textContent = t('Başka bir talep oluştur', 'Create another request');
      restart.addEventListener('click', () => {
        form.reset(); form.hidden = false; success.hidden = true; leadIds[kind] = uuid();
        if (kind === 'pilot') { $('.wizard-progress').hidden = false; $('#file-field').hidden = true; $('#file-status').textContent = ''; setupStarted = false; setSolution(solution); showStep(0); }
        else $('input[type="email"]', form).focus();
      });
      success.append(restart);
      if (kind === 'pilot') $('.wizard-progress').hidden = true;
      if (kind === 'meeting') {
        meetingLeadId = result.id;
        await loadConfig();
      }
      success.setAttribute('tabindex', '-1'); success.focus();
    } catch (error) { showError(form, errorText(error)); }
    finally { button.disabled = false; form.removeAttribute('aria-busy'); }
  }
  for (const [selector, kind] of [['#agent-form', 'pilot'], ['#waitlist-form', 'waitlist'], ['#meeting-form', 'meeting']]) {
    $(selector).addEventListener('input', () => track('lead_form_started', { cta: kind === 'pilot' ? 'agent' : kind, solution, position: 'dialog' }), { once: true });
    $(selector).addEventListener('submit', event => {
      event.preventDefault();
      if (kind === 'pilot' && step < 2) { $('#wizard-next').click(); return; }
      submit($(selector), kind);
    });
  }
  showStep(0);
})();
