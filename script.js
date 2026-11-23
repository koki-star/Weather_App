const geoURL = "https://geocoding-api.open-meteo.com/v1/search";
const weatherURL = "https://api.open-meteo.com/v1/forecast";
const wikiSummaryURL = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const commonsURL = "https://commons.wikimedia.org/w/api.php";

const form = document.getElementById("searchForm");
const button = document.getElementById("getWeatherBtn");
const cityInput = document.getElementById("cityInput");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const heroEl = document.getElementById("hero");
const photoEl = document.getElementById("heroPhoto");
const creditEl = document.getElementById("photoCredit");

const WEATHER_CODES = {
  0: ["Clear sky", "clear"],
  1: ["Mainly clear", "clear"],
  2: ["Partly cloudy", "partly"],
  3: ["Overcast", "cloud"],
  45: ["Fog", "fog"],
  48: ["Freezing fog", "fog"],
  51: ["Light drizzle", "rain"],
  53: ["Drizzle", "rain"],
  55: ["Heavy drizzle", "rain"],
  56: ["Light freezing drizzle", "rain"],
  57: ["Heavy freezing drizzle", "rain"],
  61: ["Light rain", "rain"],
  63: ["Rain", "rain"],
  65: ["Heavy rain", "rain"],
  66: ["Light freezing rain", "rain"],
  67: ["Heavy freezing rain", "rain"],
  71: ["Light snow", "snow"],
  73: ["Snow", "snow"],
  75: ["Heavy snow", "snow"],
  77: ["Snow grains", "snow"],
  80: ["Light rain showers", "rain"],
  81: ["Rain showers", "rain"],
  82: ["Heavy rain showers", "rain"],
  85: ["Light snow showers", "snow"],
  86: ["Heavy snow showers", "snow"],
  95: ["Thunderstorm", "storm"],
  96: ["Thunderstorm with hail", "storm"],
  99: ["Severe thunderstorm with hail", "storm"],
};

const ICON_PATHS = {
  sun: [
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  ],
  moon: ["M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"],
  cloud: ["M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 11.2 3.5 3.5 0 0 0 7 18z"],
  partly: [
    "M8 5.5a2.5 2.5 0 1 0 0 5",
    "M8 1.5v1.5M2 8h1.5M3.8 3.8l1 1M12.2 3.8l-1 1",
    "M9 21h8a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 8 15.2 3 3 0 0 0 9 21z",
  ],
  fog: ["M4 8h16M6 12h12M4 16h16M8 20h8"],
  rain: [
    "M7 14h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 7.2 3.5 3.5 0 0 0 7 14z",
    "M8 17l-1 3M12 17l-1 3M16 17l-1 3",
  ],
  snow: [
    "M7 14h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 7.2 3.5 3.5 0 0 0 7 14z",
    "M8 17.5h.01M12 18.5h.01M16 17.5h.01M10 21h.01M14 21h.01",
  ],
  storm: [
    "M7 14h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 7.2 3.5 3.5 0 0 0 7 14z",
    "M12.5 14.5L10 18h3l-1.5 3.5",
  ],
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Only these licenses are allowed for photos
const FREE_LICENSE = /^(CC BY(-SA)? \d\.\d(\s[A-Za-z]{2,})?|CC0(\s[\d.]+)?(\s[A-Za-z]+)?|Public domain|PD[\s-].*)$/i;

let requestId = 0;

// ---------- Helpers ----------

function describeCode(code) {
  return WEATHER_CODES[code] || ["Unknown", "cloud"];
}

function makeIcon(code, isDay = 1) {
  let kind = describeCode(code)[1];
  if (kind === "clear" || kind === "partly") {
    if (kind === "clear") kind = isDay ? "sun" : "moon";
  }
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.6");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const d of ICON_PATHS[kind]) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  }
  return svg;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setText(id, text) {
  document.getElementById(id).textContent = text;
}

const deg = (n) => `${Math.round(n)}°`;

// Times from the API look like "2026-11-16T17:00" and are already in the city's time zone
function formatHour(iso) {
  const hour = Number(iso.slice(11, 13));
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12} ${suffix}`;
}

function formatClock(iso) {
  const hour = Number(iso.slice(11, 13));
  const minute = iso.slice(14, 16);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function weekday(isoDate) {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return DAY_NAMES[new Date(y, m - 1, d).getDay()];
}

function compass(degrees) {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(degrees / 45) % 8];
}

function setStatus(message, kind = "") {
  statusEl.textContent = message;
  statusEl.className = kind ? `is-${kind}` : "";
}

// ---------- Weather ----------

async function fetchPlace(city) {
  const response = await fetch(
    `${geoURL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  if (!response.ok) throw new Error(`Geocoding API error: ${response.status}`);
  const data = await response.json();
  return data.results && data.results.length > 0 ? data.results[0] : null;
}

async function fetchForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
    forecast_days: "7",
  });
  const response = await fetch(`${weatherURL}?${params}`);
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  const data = await response.json();
  if (!data.current || !data.hourly || !data.daily) {
    throw new Error("Missing forecast data in response.");
  }
  return data;
}

