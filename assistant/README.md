# Landco-owned Website Project Assistant

Landco owns this assistant's source in its existing website repository. It uses approved public service information, runs in the visitor's browser, and requires no n8n account, AI provider, new subscription or API key. It is a scripted chatbot, not a generative AI agent. Existing website hosting, form processing and analytics remain in use.

## Direct lead ownership

Visitors call Zach at 912-254-1918 or choose Start my request. The assistant collects five short answers, offers a review, requires explicit consent and submits only after the visitor chooses Send my request to Landco. Details and photos use the existing Landco form and its processor. Zach confirms scope, pricing and scheduling directly. There is no shared phone number or third-party lead routing.

## Review and publish

Review the pull request's Netlify deploy preview if enabled. Test Ask Landco on desktop and mobile, ask about drainage and prices, and choose Start my request. Confirm notes arrive in the homepage form and consent boxes remain unchecked. Check required name, phone, location and description fields, photo uploads and the 912-254-1918 phone link. Repeat from grading and city pages. Ask about concrete/asphalt, permits and schedules. Publish after Zach reviews the result; merging main triggers the existing Netlify deployment. Verify an authorized test form submission arrives in Landco’s form inbox after deployment and remove that test record. No test lead has been submitted during development.

## Data and measurement

Messages stay in browser memory. An explicitly requested cross-page draft uses tab session storage and is consumed on the homepage. Assistant analytics events include only event names: assistant_open, assistant_quote_handoff and assistant_call. No message text, contact details or photos are added to these events. A handoff is not a received lead; measure actual received inquiries and booked jobs. Form delivery and notifications use the existing Landco Netlify configuration.

## Maintenance

Approved responses are in answers.mjs. Widget behavior is in widget.mjs and styling in widget.css. To remove the assistant, remove its loader from site.js and the module tags on the five service pages. No cancellation or external account changes are required.

An owned open-weight model could be added later after identifying the download and a reliable Landco-controlled server. It is optional and is not needed for this version. A downloaded ChatGPT app or history export does not itself host a website AI service.

## Validation limits

Local checks cover approved responses and DOM behavior, including service-page mounting, quote prefill, unchecked consent, safe text rendering, direct phone link, keyboard close and consumed draft notes. The Netlify preview was checked in the browser for desktop appearance, service-page loading and quote handoff. Production inbox delivery still requires an authorized test submission or a real client request. The website guide is live. The guided intake update is validated separately before publication. No production test lead has been sent.
# Website information

The assistant includes a local search index of 317 service descriptions, FAQs and other public website sections across 33 pages, with links to their source pages. Rebuild it after website content changes with `python3 assistant/build-knowledge.py`. This uses Python's standard library and adds no browser dependency or subscription. The assistant is a scripted website search and service guide; it does not run a language model. It asks visitors to contact Zach when a question has no clear website answer. Mass grading scope and landscaping work beyond the listed ground-preparation services require Zach's confirmation.

## Guided request intake

Start my request asks for name, phone, email, project location and work requested one question at a time. Visitors can reuse their service-question notes as the scope. They review their information and actively select contact consent and the policy acknowledgment before sending. The widget fills the existing project-request form and submits it through normal browser form submission, preserving the existing endpoint and attribution. Add photos / use full form opens the same prefilled form. Contact answers are never added to analytics events. Starting from a service page moves to the homepage before intake, keeping one review and submission step.
