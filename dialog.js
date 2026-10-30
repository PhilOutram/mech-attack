// App-styled confirmation dialog, used instead of the browser's confirm() box.
// confirmDialog resolves true when the player chooses the confirm button, false otherwise.
// With cancel null there is only the confirm button (a message to acknowledge). extra: HTML
// the app builds itself (never text from elsewhere), shown under the text.

export function confirmDialog({ title, text, confirm = "OK", cancel = "Cancel", extra = "" }) {
  const overlay = document.getElementById("confirm-dialog");
  const yes = document.getElementById("confirm-yes");
  const no = document.getElementById("confirm-no");
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-text").textContent = text;
  const more = document.getElementById("confirm-extra");
  more.innerHTML = extra;
  more.hidden = !extra;
  yes.textContent = confirm;
  no.textContent = cancel || "";
  no.hidden = cancel === null;
  overlay.hidden = false;
  // Open at the top: focusing the button would scroll a long dialog down to it.
  overlay.querySelector(".map-picker-card").scrollTop = 0;
  yes.focus({ preventScroll: true });

  return new Promise((resolve) => {
    const close = (answer) => {
      overlay.hidden = true;
      yes.removeEventListener("click", onYes);
      no.removeEventListener("click", onNo);
      overlay.removeEventListener("click", onBackdrop);
      document.removeEventListener("keydown", onKey);
      resolve(answer);
    };
    const onYes = () => close(true);
    const onNo = () => close(false);
    const onBackdrop = (e) => {
      if (e.target === overlay) close(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
    };
    yes.addEventListener("click", onYes);
    no.addEventListener("click", onNo);
    overlay.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onKey);
  });
}