function renderCurrent(place, data) {
  const { current, daily } = data;
  const [condition] = describeCode(current.weather_code);

  setText("cityName", place.name);
  setText(
    "placeMeta",
    `${[place.admin1, place.country].filter(Boolean).join(", ")}  ·  Local time ${formatClock(current.time)}`
  );
  setText("temp", deg(current.temperature_2m));
  setText("condText", condition);
  setText("highLow", `High ${deg(daily.temperature_2m_max[0])}  ·  Low ${deg(daily.temperature_2m_min[0])}`);

  const iconBox = document.getElementById("condIcon");
  iconBox.replaceChildren(makeIcon(current.weather_code, current.is_day));

  setText("feels", deg(current.apparent_temperature));
  setText("humidity", `${Math.round(current.relative_humidity_2m)}%`);
  setText("wind", `${Math.round(current.wind_speed_10m)} mph ${compass(current.wind_direction_10m)}`);
  setText("rainChance", `${daily.precipitation_probability_max[0]}%`);
  setText("sunrise", formatClock(daily.sunrise[0]));
  setText("sunset", formatClock(daily.sunset[0]));
}

function renderHourly(data) {
  const { hourly, current } = data;
  const nowHour = current.time.slice(0, 13);
  let start = hourly.time.findIndex((t) => t.slice(0, 13) >= nowHour);
  if (start === -1) start = 0;

  const list = document.getElementById("hourly");
  list.replaceChildren();

  for (let i = start; i < Math.min(start + 24, hourly.time.length); i++) {
    const item = el("li", "hour");
    item.appendChild(el("span", "hour-time", i === start ? "Now" : formatHour(hourly.time[i])));
    const icon = el("span", "hour-icon");
    icon.appendChild(makeIcon(hourly.weather_code[i], hourly.is_day[i]));
    item.appendChild(icon);
    item.appendChild(el("span", "hour-temp", deg(hourly.temperature_2m[i])));
    const rain = hourly.precipitation_probability[i];
    item.appendChild(el("span", "hour-rain", rain > 0 ? `${rain}%` : ""));
    list.appendChild(item);
  }
  list.scrollLeft = 0;
}

