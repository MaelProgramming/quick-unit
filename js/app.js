const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const resultText = document.getElementById("result");
const convertBtn = document.getElementById("convert");
const swapBtn = document.getElementById("swap");

const CACHE_KEY = "currencyRates";
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1h

async function fetchRates(base) {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const data = JSON.parse(cached);
    const isExpired = Date.now() - data.timestamp > CACHE_DURATION_MS;
    if (!isExpired && data.base === base && data.rates) return data.rates;
  }

  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!res.ok) throw new Error("Erreur réseau");

  const data = await res.json();
  if (!data || !data.rates) throw new Error("Réponse API invalide : aucun taux trouvé");

  localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), base, rates: data.rates }));
  return data.rates;
}

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

convertBtn.addEventListener("click", convertCurrency);

swapBtn.addEventListener("click", () => {
  swapBtn.classList.add("animate");
  setTimeout(() => swapBtn.classList.remove("animate"), 300);

  const from = fromSelect.value;
  const to = toSelect.value;
  fromSelect.value = to;
  toSelect.value = from;

  if (amountInput.value) convertCurrency();
});
