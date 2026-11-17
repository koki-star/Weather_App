# Weather App

College assignment (Application Development, North Seattle College). A one-page weather app in plain HTML, CSS, and JavaScript. You type a city name and it shows the current temperature and wind speed.

Live demo: https://koki-star.github.io/Weather_App/

The app calls the Open-Meteo geocoding API to turn the city name into latitude and longitude, then calls the Open-Meteo forecast API with those coordinates.

## Features

* Search weather by city name
* Temperature in Fahrenheit and wind speed in mph
* Seattle loads by default when the page opens
* Loading state while a request is running
* Press Enter or click the button to search
* Error messages for blank input, unknown city, and failed requests

## How it works

1. You enter a city name.
2. The app requests latitude and longitude from the geocoding API.
3. It requests current weather for those coordinates.
4. Temperature, location, and wind speed appear in the weather card.

## Built with

* HTML
* CSS
* JavaScript (async/await, fetch)
* Open-Meteo API (no API key needed)

## Credit

Weather data by [Open-Meteo.com](https://open-meteo.com/), used under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license.

## Run it

1. Clone the repository.
2. Open `index.html` in a browser.
3. Search for a city.

## Manual checks

I tested these by hand. There is no automated test suite in this project.

* Normal: Seattle, London, Tokyo
* Blank input
* Text that is not a city, for example `asdfasdf`
* A very long invalid city name
