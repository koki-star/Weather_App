const geoURL = "https://geocoding-api.open-meteo.com/v1/search";
const weatherURL = "https://api.open-meteo.com/v1/forecast";

const button = document.getElementById("getWeatherBtn");
const cityInput = document.getElementById("cityInput");

const titleEl = document.getElementById("pageTitle");
const tempDiv = document.getElementById("temp");
const detailsDiv = document.getElementById("details");
const statusDiv = document.getElementById("status");

// Default city on load
window.addEventListener("load", () => {
  cityInput.value = "Seattle";
  getWeather("Seattle");
});

button.addEventListener("click", () => {
  const city = cityInput.value.trim();

  if (city === "") {
    statusDiv.textContent = "Please enter a city name.";
    statusDiv.className = "is-error";
    cityInput.focus();
    return;
  }

  getWeather(city);
});

async function getWeather(city) {
  statusDiv.textContent = "Loading...";
  statusDiv.className = "is-loading";
  button.disabled = true;

  const originalBtnText = button.textContent;
  button.textContent = "Loading...";

  try {
    tempDiv.textContent = "--°";
    detailsDiv.textContent = "";

    // 1) Get latitude & longitude from city name
    const geoResponse = await fetch(
      `${geoURL}?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      statusDiv.textContent = "City not found.";
      statusDiv.className = "is-error";
      titleEl.textContent = "Weather App";
      detailsDiv.textContent = "Try a different city name.";
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // 2) Fetch weather using lat/lon (Fahrenheit + mph)
    const weatherResponse = await fetch(
      `${weatherURL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`
    );

    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();

    if (!weatherData.current_weather) {
      throw new Error("Missing current_weather in response.");
    }

    const temperature = weatherData.current_weather.temperature;
    const windSpeed = weatherData.current_weather.windspeed;

    // 3) Show the result in the card
    titleEl.textContent = `${name} Weather`;
    tempDiv.textContent = `${temperature}°F`;
    detailsDiv.textContent = `${name}, ${country} • Wind: ${windSpeed} mph`;

    statusDiv.textContent = "Ready";
    statusDiv.className = "";
  } catch (error) {
    console.error(error);
    statusDiv.textContent = "Something went wrong.";
    statusDiv.className = "is-error";
    titleEl.textContent = "Weather App";
    detailsDiv.textContent = "Please try again in a moment.";
  } finally {
    button.disabled = false;
    button.textContent = originalBtnText;
  }
}
