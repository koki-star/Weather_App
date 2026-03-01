# Weather App 🌤️

This is a simple Weather App I built using vanilla HTML, CSS, and JavaScript. It connects to the Open-Meteo API to fetch real-time weather data based on a city name entered by the user.

The app first converts the city name into latitude and longitude using a geocoding API, then uses those coordinates to retrieve the current weather.

## Features

* Search weather by city name
* Displays temperature in Fahrenheit (°F)
* Shows wind speed in mph
* Default weather loads for Seattle on page load
* Handles errors (blank input, city not found, API issues)
* Responsive and clean UI design

## How It Works

1. User enters a city name.
2. The app fetches latitude and longitude from the geocoding API.
3. It then fetches current weather data using those coordinates.
4. The temperature and wind speed are displayed in a styled weather card.

## Tech Used

* HTML
* CSS
* JavaScript (ES6 async/await)
* Open-Meteo API

## Test Cases

### Normal Cases

* Seattle
* London
* Tokyo

### Edge Cases

* Blank input
* Random text (e.g., asdfasdf)
* Extremely long invalid city name

## How to Run

1. Clone the repository.
2. Open `index.html` in your browser.
3. Start searching for cities.

---

This project was built to practice integrating third-party APIs, handling asynchronous JavaScript, and building a clean, user-friendly interface.
