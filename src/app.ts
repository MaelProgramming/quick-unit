const amountInput = document.getElementById("amount") as HTMLInputElement;
const fromSelect = document.getElementById("from") as HTMLSelectElement;
const toSelect = document.getElementById("to") as HTMLSelectElement;
const resultText = document.getElementById("result") as HTMLParagraphElement;
const convertBtn = document.getElementById("convert") as HTMLButtonElement;
const swapBtn = document.getElementById("swap") as HTMLButtonElement;

const CACHE_KEY = "currencyRates";
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1h de cache

// === Récupération des taux depuis open.er-api.com ===
async function fetchRates(base: string): Promise<Record<string, number>> {
  const cached = localStorage.getItem(CACHE_KEY);

  if (cached) {
    const { timestamp, base: cachedBase, rates } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION_MS;

    if (!isExpired && cachedBase === base && rates) {
      console.log("💾 Using cached rates");
      return rates;
    }
  }

  console.log("🌍 Fetching new rates...");
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!res.ok) throw new Error("Erreur réseau");

  const data = await res.json();
  if (!data || !data.rates) {
    console.error(data);
    throw new Error("Réponse API invalide : aucun taux trouvé");
  }

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ timestamp: Date.now(), base, rates: data.rates })
  );

  return data.rates;
}

// === Fonction de conversion ===
async function convertCurrency() {
  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (isNaN(amount) || amount <= 0) {
    resultText.textContent = "Veuillez entrer une valeur valide.";
    return;
  }

  try {
    const rates = await fetchRates(from);
    const rate = rates[to];

    if (!rate) throw new Error(`Taux introuvable pour ${to}`);

    const converted = amount * rate;
    resultText.textContent = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;
  } catch (err) {
    console.error("Erreur lors de la conversion :", err);
    resultText.textContent = "Erreur lors de la conversion.";
  }
}

// === Événements ===
convertBtn.addEventListener("click", convertCurrency);

// 🔁 Bouton pour échanger les devises
swapBtn.addEventListener("click", () => {
  swapBtn.classList.add("animate");

  setTimeout(() => {
    swapBtn.classList.remove("animate");
  }, 300);

  const from = fromSelect.value;
  const to = toSelect.value;
  fromSelect.value = to;
  toSelect.value = from;

  if (amountInput.value) convertCurrency();
});

// === Sauvegarde des devises choisies ===
fromSelect.value = localStorage.getItem("from") || "EUR";
toSelect.value = localStorage.getItem("to") || "USD";

fromSelect.addEventListener("change", () =>
  localStorage.setItem("from", fromSelect.value)
);
toSelect.addEventListener("change", () =>
  localStorage.setItem("to", toSelect.value)
);
