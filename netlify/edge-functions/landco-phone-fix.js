export default async (request, context) => {

  const response = await context.next();

  const ctype = response.headers.get("content-type") || "";

  if (!ctype.includes("text/html")) return response;

  let html = await response.text();

  if (!html.includes("tel:+19122541918")) {

    const patch = `<script>

(function(){

  var phone="912-254-1918";

  var tel="tel:+19122541918";

  function track(){try{gtag&&gtag('event','phone_call_click',{event_category:'engagement',event_label:phone})}catch(e){}}

  document.querySelectorAll('a,button').forEach(function(el){

    var t=(el.innerText||'').toLowerCase();

    if(t.includes('call')||t.includes('text')||t.includes('912-254')) {

      el.onclick=track;

      if(el.tagName==='A') el.href=tel;

      else el.addEventListener('click',function(e){e.preventDefault();location.href=tel;});

    }

  });

})();

</script>`;

    html = html.replace("</body>", patch + "</body>");

  }

  const h = new Headers(response.headers);

  h.delete("content-length");

  return new Response(html, {status: response.status, headers: h});

};
