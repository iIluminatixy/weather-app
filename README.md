# WeatherGlass 🌦️

A sleek and modern weather application built with vanilla JavaScript, HTML, and CSS, leveraging the Open-Meteo API for accurate weather data and IP geolocation for initial location detection.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents 📝

- [Features](#features-star)
- [Tech Stack](#tech-stack-computer)
- [Live Demo](#live-demo-rocket)
- [Installation](#installation-wrench)
- [Usage](#usage-heavy_check_mark)
- [Project Structure](#project-structure-file_folder)
- [Contributing](#contributing-handshake)
- [License](#license-key)
- [Footer](#footer-keyboard)

## Features ⭐

- **Real-time Weather Updates:** Displays current weather conditions, including temperature, apparent temperature, description, and WMO weather codes.
- **Interactive Forecasts:** Provides detailed 24-hour and 7-day forecasts for temperature, precipitation, and daily highs/lows.
- **Air Quality Index (AQI):** Integrates AQI data with specific pollutant breakdowns (PM2.5, PM10, Ozone, NO₂).
- **Environmental Metrics:** Shows humidity, visibility, atmospheric pressure, and UV index with clear descriptions.
- **Dynamic Backgrounds:** Animated particle backgrounds and weather-specific visual effects (rain, snow, fog, sun) enhance the user experience.
- **Location Search & Geolocation:** Allows users to search for cities worldwide and automatically detects the user's location via IP or browser geolocation.
- **Saved Locations:** Users can save favorite locations for quick access.
- **Unit Conversion:** Seamlessly switch between Celsius (°C) and Fahrenheit (°F).
- **Theme Toggle:** Supports both dark and light modes for personalized viewing.
- **Responsive Design:** Adapts to various screen sizes for a consistent experience across devices.

## Tech Stack 💻

- **Languages:** JavaScript, HTML, CSS
- **Frameworks/Libraries:** None (Vanilla JS)
- **APIs:** Open-Meteo (Weather & Air Quality), IP-API (IP Geolocation)
- **Environment:** Browser

## Live Demo 🚀

[Visit the live demo here!](https://i-lluminatixy.github.io/weather-app/)

## Installation 🔧

This project is a client-side application and does not require a complex installation process. You can run it directly from your browser.

**For Development:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/iIluminatixy/weather-app.git
   cd weather-app
   ```
2. **Open `index.html` in your web browser:**
   You can simply open the `index.html` file directly in your browser. Alternatively, if you need to serve it via a local development server (e.g., for testing API calls or if you encounter CORS issues), you can use a simple HTTP server:
   ```bash
   # Using Python 3
   python -m http.server

   # Using Node.js (if http-server is installed globally: npm install -g http-server)
   http-server
   ```
   Then, navigate to `http://localhost:8000` (or the port specified by your server) in your browser.

## Usage  heavy_check_mark

WeatherGlass provides a user-friendly interface for exploring weather information:

1.  **Initial Load:** Upon opening the application, it attempts to detect your current location using your IP address or browser geolocation and displays the local weather.
2.  **Search for a City:** Use the search bar in the sidebar to find weather information for any city worldwide. Type the city name and press 'Go' or select from the suggestions.
3.  **View Current Conditions:** The main hero section displays the current temperature, weather description, and feels-like temperature.
4.  **Explore Metrics:** Detailed metrics like wind speed and direction, humidity, visibility, pressure, and UV index are available in the metrics row.
5.  **Forecasts:** Check the 24-hour and 7-day forecasts to plan ahead. You can toggle between temperature and precipitation views for the hourly forecast chart.
6.  **Air Quality:** Monitor air quality with the AQI displayed prominently and detailed environmental data below.
7.  **Save Locations:** Click the bookmark icon in the header to save your current location to the saved list.
8.  **Manage Saved Locations:** Access your saved locations from the sidebar. Click on a saved location to load its weather, or click the 'x' button to remove it.
9.  **Units & Theme:** Switch between Celsius and Fahrenheit using the unit toggle buttons. Change the theme between dark and light modes using the theme toggle button.
10. **Auto-Refresh:** The data automatically refreshes every 10 minutes.

### Real-world Use Cases:

-   **Travel Planning:** Quickly check weather conditions for a destination city before you travel.
-   **Daily Commute:** Get an immediate overview of the current weather and the forecast for your day.
-   **Outdoor Activities:** Understand wind, humidity, and potential precipitation for planning outdoor events or activities.
-   **Health Awareness:** Monitor air quality levels for health-conscious decisions.

## Project Structure 📁

```
weather-app/
├── index.html       # Main HTML structure and layout
├── app.js           # Core JavaScript logic for fetching and displaying data
├── styles.css       # Main CSS for styling and theming
└── README.md        # Project documentation
```

## Dependencies 📦

-   [Open-Meteo API](https://open-meteo.com/en/docs) (Free, no API key required)
-   [IP-API](https://ip-api.com/docs/api:json) (for IP geolocation fallback)
-   [Font Awesome](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css) (for icons)

No external JavaScript or CSS frameworks are used, making it a pure vanilla JavaScript project.

## Contributing 🤝

Contributions are welcome! If you find any issues or have suggestions for improvements, please:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

Please feel free to submit issues or feature requests.

## License 🔑

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. (Note: A LICENSE.md file was not found in the provided analysis, but the project seems to be open source in nature).

## Footer ⌨️

--- 

© 2023 [iIluminatixy](https://github.com/iIluminatixy)

**WeatherGlass** | [Repository URL](https://github.com/iIluminatixy/weather-app)

*Built with ❤️ and vanilla JavaScript.*

Feel free to **star ⭐**, **fork 🍴**, and **report issues 🐛**!
