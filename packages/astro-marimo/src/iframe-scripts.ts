// Serialized via .toString() at runtime — keep free of TypeScript syntax that survives compilation.

function _outerScript(iframeId: string) {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement;

  iframe.addEventListener('load', () => {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow as (Window & { ResizeObserver: typeof ResizeObserver }) | null;
    if (!doc || !win) return;

    const attach = (app: Element) => {
      const setHeight = () => { if (app.scrollHeight > 0) iframe.style.height = `${app.scrollHeight}px`; };
      new win.ResizeObserver(setHeight).observe(app);
      setHeight();
    };

    // Marimo's #App has overflow:auto — its scrollHeight is the full content height
    // even while the iframe clips the visible area to its current height.
    const app = doc.getElementById('App');
    if (app) {
      attach(app);
    } else {
      // React renders async after load — wait for #App to appear.
      const mo = new MutationObserver(() => {
        const app = doc.getElementById('App');
        if (app) { attach(app); mo.disconnect(); }
      });
      mo.observe(doc.body, { childList: true, subtree: true });
    }
  });
}

export function outerScript(iframeId: string): string {
  return `(${_outerScript.toString()})(${JSON.stringify(iframeId)})`;
}
