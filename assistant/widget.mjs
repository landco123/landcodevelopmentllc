import { answerQuestion } from './answers.mjs';
import { intakeSteps, validateIntake } from './intake.mjs';

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
    <div class="lc-progress" hidden></div>
    <button type="button" class="lc-use-notes" hidden>Use my project notes</button>
    <form class="lc-review" hidden>
      <strong>Your request for Zach</strong><dl class="lc-summary"></dl>
      <label class="lc-consent"><input type="checkbox" name="contact_consent" required><span>Landco may contact me by phone, text or email about this request. Message and data rates may apply.</span></label>
      <label class="lc-consent"><input type="checkbox" name="terms_acknowledgment" required><span>I accept the <a href="/privacy-policy.html" target="_blank" rel="noopener">Privacy Policy</a> and <a href="/terms.html" target="_blank" rel="noopener">Website Terms</a>.</span></label>
      <button type="submit" class="lc-submit-request">Send my request to Landco</button>
      <button type="button" class="lc-edit-request">Edit my details</button>
      <button type="button" class="lc-add-photos">Add photos / use full form</button>
      <p>No price or appointment is confirmed. Zach reviews your request.</p>
    </form>
    <div class="lc-actions"><button type="button" class="lc-quote">Start my request</button><a href="tel:+19122541918">Call Zach</a></div>
    <p class="lc-note">Direct to Landco. Zach confirms price and timing. <a href="/privacy-policy.html">Privacy</a> • <a href="/terms.html">Terms</a></p>
  </section><button type="button" class="lc-launch" aria-expanded="false" aria-controls="lc-panel">Ask Landco</button>`;
  document.body.append(root);
  const panel = root.querySelector('.lc-panel'), launch = root.querySelector('.lc-launch'), input = root.querySelector('.lc-input input'), log = root.querySelector('.lc-messages'), send = root.querySelector('.lc-send');
  const questionForm = root.querySelector('.lc-input'), review = root.querySelector('.lc-review'), progress = root.querySelector('.lc-progress'), quote = root.querySelector('.lc-quote'), useNotes = root.querySelector('.lc-use-notes');
  let opened = false, pending = false, service = '', messages = [], stepIndex = -1, request = {}, previousNotes = '';
  function add(text, user = false, links = []) { const p = document.createElement('div'); p.className = 'lc-message' + (user ? ' lc-user' : ''); p.textContent = text; for (const link of links) { if (!/^\/(?!\/)/.test(link.url)) continue; const a = document.createElement('a'); a.href = link.url; a.textContent = link.label; a.className = 'lc-source'; p.append(a); } log.append(p); log.scrollTop = log.scrollHeight; requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; }); }
  add('What would you like done on your property? Ask me about Landco’s services, or tap Start my request. I’ll take your details one question at a time so Zach can follow up.');
  function close() { panel.hidden = true; launch.setAttribute('aria-expanded', 'false'); launch.focus(); }
  launch.addEventListener('click', () => {
    if (!panel.hidden) return close();
    panel.hidden = false; launch.setAttribute('aria-expanded', 'true'); input.focus();
    if (!opened) { opened = true; track('assistant_open'); }
  });
  root.querySelector('.lc-close').addEventListener('click', close);
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
  function promptStep() {
    const step = intakeSteps[stepIndex];
    progress.hidden = false; progress.textContent = `Your project request · ${stepIndex + 1} of ${intakeSteps.length}`;
    input.type = step.type; input.autocomplete = step.autocomplete; input.maxLength = step.max;
    input.setAttribute('aria-label', step.placeholder); input.placeholder = step.placeholder; input.value = request[step.key] || '';
    useNotes.hidden = step.key !== 'details' || !previousNotes;
    add(step.question); input.focus({preventScroll:true});
  }
  function beginRequest() {
    if (!document.querySelector('form[name="project-request"]')) {
      try { sessionStorage.setItem('landco_assistant_draft', JSON.stringify({begin:true,service:service || request.service || 'Other',notes:messages.join('\n').slice(0,1000)})); }
      catch { add('Please open the homepage form or call Zach at 912-254-1918 to start your request.'); return; }
      location.assign('/#quote-form'); return;
    }
    track('assistant_quote_handoff');
    request.service = service || request.service || 'Other';
    previousNotes = request.notes || messages.join('\n').slice(0,1000);
    stepIndex = 0; review.hidden = true; log.hidden = false; questionForm.hidden = false; root.querySelector('.lc-choices').hidden = true;
    quote.textContent = 'Cancel request'; send.textContent = 'Next'; promptStep();
  }
  function showReview() {
    stepIndex = -2; questionForm.hidden = true; useNotes.hidden = true; log.hidden = true; review.hidden = false; progress.hidden = false; progress.textContent = 'Review and send · Direct to Landco'; quote.hidden = true;
    const summary = root.querySelector('.lc-summary'); summary.replaceChildren();
    for (const [key,label] of [['name','Name'],['phone','Phone'],['email','Email'],['location','Project location'],['details','Work requested']]) {
      const term = document.createElement('dt'), value = document.createElement('dd'); term.textContent = label; value.textContent = request[key] || ''; summary.append(term,value);
    }
    review.querySelectorAll('input[type="checkbox"]').forEach(box => { box.checked = false; });
    panel.hidden = false; launch.setAttribute('aria-expanded','true'); review.querySelector('input').focus({preventScroll:true});
  }
  function handoffToForm() {
    const form = document.querySelector('form[name="project-request"]');
    if (form) { applyDraft(form, request); close(); document.getElementById('quote-form').scrollIntoView({behavior:'smooth'}); form.querySelector('[name="name"]').focus({preventScroll:true}); }
    else { try { sessionStorage.setItem('landco_assistant_draft', JSON.stringify({...request,review:false})); } catch { add('Please call Zach at 912-254-1918 or use the homepage form to send your request.'); return; } location.assign('/#quote-form'); }
  }
  async function ask(value) {
    const message = value.trim().slice(0, 1000); if (!message || pending) return;
    if (stepIndex >= 0) {
      const step = intakeSteps[stepIndex], error = validateIntake(step.key,message);
      if (error) { add(error); input.focus({preventScroll:true}); return; }
      request[step.key] = message; add(message,true); input.value = ''; stepIndex++;
      if (stepIndex === intakeSteps.length) { const answer = answerQuestion(request.details); if (answer.service) request.service = answer.service; showReview(); }
      else promptStep();
      return;
    }
    pending = true; send.disabled = true; input.value = ''; root.querySelector('.lc-choices').hidden = true; add(message, true); messages.push(message); messages = messages.slice(-12);
    let answer = answerQuestion(message);
    if (answer.service) service = answer.service;
    add(answer.reply, false, answer.links); pending = false; send.disabled = false; input.focus({preventScroll:true});
  }
  questionForm.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  root.querySelectorAll('.lc-choices button').forEach(b => b.addEventListener('click', () => ask(b.textContent)));
  root.querySelector('.lc-actions a').addEventListener('click', () => track('assistant_call'));
  quote.addEventListener('click', () => {
    if (stepIndex >= 0) { stepIndex = -1; progress.hidden = true; useNotes.hidden = true; quote.textContent = 'Start my request'; send.textContent = 'Send'; input.type = 'text'; input.autocomplete = 'off'; input.setAttribute('aria-label','Your service question'); input.placeholder = 'How can Landco help?'; input.value = ''; input.maxLength = 1000; add('You can keep asking service questions. Your request has not been sent.'); }
    else beginRequest();
  });
  useNotes.addEventListener('click', () => ask(previousNotes));
  root.querySelector('.lc-edit-request').addEventListener('click', () => { quote.hidden = false; beginRequest(); });
  root.querySelector('.lc-add-photos').addEventListener('click', handoffToForm);
  review.addEventListener('submit', e => {
    e.preventDefault();
    const form = document.querySelector('form[name="project-request"]');
    if (!form) { try { sessionStorage.setItem('landco_assistant_draft', JSON.stringify({...request,review:true})); } catch { handoffToForm(); return; } location.assign('/#quote-form'); return; }
    applyDraft(form, request);
    for (const name of ['contact_consent','terms_acknowledgment']) form.querySelector(`[name="${name}"]`).checked = review.querySelector(`[name="${name}"]`).checked;
    if (!form.checkValidity()) { handoffToForm(); form.reportValidity(); return; }
    root.querySelector('.lc-submit-request').textContent = 'Sending your request…';
    form.requestSubmit();
  });
  const form = document.querySelector('form[name="project-request"]');
  if (form) { try { const raw = sessionStorage.getItem('landco_assistant_draft'); sessionStorage.removeItem('landco_assistant_draft'); if (raw) { const draft = JSON.parse(raw); applyDraft(form, draft); request = draft; if (draft.review) showReview(); else if (draft.begin) { panel.hidden = false; launch.setAttribute('aria-expanded','true'); beginRequest(); } } } catch {} }
}

function applyDraft(form, draft) {
  const field = form.querySelector('[name="description"]'), select = form.querySelector('[name="project_type"]');
  for (const name of ['name','phone','email','location']) { const target = form.querySelector(`[name="${name}"]`); if (target && typeof draft[name] === 'string') target.value = draft[name]; }
  if (field && typeof draft.details === 'string' && draft.details) field.value = draft.details.slice(0, 6000);
  if (select && Array.from(select.options).some(o => o.value === draft.service)) select.value = draft.service;
}
