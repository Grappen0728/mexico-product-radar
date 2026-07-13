(() => {
  const search = document.querySelector("#archive-search");
  const platform = document.querySelector("#archive-platform");
  const verdict = document.querySelector("#archive-verdict");
  const date = document.querySelector("#archive-date");
  const count = document.querySelector("#archive-count");
  const cards = [...document.querySelectorAll("[data-report-card]")];

  if (platform instanceof HTMLSelectElement && ![...platform.options].some((option) => option.value === "TM")) {
    const temu = document.createElement("option");
    temu.value = "TM";
    temu.textContent = "TM";
    platform.append(temu);
  }

  const hasLegacyAmazon = cards.some((card) => (card.dataset.platforms ?? "").split(" ").includes("AMZ"));
  if (platform instanceof HTMLSelectElement && hasLegacyAmazon && ![...platform.options].some((option) => option.value === "AMZ")) {
    const legacyAmazon = document.createElement("option");
    legacyAmazon.value = "AMZ";
    legacyAmazon.textContent = "AMZ（历史）";
    platform.append(legacyAmazon);
  }

  if (!(search instanceof HTMLInputElement) || !(platform instanceof HTMLSelectElement) ||
      !(verdict instanceof HTMLSelectElement) || !(date instanceof HTMLSelectElement) ||
      !(count instanceof HTMLElement)) return;

  const filter = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const matches = (!query || (card.dataset.search ?? "").includes(query)) &&
        (!platform.value || (card.dataset.platforms ?? "").split(" ").includes(platform.value)) &&
        (!verdict.value || card.dataset.verdict === verdict.value) &&
        (!date.value || card.dataset.date === date.value);
      card.hidden = !matches;
      if (matches) visible += 1;
    }
    count.textContent = String(visible);
  };

  search.addEventListener("input", filter);
  platform.addEventListener("change", filter);
  verdict.addEventListener("change", filter);
  date.addEventListener("change", filter);
})();
