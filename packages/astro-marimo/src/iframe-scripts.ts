// Serialized via .toString() at runtime — keep free of TypeScript syntax that survives compilation.

function _outerScript(iframeId: string) {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement;

  iframe.addEventListener('load', () => {
    const doc = iframe.contentDocument;
    if (!doc?.body) return;

    let lastHeight = 0;

    const setHeight = () => {
      const h = doc.getElementById('App')?.scrollHeight ?? 0;
      if (h > 0 && h !== lastHeight) {
        lastHeight = h;
        iframe.style.height = `${h}px`;
      }
    };

    // MutationObserver handles both cases:
    // - #App replaced entirely (WASM Marimo remounts React when Pyodide takes over)
    // - content added inside #App (Pyodide rendering cells — scrollHeight grows but
    //   layout height stays fixed at iframe height, so ResizeObserver never fires)
    new MutationObserver(setHeight).observe(doc.body, { childList: true, subtree: true });

    setHeight();
  });
}

export function outerScript(iframeId: string): string {
  return `(${_outerScript.toString()})(${JSON.stringify(iframeId)})`;
}
