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

  const photoTargetBytes = 2 * 1024 * 1024;
  const uploadTotalBytes = 7.5 * 1024 * 1024;
  const photoMaxSide = 2000;
  const photoPattern = /\.(jpe?g|png|webp|heic|heif)$/i;
  const iphonePhotoPattern = /\.(heic|heif)$/i;

  function formatMegabytes(bytes) {
    return bytes < 100 * 1024 ? Math.max(1,Math.round(bytes / 1024)) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function uploadStatus(input) {
    const parent = input.parentElement || input;
    let status = parent.querySelector('[data-landco-upload-status]');
    if (!status) {
      status = document.createElement('span');
      status.setAttribute('data-landco-upload-status','');
      status.setAttribute('role','status');
      status.setAttribute('aria-live','polite');
      status.style.display = 'block';
      status.style.marginTop = '.35rem';
      status.style.fontSize = '.9rem';
      status.style.fontWeight = '600';
      status.style.color = '#6b5410';
      parent.append(status);
    }
    return status;
  }

  function loadPhoto(file) {
    return new Promise(function (resolve,reject) {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = function () { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Photo could not be opened.')); };
      image.src = url;
    });
  }

  function canvasJpeg(canvas,quality) {
    return new Promise(function (resolve,reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('Photo could not be prepared.'));
      },'image/jpeg',quality);
    });
  }

  async function optimizePhoto(file) {
    if (file.size <= photoTargetBytes && !iphonePhotoPattern.test(file.name)) return file;
    const image = await loadPhoto(file);
    const longest = Math.max(image.naturalWidth,image.naturalHeight);
    let scale = Math.min(1,photoMaxSide / longest);
    let width = Math.max(1,Math.round(image.naturalWidth * scale));
    let height = Math.max(1,Math.round(image.naturalHeight * scale));
    let quality = .84;
    let blob;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Photo could not be prepared.');
      context.fillStyle = '#fff';
      context.fillRect(0,0,width,height);
      context.drawImage(image,0,0,width,height);
      blob = await canvasJpeg(canvas,quality);
      canvas.width = canvas.height = 1;
      if (blob.size <= photoTargetBytes) break;
      const reduction = Math.min(.9,Math.sqrt(photoTargetBytes / blob.size) * .94);
      width = Math.max(1,Math.round(width * reduction));
      height = Math.max(1,Math.round(height * reduction));
      quality = Math.max(.58,quality - .07);
    }
    if (!blob || blob.size > photoTargetBytes) throw new Error('Photo remains too large.');
    const baseName = file.name.replace(/\.[^.]+$/,'') || 'project-photo';
    return new File([blob],baseName + '.jpg',{type:'image/jpeg',lastModified:file.lastModified});
  }

  document.querySelectorAll('form').forEach(function (form) {
    // Netlify removes data-netlify during deployment; the registered form-name field remains.
    if (!form.querySelector('input[name="form-name"]')) return;
    const uploads = [...form.querySelectorAll('input[type="file"]')];
    const previewUrls = new Map();
    function showPreview(input,file) {
      const parent = input.parentElement || input;
      let preview = parent.querySelector('[data-landco-photo-preview]');
      if (previewUrls.has(input)) URL.revokeObjectURL(previewUrls.get(input));
      previewUrls.delete(input);
      if (!file || !photoPattern.test(file.name)) {
        if (preview) preview.remove();
        return;
      }
      if (!preview) {
        preview = document.createElement('img');
        preview.setAttribute('data-landco-photo-preview','');
        preview.alt = 'Selected project photo';
        preview.style.cssText = 'display:block;max-width:160px;max-height:120px;object-fit:contain;margin-top:.5rem;border-radius:6px';
        parent.append(preview);
      }
      const url = URL.createObjectURL(file);
      previewUrls.set(input,url);
      preview.src = url;
    }
    function validateUploads() {
      const errors = new Map();
      let total = 0;
      let count = 0;
      uploads.forEach(input => {
        if (input.dataset.uploadError) errors.set(input,input.dataset.uploadError);
        for (const file of input.files || []) {
          total += file.size;
          if (file.size > 0) count += 1;
          else errors.set(input,'This file is empty. Please choose the photo again.');
          const pdfAllowed = /application\/pdf/i.test(input.getAttribute('accept') || '');
          const allowedFile = pdfAllowed ? /\.(jpe?g|png|webp|heic|heif|pdf)$/i : photoPattern;
          if (!allowedFile.test(file.name)) {
            errors.set(input,pdfAllowed
              ? 'Please use JPG, PNG, WebP, iPhone HEIC or PDF project files.'
              : 'Please use JPG, PNG, WebP or iPhone HEIC project photos. For help, call or text 912-254-1918.');
          }
        }
      });
      // Leave room for form fields and multipart overhead below the provider's 8 MB request limit.
      if (total > uploadTotalBytes && uploads.length && !errors.has(uploads[0])) {
        errors.set(uploads[0],'These files are too large to send together. Remove files to continue, or call or text 912-254-1918 for help.');
      }
      uploads.forEach(input => input.setCustomValidity(errors.get(input) || ''));
      const photoCount = form.querySelector('input[name="photo_count"]');
      const photoStatus = form.querySelector('input[name="photo_status"]');
      if (photoCount) photoCount.value = String(count);
      if (photoStatus) photoStatus.value = errors.size ? 'Photos need attention — not ready to send' : count ? count + ' project file(s) included with this request' : 'No photos included';
      return errors.size === 0;
    }
    uploads.forEach(function (input) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove file';
      remove.setAttribute('aria-label','Remove ' + input.name.replace(/^project_/, '').replaceAll('_',' '));
      remove.hidden = true;
      const status = uploadStatus(input);
      (status.closest('label') || status).after(remove);
      remove.addEventListener('click',function () {
        input.value = '';
        input.dispatchEvent(new Event('change'));
        input.focus();
      });
      input.addEventListener('change',async function () {
        const version = String((Number(input.dataset.uploadVersion) || 0) + 1);
        input.dataset.uploadVersion = version;
        delete input.dataset.uploadError;
        const file = input.files && input.files[0];
        remove.hidden = !file;
        showPreview(input,null);
        if (!file) { status.textContent = ''; validateUploads(); return; }
        if (!photoPattern.test(file.name)) { status.textContent = ''; validateUploads(); return; }
        if (file.size <= photoTargetBytes && !iphonePhotoPattern.test(file.name)) {
          status.textContent = 'Photo ready to send (' + formatMegabytes(file.size) + ').';
          showPreview(input,file);
          validateUploads();
          return;
        }
        input.dataset.uploadError = 'Preparing this photo for upload. Please wait a moment.';
        status.textContent = 'Preparing photo for upload…';
        validateUploads();
        try {
          const optimized = await optimizePhoto(file);
          if (input.dataset.uploadVersion !== version) return;
          const transfer = new DataTransfer();
          transfer.items.add(optimized);
          input.files = transfer.files;
          if (input.files.length !== 1 || input.files[0].size !== optimized.size) throw new Error('Prepared photo was not attached.');
          delete input.dataset.uploadError;
          status.textContent = 'Photo ready — reduced from ' + formatMegabytes(file.size) + ' to ' + formatMegabytes(optimized.size) + '.';
          showPreview(input,optimized);
        } catch (error) {
          if (input.dataset.uploadVersion !== version) return;
          input.dataset.uploadError = 'This photo could not be attached. Choose a JPG, PNG or WebP version, or call or text 912-254-1918 for help.';
          status.textContent = 'Photo not attached. Choose another photo or remove this file to send your request.';
        }
        validateUploads();
      });
    });
    validateUploads();
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
