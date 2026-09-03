/* Render div.mermaid blocks (pymdownx fence_div_format) with the page's color scheme.
   The source text is captured as soon as this script runs and rendered on window load,
   so it survives anything else that touches the block first. */
(function () {
  if (typeof mermaid === "undefined") return;
  var nodes = Array.prototype.slice.call(document.querySelectorAll("div.mermaid"));
  nodes.forEach(function (n) {
    if (!n.dataset.src) n.dataset.src = n.textContent;
  });
  var scheme = document.body && document.body.getAttribute("data-md-color-scheme");
  var dark = scheme === "slate" || (!scheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? "dark" : "neutral",
    securityLevel: "loose",
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" }
  });
  function draw() {
    nodes.forEach(function (n, i) {
      if (n.querySelector("svg")) return;
      var src = n.dataset.src || n.textContent;
      mermaid.render("mmd-" + i, src).then(function (r) {
        n.innerHTML = r.svg;
        if (r.bindFunctions) r.bindFunctions(n);
      }).catch(function (e) {
        console.error("mermaid render failed:", e);
        n.textContent = src;
      });
    });
  }
  if (document.readyState === "complete") draw(); else window.addEventListener("load", draw);
})();
