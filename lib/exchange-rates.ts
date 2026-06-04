export interface ExchangeRates {
  [currency: string]: number
}

// Exchange rates relative to USD (1 USD = X currency)
const FALLBACK_EXCHANGE_RATES: ExchangeRates = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  AUD: 1.52,
  CAD: 1.38,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.08,
  BRL: 4.97,
  ZAR: 18.15,
  SGD: 1.34,
  HKD: 7.82,
  KRW: 1320.5,
  TRY: 32.15,
}

let cachedRates: ExchangeRates | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Fetch live exchange rates from exchangerate-api.com (free tier)
 * Caches rates for 24 hours to avoid hitting rate limits
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Check if we have valid cached rates
  const now = Date.now()
  if (cachedRates && now - cacheTimestamp < CACHE_DURATION) {
    console.log("[v0] Using cached exchange rates")
    return cachedRates
  }

  try {
    console.log("[v0] Fetching live exchange rates from API...")
    // Using exchangerate-api.com free tier (1,500 requests/month)
    const response = await fetch("https://open.exchangerate-api.com/v6/latest/USD")

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json()

    if (data.result === "success" && data.rates) {
      cachedRates = data.rates
      cacheTimestamp = now
      console.log("[v0] Successfully fetched and cached exchange rates")
      return cachedRates!
    } else {
      throw new Error("Invalid API response format")
    }
  } catch (error) {
    console.error("[v0] Failed to fetch exchange rates, using fallback:", error)
    return FALLBACK_EXCHANGE_RATES
  }
}

/**
 * Get exchange rates (from cache, API, or fallback)
 */
async function getExchangeRates(): Promise<ExchangeRates> {
  // If we have cached rates, return them immediately
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedRates
  }

  // Otherwise fetch new rates
  return await fetchExchangeRates()
}

/**
 * Convert an amount from one currency to another using live rates
 * @param amount - The amount to convert
 * @param fromCurrency - The source currency code
 * @param toCurrency - The target currency code
 * @returns The converted amount
 */
export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rates = await getExchangeRates()
  const fromRate = rates[fromCurrency]
  const toRate = rates[toCurrency]

  if (!fromRate || !toRate) {
    console.error(`[v0] Exchange rate not found for ${fromCurrency} or ${toCurrency}`)
    return amount // Return original amount if rates not found
  }

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate
  const convertedAmount = amountInUSD * toRate

  return convertedAmount
}

/**
 * Synchronous version using cached or fallback rates
 * Use this when you can't await (e.g., in components)
 */
export function convertCurrencySync(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rates = cachedRates || FALLBACK_EXCHANGE_RATES
  const fromRate = rates[fromCurrency]
  const toRate = rates[toCurrency]

  if (!fromRate || !toRate) {
    console.error(`[v0] Exchange rate not found for ${fromCurrency} or ${toCurrency}`)
    return amount
  }

  const amountInUSD = amount / fromRate
  const convertedAmount = amountInUSD * toRate

  return convertedAmount
}

/**
 * Format a converted amount with currency symbol
 */
export function formatConvertedAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  showOriginal = false,
): string {
  const convertedAmount = convertCurrencySync(amount, fromCurrency, toCurrency)
  const currencies = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
    CHF: "CHF",
    CNY: "¥",
    INR: "₹",
    MXN: "Mex$",
    BRL: "R$",
    ZAR: "R",
    SGD: "S$",
    HKD: "HK$",
    KRW: "₩",
    TRY: "₺",
  }

  const symbol = currencies[toCurrency as keyof typeof currencies] || toCurrency
  const formatted = `${symbol}${convertedAmount.toFixed(2)}`

  if (showOriginal && fromCurrency !== toCurrency) {
    const originalSymbol = currencies[fromCurrency as keyof typeof currencies] || fromCurrency
    return `${formatted} (${originalSymbol}${amount.toFixed(2)})`
  }

  return formatted
}

if (typeof window === "undefined") {
  // Only fetch on server-side to avoid CORS issues
  fetchExchangeRates().catch(() => {
    console.log("[v0] Initial rate fetch failed, will use fallback rates")
  })
}
