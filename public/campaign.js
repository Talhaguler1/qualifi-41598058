(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const tr = document.body.dataset.locale === 'tr';
  const t = (a, b) => tr ? a : b;
  const { campaignId, segment, solution, goal, locale } = document.body.dataset;
  const uuid = () => crypto.randomUUID();
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const storage = {
    get(key, session = false) { try { return (session ? sessionStorage : localStorage).getItem(key); } catch { return null; } },
    set(key, val, session = false) { try { (session ? sessionStorage : localStorage).setItem(key, val); } catch {} },
    remove(key) { try { localStorage.removeItem(key); } catch {} },
    object(key) { try { return JSON.parse(this.get(key, true) || '{}'); } catch { return {}; } }
  };
  const parameters = new URLSearchParams(location.search);
  const incoming = Object.fromEntries(keys.flatMap(key => {
    const value = parameters.get(key);
    return value && /^[a-zA-Z0-9_. -]{1,100}$/.test(value) ? [[key, value]] : [];
  }));
  let first = storage.object('qualifi.campaign');
  let last = storage.object('qualifi.last-campaign');
  if (Object.keys(incoming).length) {
    if (!Object.keys(first).length) { first = incoming; storage.set('qualifi.campaign', JSON.stringify(first), true); }
    last = incoming; storage.set('qualifi.last-campaign', JSON.stringify(last), true);
  }
  const languageLink = $('#campaign-language');
  const otherLanguage = new URL(languageLink.href);
  for (const [key, value] of Object.entries(incoming)) otherLanguage.searchParams.set(key, value);
  languageLink.href = otherLanguage.href;
  let consent = storage.get('qualifi.analytics');
  let visitorId = null; let measurementStarted = false; let queue = Promise.resolve();
  const form = $('#campaign-form'); const dialog = $('#campaign-dialog');
  let requestId = uuid(); let started = false;
  function context() {
    return { campaignId, segment, locale, analyticsConsent: consent === 'yes', visitorId,
      ...first, ...Object.fromEntries(keys.map(key => [`last_${key}`, last[key] || ''])) };
  }
  async function post(url, data, keepalive = false) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive });
    let result; try { result = await response.json(); } catch { throw new Error('unable_to_save'); }
    if (!response.ok) throw new Error(result.error || 'unable_to_save');
    return result;
  }
  function track(event, properties = {}) {
    if (consent !== 'yes' || !visitorId) return;
    const payload = { id: uuid(), event, properties: { solution, ...properties }, context: context() };
    queue = queue.then(async () => {
      if (consent !== 'yes') return;
      try { await post('/api/events', payload, true); }
      catch { if (consent === 'yes') { try { await post('/api/events', payload, true); } catch {} } }
    });
  }
  function beginMeasurement() {
    if (measurementStarted || consent !== 'yes') return;
    visitorId = storage.get('qualifi.visitor');
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(visitorId || '')) { visitorId = uuid(); storage.set('qualifi.visitor', visitorId); }
    measurementStarted = true; track('landing_viewed');
  }
  function chooseAnalytics(allow) {
    consent = allow ? 'yes' : 'no'; storage.set('qualifi.analytics', consent); $('#consent-banner').hidden = true;
    if (allow) beginMeasurement();
    else { visitorId = null; measurementStarted = false; storage.remove('qualifi.visitor'); }
  }
  $('#consent-accept').addEventListener('click', () => chooseAnalytics(true));
  $('#consent-decline').addEventListener('click', () => chooseAnalytics(false));
  $('#analytics-settings').addEventListener('click', () => { $('#consent-banner').hidden = false; $('#consent-accept').focus(); });
  if (consent === 'yes') beginMeasurement(); else if (consent !== 'no') $('#consent-banner').hidden = false;
  function open(modal, opener) { if (!modal.open) { modal._opener = opener; modal.showModal(); } }
  $$('.campaign-primary').forEach(button => button.addEventListener('click', () => {
    // Measure the intended first action before email, upload, consent-to-contact or form validation.
    track('primary_cta_clicked', { position: button.dataset.position });
    open(dialog, button);
  }));
  const privacy = $('#privacy-dialog');
  for (const id of ['#privacy-open', '#form-privacy']) $(id).addEventListener('click', event => open(privacy, event.currentTarget));
  $$('dialog').forEach(modal => {
    $('[data-close]', modal).addEventListener('click', () => modal.close());
    modal.addEventListener('close', () => modal._opener?.focus());
    modal.addEventListener('click', event => {
      if (event.target !== modal) return;
      const rect = modal.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
    });
  });
  form.addEventListener('input', () => { if (!started) { started = true; track('lead_form_started', { position: 'dialog' }); } });
  const error = $('.form-error', form);
  function showError(message) { error.textContent = message; error.hidden = false; }
  if (goal === 'contract') {
    $$('[name="fileMode"]').forEach(radio => radio.addEventListener('change', () => { $('#campaign-file-field').hidden = radio.value !== 'upload'; error.hidden = true; }));
    $('#campaign-file').addEventListener('change', () => {
      const file = $('#campaign-file').files[0];
      $('#campaign-file-status').textContent = file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB · ${t('Henüz yüklenmedi.', 'Not uploaded yet.')}` : t('Yalnızca talebinizi gönderdiğinizde kaydedilir.', 'Saved only when you submit your request.');
      if (file) track('contract_selected', { fileMode: 'upload', position: 'dialog' });
    });
  }
  async function contractPayload() {
    const file = $('#campaign-file').files[0];
    if (!file) throw new Error('file_required');
    if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('invalid_file_size');
    if (!/\.(pdf|txt)$/i.test(file.name)) throw new Error('invalid_contract');
    const bytes = new Uint8Array(await file.arrayBuffer()); let binary = '';
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return { type: /\.pdf$/i.test(file.name) ? 'application/pdf' : 'text/plain', base64: btoa(binary) };
  }
  function errorMessage(code) {
    const messages = {
      file_required: t('Bir dosya seçin veya örnek senaryoyla devam edin.', 'Choose a file or continue with a sample scenario.'),
      invalid_file_size: t('Boş olmayan, en fazla 5 MB bir dosya seçin.', 'Choose a non-empty file up to 5 MB.'),
      request_too_large: t('Dosya en fazla 5 MB olabilir.', 'Files must be no larger than 5 MB.'),
      invalid_contract: t('PDF veya UTF-8 TXT dosyası seçin.', 'Choose a PDF or UTF-8 TXT file.'),
      invalid_pdf: t('Bu dosya PDF olarak doğrulanamadı.', 'This file could not be validated as a PDF.'),
      invalid_text: t('TXT dosyası UTF-8 metin olmalı.', 'TXT files must contain UTF-8 text.'),
      rate_limited: t('Bir dakika bekleyip yeniden deneyin.', 'Wait a minute and try again.'),
      email_and_consent_required: t('Geçerli bir e-posta ve veri kullanım onayı gerekli.', 'A valid email and data-use agreement are required.')
    };
    return messages[code] || t('Kaydınız tamamlanamadı. Bilgileriniz korunuyor; yeniden deneyebilirsiniz.', 'Your request could not be saved. Your details are still here; please try again.');
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); error.hidden = true;
    if (!form.reportValidity()) return;
    const submit = $('button[type="submit"]', form); submit.disabled = true; form.setAttribute('aria-busy', 'true');
    try {
      const payload = { id: requestId, kind: goal === 'waitlist' ? 'waitlist' : 'pilot', solution, email: $('[name="email"]', form).value,
        company: $('[name="company"]', form)?.value || '', consent: $('[name="consent"]', form).checked,
        website: $('[name="website"]', form).value, context: context(), fileMode: 'sample' };
      if (goal === 'contract') { payload.fileMode = $('[name="fileMode"]:checked', form).value; if (payload.fileMode === 'upload') payload.contract = await contractPayload(); }
      const result = await post('/api/leads', payload);
      form.hidden = true;
      const success = $('#campaign-success'); success.replaceChildren(); success.hidden = false;
      const title = document.createElement('strong'); title.textContent = t('İlginiz kaydedildi.', 'Your interest is saved.');
      const text = document.createElement('p'); text.textContent = t('Bu çözüm için talebiniz alındı. Sonraki adımda 20 dakikalık bir demo üzerinden ihtiyacınızı değerlendirebiliriz. Henüz canlı ajan etkinleştirilmedi veya randevu oluşturulmadı.', 'Your request for this solution is saved. A later 20-minute demo can explore your needs. No live agent has been activated or appointment booked.');
      const reference = document.createElement('small'); reference.className = 'success-reference'; reference.textContent = `${t('Kayıt', 'Reference')}: ${result.id.slice(0, 8)}`;
      success.append(title, text, reference);
      // Scheduling is a secondary, post-interest action only.
      try {
        const response = await fetch('/api/config'); const config = await response.json();
        if (response.ok && config.calendarUrl) {
          const link = document.createElement('a'); link.href = config.calendarUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.className = 'text-link campaign-post-demo';
          link.textContent = t('Sonraki adım: demo saatlerine bak', 'Next step: see demo times');
          link.addEventListener('click', () => track('calendar_opened', { position: 'dialog' })); success.append(link);
        }
      } catch {}
      const restart = document.createElement('button'); restart.className = 'text-link restart-request'; restart.type = 'button'; restart.textContent = t('Yeni bir talep bırak', 'Create another request');
      restart.addEventListener('click', () => { requestId = uuid(); started = false; form.reset(); form.hidden = false; success.hidden = true; if (goal === 'contract') { $('#campaign-file-field').hidden = false; $('#campaign-file-status').textContent = ''; } $('#campaign-email').focus(); });
      success.append(restart); success.tabIndex = -1; success.focus();
    } catch (err) { showError(errorMessage(err.message)); }
    finally { submit.disabled = false; form.removeAttribute('aria-busy'); }
  });
})();
