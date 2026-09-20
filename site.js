(function () {
  const params = new URLSearchParams(window.location.search);
  const tracked = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid'];
  tracked.forEach(function (name) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (input) {
      input.value = params.get(name) || sessionStorage.getItem('landco_' + name) || '';
      if (params.get(name)) sessionStorage.setItem('landco_' + name, params.get(name));
    });
  });
  document.querySelectorAll('input[name="landing_page"]').forEach(function (input) { input.value = window.location.href; });
  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener('click', function () { if (typeof window.gtag === 'function') window.gtag('event','click_call',{event_category:'lead',event_label:location.pathname}); });
  });
  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function () {
      var submittedAt = form.querySelector('input[name="submitted_at"]');
      if (submittedAt) submittedAt.value = new Date().toISOString();
      if (typeof window.gtag === 'function') window.gtag('event','generate_lead',{event_category:'form',event_label:form.getAttribute('name') || location.pathname});
    });
  });
})();

