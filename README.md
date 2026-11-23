# Weather App

A weather app for any city, built with plain HTML, CSS and JavaScript. Type a city and see the current weather, the next 24 hours and a 7-day forecast, with a photo of the city. I made it for my Application Development class at North Seattle College.

**Live demo:** https://koki-star.github.io/Weather_App/

## Features

* Search any city by name (press Enter or click the button)
* Search suggestions appear as you type a city or country, so you can pick the exact place
* Current temperature, weather condition, feels-like, humidity, wind, chance of rain, sunrise and sunset
* High and low for today
* Hourly strip for the next 24 hours
* 7-day forecast with a temperature range bar
* City photo with a credit line, shown only when the photo has a free license
* Seattle loads by default
* Clear messages for an empty search, an unknown city and a failed request
* Works on phone, tablet and desktop, with visible keyboard focus

## Built with

* HTML, CSS and JavaScript (async/await, fetch), no frameworks
* [Open-Meteo](https://open-meteo.com/) geocoding and forecast APIs (no API key needed)
* Wikipedia and Wikimedia Commons APIs for the city photos
* Inline SVG icons

## How it works

1. The geocoding API turns the city name into coordinates.
2. The forecast API returns the current, hourly and daily weather for those coordinates in the city's own time zone.
3. The app finds the city's Wikipedia page and checks that its coordinates match the city. This avoids the wrong "Paris".
4. It reads the photo's license and author from Wikimedia Commons. Only CC BY, CC BY-SA, CC0 and public domain photos are shown. If a photo is missing or not free, the page shows no photo.
5. All data is added to the page with `textContent`, never `innerHTML`.

## Run it

1. Clone the repository.
2. Open `index.html` in a browser.

## Credits

* Weather data by [Open-Meteo.com](https://open-meteo.com/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
* City photos come from [Wikimedia Commons](https://commons.wikimedia.org/). Each photo keeps its own license, and the author and license are shown under the photo with a link to its page.

## Testing

There is no automated test suite. These cases were checked in Chrome: Seattle, Tokyo, Paris, Nairobi, an empty search, and text that is not a city (`asdfasdf`), on phone and desktop widths.