function renderDaily(data) {
  const { daily } = data;
  const weekMin = Math.min(...daily.temperature_2m_min);
  const weekMax = Math.max(...daily.temperature_2m_max);
  const span = weekMax - weekMin || 1;

  const list = document.getElementById("daily");
  list.replaceChildren();

  daily.time.forEach((date, i) => {
    const item = el("li", "day");
    item.appendChild(el("span", "day-name", i === 0 ? "Today" : weekday(date)));

    const icon = el("span", "day-icon");
    icon.appendChild(makeIcon(daily.weather_code[i], 1));
    item.appendChild(icon);

    item.appendChild(el("span", "day-cond", describeCode(daily.weather_code[i])[0]));
    item.appendChild(el("span", "day-rain", `${daily.precipitation_probability_max[i]}%`));
    item.appendChild(el("span", "day-low", deg(daily.temperature_2m_min[i])));

    const track = el("span", "range");
    const fill = el("span", "range-fill");
    const left = ((daily.temperature_2m_min[i] - weekMin) / span) * 100;
    const width = ((daily.temperature_2m_max[i] - daily.temperature_2m_min[i]) / span) * 100;
    fill.style.left = `${left}%`;
    fill.style.width = `${Math.max(width, 4)}%`;
    track.appendChild(fill);
    item.appendChild(track);

    item.appendChild(el("span", "day-high", deg(daily.temperature_2m_max[i])));
    list.appendChild(item);
  });
}

// ---------- City photo (Wikimedia Commons, free licenses only) ----------

function hidePhoto() {
  photoEl.classList.remove("is-loaded");
  photoEl.removeAttribute("src");
  photoEl.alt = "";
  heroEl.classList.remove("has-photo", "no-photo");
  creditEl.hidden = true;
  creditEl.replaceChildren();
}

// Wikipedia summaries for a few candidate titles. The coordinates must be near
// the geocoding result, so "Paris" cannot turn into a different place.
async function findWikiImage(place) {
  const titles = [place.name];
  if (place.admin1) titles.push(`${place.name}, ${place.admin1}`);
  if (place.country) titles.push(`${place.name}, ${place.country}`);

  for (const title of titles) {
    try {
      const response = await fetch(`${wikiSummaryURL}${encodeURIComponent(title.replace(/ /g, "_"))}`);
      if (!response.ok) continue;
      const summary = await response.json();
      if (summary.type !== "standard" || !summary.coordinates) continue;

      const nearLat = Math.abs(summary.coordinates.lat - place.latitude) < 1;
      const nearLon = Math.abs(summary.coordinates.lon - place.longitude) < 1;
      if (!nearLat || !nearLon) continue;

      const source = (summary.thumbnail || summary.originalimage || {}).source;
      if (source) return source;
    } catch (error) {
      // Try the next title
    }
  }
  return null;
}

function commonsFileName(imageUrl) {
  const url = new URL(imageUrl);
  if (!url.pathname.startsWith("/wikipedia/commons/")) return null;
  const parts = url.pathname.split("/");
  const thumbAt = parts.indexOf("thumb");
  const name = thumbAt === -1 ? parts[parts.length - 1] : parts[thumbAt + 3];
  return name ? decodeURIComponent(name) : null;
}

