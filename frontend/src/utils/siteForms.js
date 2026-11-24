import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export const installSiteFormHandler = ({
  siteId,
  iframeRef,
  onSubmitted,
}) => {
  if (!siteId) return () => {};

  const pending = new WeakSet();
  const onMessage = async (event) => {
    if (
      event.data?.type !== "tenant-site-form-submit" ||
      (iframeRef?.current && event.source !== iframeRef.current.contentWindow)
    ) return;

    const form = event.data.form;
    if (!form || typeof form.resource !== "string") return;
    if (pending.has(form)) return;
    pending.add(form);

    const payload = { ...form.fields, website: form.website || "" };
    try {
      await axios.post(
        `${API_URL}/sites/${siteId}/public/${encodeURIComponent(form.resource)}`,
        payload,
      );
      onSubmitted?.(form.resource);
      event.source?.postMessage({
        type: "tenant-site-form-result",
        success: true,
        message: "Submission received successfully",
      }, "*");
    } catch (error) {
      event.source?.postMessage({
        type: "tenant-site-form-result",
        success: false,
        message:
          error.response?.data?.message ||
          "Could not submit the form. Please try again.",
      }, "*");
    } finally {
      pending.delete(form);
    }
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
};

export const SITE_FORM_SCRIPT = `
<script>
(() => {
  const attach = () => {
    document.querySelectorAll('form[data-form]').forEach((form) => {
      if (form.__tenantFormBound) return;
      form.__tenantFormBound = true;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (form.__tenantSubmitting) return;
        form.__tenantSubmitting = true;
        const button = form.querySelector('[type="submit"], button');
        if (button) button.disabled = true;

        const fields = {};
        const formData = new FormData(form);
        formData.forEach((value, key) => {
          if (!/^website$/i.test(key)) fields[key] = value;
        });
        let status = form.querySelector('[data-form-status]');
        if (!status) {
          status = document.createElement('p');
          status.setAttribute('data-form-status', '');
          status.setAttribute('role', 'status');
          form.appendChild(status);
        }
        status.textContent = 'Submitting...';

        const honeypot = form.elements.namedItem('website');
        parent.postMessage({
          type: 'tenant-site-form-submit',
          form: {
            resource: form.getAttribute('data-form'),
            fields,
            website: honeypot ? honeypot.value : ''
          }
        }, '*');

        const onResult = (message) => {
          if (message.data?.type !== 'tenant-site-form-result') return;
          window.removeEventListener('message', onResult);
          form.__tenantSubmitting = false;
          if (button) button.disabled = false;
          status.textConten