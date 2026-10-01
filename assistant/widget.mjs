import { answerQuestion } from './answers.mjs';

function track(event) { if (typeof window.gtag === 'function') window.gtag('event', event, { event_category: 'assistant' }); }
const skip = /\/(thank-you|privacy-policy|terms|404)(\.html)?\/?$/.test(location.pathname);
if (!skip && !document.getElementById('landco-assistant')) init();

function init() {
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assistant/widget.css'; document.head.append(css);
  const root = document.createElement('aside'); root.id = 'landco-assistant'; root.setAttribute('aria-label', 'Landco project assistant');
  root.innerHTML = `<section class="lc-panel" id="lc-panel" aria-label="Project assistant conversation" hidden>
    <header class="lc-head"><div><strong>Landco Project Assistant</strong><small>Automated help • Direct to Landco</small></div><button class="lc-close" aria-label="Close assistant">×</button></header>
    <div class="lc-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
    <div class="lc-choices"><button type="button">Drainage</button><button type="button">Grading & pads</button><button type="button">Gravel driveway</button><button type="button">Land clearing</button><button type="button">Service areas</button></div>
    <form class="lc-input"><input aria-label="Your service question" placeholder="How can Landco help?" maxlength="1000" required><button class="lc-send" type="submit">Send</button></form>
    <div class="lc-actions"><button type="button" class="lc-quote">Request a Quote</button><a href="tel:+19122541918">Call Zach</a></div>
    <p class="lc-note">General service information. Zach confirms scope, price and timing. Put contact details and photos in the quote form. <a href="/privacy-policy.html">Privacy</a> • <a href="/terms.html">Terms</a></p>
  </section><button type="button" class="lc-launch" aria-expanded="false" aria-controls="lc-panel">Ask Landco</button>`;
  document.body.append(root);
  const panel = root.querySelector('.lc-panel'), launch = root.querySelector('.lc-launch'), input = root.querySelector('input'), log = root.querySelector('.lc-messages'), send = root.querySelector('.lc-send');
  let opened = false, pending = false, service = '', messages = [];
  function add(text, user = false) { const p = document.createElement('div'); p.className = 'lc-message' + (user ? ' lc-user' : ''); p.textContent = text; log.append(p); log.scrollTop = log.scrollHeight; }
  add('Welcome to Landco. What are you working on—drainage, grading, a gravel driveway or land clearing? I can explain our services and help you start a quote request.');
  function close() { panel.hidden = true; launch.setAttribute('aria-expanded', 'false'); launch.focus(); }
  launch.addEventListener('click', () => {
    if (!panel.hidden) return close();
    panel.hidden = false; launch.setAttribute('aria-expanded', 'true'); input.focus();
    if (!opened) { opened = true; track('assistant_open'); }
  });
  root.querySelector('.lc-close').addEventListener('click', close);
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
  async function ask(value) {
    const message = value.trim().slice(0, 1000); if (!message || pending) return;
    pending = true; send.disabled = true; input.value = ''; add(message, true); messages.push(message); messages = messages.slice(-12);
    let answer = answerQuestion(message);
    if (answer.service) service = answer.service;
    add(answer.reply); pending = false; send.disabled = false; input.focus();
  }
  root.querySelector('.lc-input').addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  root.querySelectorAll('.lc-choices button').forEach(b => b.addEventListener('click', () => ask(b.textContent)));
  root.querySelector('.lc-actions a').addEventListener('click', () => track('assistant_call'));
  root.querySelector('.lc-quote').addEventListener('click', () => {
    track('assistant_quote_handoff');
    const draft = { service, details:messages.join('\n').slice(0, 6000) };
    const form = document.querySelector('form[name="project-request"]');
    if (form) { applyDraft(form, draft); close(); document.getElementById('quote-form').scrollIntoView({behavior:'smooth'}); form.querySelector('[name="name"]').focus({preventScroll:true}); }
    else { try { sessionStorage.setItem('landco_assistant_draft', JSON.stringify(draft)); } catch {} location.assign('/#quote-form'); }
  });
  const form = document.querySelector('form[name="project-request"]');
  if (form) { try { const raw = sessionStorage.getItem('landco_assistant_draft'); sessionStorage.removeItem('landco_assistant_draft'); if (raw) applyDraft(form, JSON.parse(raw)); } catch {} }
}

function applyDraft(form, draft) {
  const field = form.querySelector('[name="description"]'), select = form.querySelector('[name="project_type"]');
  if (field && typeof draft.details === 'string' && draft.details) field.value = (field.value ? field.value + '\n\n' : '') + 'Project assistant notes (please review):\n' + draft.details.slice(0, 6000);
  if (select && !select.value && Array.from(select.options).some(o => o.value === draft.service)) select.value = draft.service;
}
