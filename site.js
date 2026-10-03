(function () {
  const params = new URLSearchParams(window.location.search);
  const tracked = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid'];
  const read = key => { try { return sessionStorage.getItem(key) || ''; } catch { return ''; } };
  const write = (key,value) => { try { sessionStorage.setItem(key,value); } catch {} };
  const emit = (event,data) => { if (typeof window.gtag === 'function') window.gtag('event',event,data); };
  if (['gclid','gbraid','wbraid','utm_source'].some(name => params.has(name))) {
    tracked.forEach(name => write('landco_' + name, params.get(name) || ''));
    write('landco_first_landing',window.location.href);
  }
  // Capture attribution even on a landing page without a form. Keep it across navigation.
  tracked.forEach(function (name) {
    const value = params.get(name) || read('landco_' + name);
    if (params.has(name)) write('landco_' + name, params.get(name));
    document.querySelectorAll('input[name="' + name + '"]').forEach(input => { input.value = value; });
  });
  const landing = read('landco_first_landing') || window.location.href;
  write('landco_first_landing',landing);
  document.querySelectorAll('input[name="landing_page"]').forEach(input => { input.value = landing; });
  document.querySelectorAll('a[href^="tel:"]:not([data-call-track]):not([onclick*="gtag"])').forEach(function (link) {
    link.addEventListener('click', () => emit('click_call',{event_category:'lead',event_label:location.pathname}));
  });
  document.querySelectorAll('a[href*="#quote-form"]:not([onclick*="gtag"])').forEach(link => {
    link.addEventListener('click',() => emit('click_quote',{event_category:'engagement',event_label:location.pathname}));
  });
  document.querySelectorAll('form').forEach(function (form) {
    // Netlify removes data-netlify during deployment; the registered form-name field remains.
    if (!form.querySelector('input[name="form-name"]')) return;
    const uploads = [...form.querySelectorAll('input[type="file"]')];
    function validateUploads() {
      uploads.forEach(input => input.setCustomValidity(''));
      let total = 0;
      uploads.forEach(input => {
        for (const file of input.files || []) {
          total += file.size;
          if (!/\.(jpe?g|png|webp)$/i.test(file.name)) input.setCustomValidity('Please use JPG, PNG or WebP project photos. You can send your request without photos and text them to 912-254-1918.');
        }
      });
      // Leave room for form fields and multipart overhead below the provider's 8 MB request limit.
      if (total > 7.5 * 1024 * 1024 && uploads.length) uploads[0].setCustomValidity('These photos are too large to send together. Choose smaller photos, or send the request without photos and text them to 912-254-1918.');
    }
    uploads.forEach(input => input.addEventListener('change',validateUploads));
    form.addEventListener('submit', function (event) {
      validateUploads();
      if (!form.checkValidity()) { event.preventDefault(); form.reportValidity(); return; }
      const submittedAt = form.querySelector('input[name="submitted_at"]');
      if (submittedAt) submittedAt.value = new Date().toISOString();
      const pending = {id: window.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2), form:form.getAttribute('name'), at:Date.now()};
      write('landco_pending_request',JSON.stringify(pending));
      if (!form.hasAttribute('data-form-track') && !/gtag/.test(form.getAttribute('onsubmit') || '')) emit('landco_form_attempt',{event_category:'form',event_label:pending.form});
    });
  });
  // Count a lead after the provider redirects to success, once per submitted request.
  if (/\/thank-you(\.html)?\/?$/.test(location.pathname)) {
    let pending;
    try { pending = JSON.parse(read('landco_pending_request')); sessionStorage.removeItem('landco_pending_request'); } catch {}
    if (pending && typeof pending.id === 'string' && Date.now() - pending.at >= 0 && Date.now() - pending.at < 30 * 60 * 1000) {
      emit('generate_lead',{event_category:'form',event_label:pending.form,lead_source:'website'});
      emit('conversion',{send_to:'AW-11478133009/TY4LCLyA3Y4cEJHSmeEq',transaction_id:pending.id});
    }
  }
})();

// Load the owned assistant without interrupting forms or tracking.
(function () {
  if (document.querySelector('script[src="/assistant/widget.mjs"]')) return;
  const script = document.createElement('script'); script.type = 'module'; script.src = '/assistant/widget.mjs'; document.head.append(script);
})();
