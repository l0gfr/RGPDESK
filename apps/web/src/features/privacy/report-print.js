// Fixed public demonstration only. No report content is read or transmitted.
for (const button of document.querySelectorAll("[data-report-pdf]")) {
  if (!(button instanceof HTMLButtonElement)) continue;
  button.addEventListener("click", () => window.print());
  button.hidden = false;
}
