(() => {
  const search = document.querySelector("#archive-search");
  const platform = document.querySelector("#archive-platform");
  const verdict = document.querySelector("#archive-verdict");
  const count = document.querySelector("#archive-count");
  const cards = [...document.querySelectorAll("[data-report-card]")];

  if (platform instanceof HTMLSelectElement && ![...platform.options].some((option) => option.value === "AMZ")) {
    const amazon = document.createElement("option");
    amazon.value = "AMZ";
    amazon.textContent = "AMZ";
    const mercadoLibre = [...platform.options].find((option) => option.value === "MKD");
    platform.insertBefore(amazon, mercadoLibre ?? null);
  }

  if (!(search instanceof HTMLInputElement) || !(platform instanceof HTMLSelectElement) ||
      !(verdict instanceof HTMLSelectElement) || !(count instanceof HTMLElement)) return;

  const filter = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const matches = (!query || (card.dataset.search ?? "").includes(query)) &&
        (!platform.value || (card.dataset.platforms ?? "").split(" ").includes(platform.value)) &&
        (!verdict.value || card.dataset.verdict === verdict.value);
      card.hidden = !matches;
      if (matches) visible += 1;
    }
    count.textContent = String(visible);
  };

  search.addEventListener("input", filter);
  platform.addEventListener("change", filter);
  verdict.addEventListener("change", filter);
})();