function plainText(html) {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

async function getFreePhoto(place) {
  const imageUrl = await findWikiImage(place);
  if (!imageUrl) return null;
  const fileName = commonsFileName(imageUrl);
  if (!fileName) return null;

  const params = new URLSearchParams({
    action: "query",
    titles: `File:${fileName}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1600",
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const response = await fetch(`${commonsURL}?${params}`);
  if (!response.ok) return null;
  const data = await response.json();
  const info = data.query && data.query.pages && data.query.pages[0] && data.query.pages[0].imageinfo;
  if (!info || !info[0]) return null;

  const meta = info[0].extmetadata || {};
  const license = plainText(meta.LicenseShortName && meta.LicenseShortName.value);
  const nonFree = meta.NonFree && String(meta.NonFree.value).toLowerCase() === "true";
  if (nonFree || !FREE_LICENSE.test(license) || /-(NC|ND)\b/i.test(license)) return null;

  let author = plainText(meta.Artist && meta.Artist.value);
  const isPublicDomain = /^(CC0|Public domain|PD)/i.test(license);
  if (!author) {
    if (!isPublicDomain) return null;
    author = "Unknown author";
  }
  if (author.length > 60) author = `${author.slice(0, 57)}...`;

  const photoSrc = info[0].thumburl || info[0].url;
  const pageUrl = info[0].descriptionurl;
  const trusted = (u) => typeof u === "string" && /^https:\/\/(commons|upload|thumb)\.wikimedia\.org\//.test(u);
  if (!trusted(photoSrc) || !trusted(pageUrl)) return null;

  return { src: photoSrc, author, license, pageUrl };
}

async function showPhoto(place, id) {
  let photo = null;
  try {
    photo = await getFreePhoto(place);
  } catch (error) {
    photo = null;
  }
  if (id !== requestId) return;
  if (!photo) {
    heroEl.classList.add("no-photo");
    return;
  }

  photoEl.onload = () => {
    if (id !== requestId) return;
    heroEl.classList.add("has-photo");
    photoEl.classList.add("is-loaded");

    creditEl.replaceChildren();
    creditEl.append(`Photo: ${photo.author}, ${photo.license} via `);
    const link = el("a", "", "Wikimedia Commons");
    link.href = photo.pageUrl;
    link.rel = "noopener";
    creditEl.appendChild(link);
    creditEl.hidden = false;
  };
  photoEl.onerror = () => {
    if (id !== requestId) return;
    hidePhoto();
    heroEl.classList.add("no-photo");
  };
  photoEl.alt = place.name;
  photoEl.src = photo.src;
}

// ---------- City suggestions ----------

const suggestList = document.getElementById("citySuggestions");
let suggestTimer = null;
let suggestController = null;
let suggestSeq = 0;
let suggestions = [];
let activeIndex = -1;

function isPlace(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.latitude === "number" &&
      typeof value.longitude === "number" &&
      value.name
  );
}

function placeRegion(place) {
  return [place.admin1, place.country].filter(Boolean).join(", ");
}

function placeInputValue(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}

function closeSuggestions() {
  clearTimeout(suggestTimer);
  suggestTimer = null;
  suggestSeq += 1;
  if (suggestController) {
    suggestController.abort();
    suggestController = null;
  }
  suggestions = [];
  activeIndex = -1;
  suggestList.replaceChildren();
  suggestList.hidden = true;
  cityInput.setAttribute("aria-expanded", "false");
  cityInput.removeAttribute("aria-activedescendant");
}

function setActiveSuggestion(index) {
  const options = suggestList.querySelectorAll('[role="option"]');
  options.forEach((option, i) => {
    const isActive = i === index;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  activeIndex = index;
  if (index >= 0 && options[index]) {
    cityInput.setAttribute("aria-activedescendant", options[index].id);
    options[index].scrollIntoView({ block: "nearest" });
  } else {
    cityInput.removeAttribute("aria-activedescendant");
  }
}

function renderSuggestions(results) {
  suggestList.replaceChildren();
  suggestions = results;
  activeIndex = -1;
  cityInput.removeAttribute("aria-activedescendant");

  if (!results.length) {
    suggestList.hidden = true;
    cityInput.setAttribute("aria-expanded", "false");
    return;
  }

  results.forEach((place, i) => {
    const option = document.createElement("li");
    option.id = `city-option-${i}`;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");

    const name = document.createElement("span");
    name.className = "suggest-name";
    name.textContent = place.name;

    const meta = document.createElement("span");
    meta.className = "suggest-meta";
    meta.textContent = placeRegion(place);

    option.appendChild(name);
    option.appendChild(meta);

    option.addEventListener("mousedown", (event) => {
      event.preventDefault();
      selectSuggestion(place);
    });
    option.addEventListener("mouseenter", () => {
      setActiveSuggestion(i);
    });

    suggestList.appendChild(option);
  });

  suggestList.hidden = false;
  cityInput.setAttribute("aria-expanded", "true");
}

function selectSuggestion(place) {
  cityInput.value = placeInputValue(place);
  closeSuggestions();
  getWeather(place);
}

function rankSuggestions(results) {
  if (!results.length) return [];
  const topName = (results[0].name || "").toLowerCase();
  const sameName = [];
  const rest = [];
  for (const place of results) {
    if ((place.name || "").toLowerCase() === topName) sameName.push(place);
    else rest.push(place);
  }
  // Show other cities with the same name first, so a search like "Par"
  // can include both Paris, France and Paris, Texas in the short list.
  return sameName.concat(rest).slice(0, 6);
}

async function fetchSuggestions(query, signal) {
  // Request extra matches, then keep a short ranked list of 6.
  const url = `${geoURL}?name=${encodeURIComponent(query)}&count=20&language=en&format=json`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Geocoding API error: ${response.status}`);
  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];
  return rankSuggestions(results);
}

function scheduleSuggestions() {
  clearTimeout(suggestTimer);
  const query = cityInput.value.trim();
  if (query.length < 2) {
    closeSuggestions();
    return;
  }

  suggestTimer = setTimeout(async () => {
    const seq = ++suggestSeq;
    if (suggestController) suggestController.abort();
    suggestController = new AbortController();
    const { signal } = suggestController;

    try {
      const results = await fetchSuggestions(query, signal);
      if (seq !== suggestSeq) return;
      renderSuggestions(results);
    } catch (error) {
      if (error.name === "AbortError") return;
      if (seq !== suggestSeq) return;
      closeSuggestions();
    }
  }, 250);
}

cityInput.addEventListener("input", scheduleSuggestions);

cityInput.addEventListener("keydown", (event) => {
  const open = !suggestList.hidden && suggestions.length > 0;

  if (event.key === "ArrowDown") {
    if (!open) return;
    event.preventDefault();
    const next = activeIndex < suggestions.length - 1 ? activeIndex + 1 : 0;
    setActiveSuggestion(next);
  } else if (event.key === "ArrowUp") {
    if (!open) return;
    event.preventDefault();
    const next = activeIndex > 0 ? activeIndex - 1 : suggestions.length - 1;
    setActiveSuggestion(next);
  } else if (event.key === "Enter") {
    if (open && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  } else if (event.key === "Escape") {
    if (open) {
      event.preventDefault();
      closeSuggestions();
    }
  }
});

document.addEventListener("click", (event) => {
  const field = cityInput.closest(".search-field");
  if (field && !field.contains(event.target)) {
    closeSuggestions();
  }
});

// ---------- Search ----------

async function getWeather(cityOrPlace) {
  closeSuggestions();
  const id = ++requestId;
  setStatus("Loading...", "loading");
  button.disabled = true;
  const originalBtnText = button.textContent;
  button.textContent = "Loading...";
  resultsEl.setAttribute("aria-busy", "true");

  try {
    const place = isPlace(cityOrPlace) ? cityOrPlace : await fetchPlace(cityOrPlace);
    if (id !== requestId) return;

    if (!place) {
      resultsEl.hidden = true;
      document.title = "Weather App";
      setStatus("City not found. Try a different city name.", "error");
      return;
    }

    const data = await fetchForecast(place.latitude, place.longitude);
    if (id !== requestId) return;

    hidePhoto();
    renderCurrent(place, data);
    renderHourly(data);
    renderDaily(data);
    resultsEl.hidden = false;
    document.title = `${place.name} weather`;
    setStatus("");

    showPhoto(place, id);
  } catch (error) {
    if (id !== requestId) return;
    console.error(error);
    resultsEl.hidden = true;
    document.title = "Weather App";
    setStatus("Something went wrong. Please try again in a moment.", "error");
  } finally {
    if (id === requestId) {
      button.disabled = false;
      button.textContent = originalBtnText;
      resultsEl.removeAttribute("aria-busy");
    }
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  closeSuggestions();
  const city = cityInput.value.trim();

  if (city === "") {
    setStatus("Please enter a city name.", "error");
    cityInput.focus();
    return;
  }

  getWeather(city);
});

// Default city on load
window.addEventListener("load", () => {
  cityInput.value = "Seattle";
  getWeather("Seattle");
});
