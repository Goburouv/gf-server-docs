/* Render div.mermaid blocks (pymdownx fence_div_format) with the page's color scheme. */
(function () {
  if (typeof mermaid === "undefined") return;
  var scheme = document.body && document.body.getAttribute("data-md-color-scheme");
  var dark = scheme === "slate" || (!scheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  mermaid.initialize({
    startOnLoad: true,
    theme: dark ? "dark" : "neutral",
    securityLevel: "loose",
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" }
  });
})();
