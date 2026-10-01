# Landco-owned Website Project Assistant

Landco owns this assistant's source in its existing website repository. It uses approved public service information, runs in the visitor's browser, and requires no n8n account, AI provider, new subscription or API key. It is a scripted chatbot, not a generative AI agent. Existing website hosting, form processing and analytics remain in use.

## Direct lead ownership

Visitors call Zach at 912-254-1918 or use the existing homepage project-request form. Choosing Request a Quote copies recent questions into that form for the visitor to review, complete and submit under the existing consent controls. Personal details and photos go through the existing Landco form. Zach confirms scope, pricing and scheduling directly. The assistant never submits a lead or sends messages itself. There is no shared phone number or third-party lead routing.

## Review and publish

Review the pull request's Netlify deploy preview if enabled. Test Ask Landco on desktop and mobile, ask about drainage and prices, and choose Request a Quote. Confirm notes arrive in the homepage form and consent boxes remain unchecked. Check required name, phone, location and description fields, photo uploads and the 912-254-1918 phone link. Repeat from grading and city pages. Ask about concrete/asphalt, permits and schedules. Publish after Zach reviews the result; merging main triggers the existing Netlify deployment. Verify an authorized test form submission arrives in Landco’s form inbox after deployment and remove that test record. No test lead has been submitted during development.

## Data and measurement

Messages stay in browser memory. An explicitly requested cross-page draft uses tab session storage and is consumed on the homepage. Assistant analytics events include only event names: assistant_open, assistant_quote_handoff and assistant_call. No message text, contact details or photos are added to these events. A handoff is not a received lead; measure actual received inquiries and booked jobs. Form delivery and notifications use the existing Landco Netlify configuration.

## Maintenance

Approved responses are in answers.mjs. Widget behavior is in widget.mjs and styling in widget.css. To remove the assistant, remove its loader from site.js and the module tags on the five service pages. No cancellation or external account changes are required.

An owned open-weight model could be added later after identifying the download and a reliable Landco-controlled server. It is optional and is not needed for this version. A downloaded ChatGPT app or history export does not itself host a website AI service.

## Validation limits

Local checks cover approved responses and DOM behavior, including service-page mounting, quote prefill, unchecked consent, safe text rendering, direct phone link, keyboard close and consumed draft notes. Full browser visual checks could not run because a browser executable was unavailable and its download failed. Desktop/mobile layout, production form delivery and any deploy preview still require review before launch. Production has not been merged or deployed.
