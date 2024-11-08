const app = document.querySelector('.weather-app');
const temp = document.querySelector('.temp');
const dateOutput = document.querySelector('.date');
const conditionOutput = document.querySelector('.condition');
const nameOutput = document.querySelector('.name');
const icon = document.querySelector('.icon');
const cloudOutput = document.querySelector('.cloud');
const humidityOutput = document.querySelector('.humidity');
const windOutput = document.querySelector('.wind');
const form = document.getElementById('locationInput');
const search = document.querySelector('.search');
const btn = document.querySelector('.submit');
const cities = document.querySelectorAll('.city');
const apiKey = "35332cd8afaccfbbdbe59a28692df8cb"; // Your OpenWeatherMap API key
const unsplashApiKey = "cIPowvtHUx2oqc4pSFGsNOGSl6Eg8vD4GMLqJSb1Dko"; // Your Unsplash API key

let cityInput = "";

// City selection from the list
cities.forEach((city) => {
    city.addEventListener('click', async (e) => {
        cityInput = e.target.innerHTML;
        await fetchWeatherData();
    });
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (search.value.length === 0) {
        alert("Please type in a city name");
    } else {
        cityInput = search.value;
        await fetchWeatherData();
        search.value = '';
    }
});

// Get the day of the week
const dayOfTheWeek = (date) => {
    const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return weekday[date.getDay()];
};

// Get location name based on coordinates
const getLocationName = async (lat, long) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${long}&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    cityInput = data.address.city || data.address.state;
    nameOutput.innerHTML = cityInput;
    await fetchWeatherData();
};

// Handle successful geolocation
const success = (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    getLocationName(latitude, longitude);
};

// Handle geolocation error
const error = (error) => {
    console.error("Error message:", error);
};

// Default location based on geolocation
const defaultValues = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    }
};

document.addEventListener('DOMContentLoaded', defaultValues);

// Loading indicator
const setLoading = (isLoading) => {
    app.style.opacity = isLoading ? "0.5" : "1";
    if (isLoading) {
        app.classList.add('loading');
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.textContent = 'Loading...';
        app.appendChild(loader);
    } else {
        const loader = document.querySelector('.loader');
        if (loader) loader.remove();
        app.classList.remove('loading');
    }
};

const fetchWeatherData = async () => {
    setLoading(true);
    const weatherDetailsContainer = document.querySelector('.weather-details');
    const weatherInfoContainer = document.querySelector('.weather-info');

    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&units=metric&appid=${apiKey}`);
        const data = await res.json();

        if (!data.main) {
            alert("City not found. Please try again.");
            weatherDetailsContainer.style.display = 'none';
            weatherInfoContainer.style.display = 'none';
            document.querySelector(".forecast-container").style.display = "none";
            return;
        }

        // Update weather details
        temp.innerHTML = `${data.main.temp.toFixed(1)}&#176;C`;
        conditionOutput.innerHTML = data.weather[0].description;
        const date = new Date(data.dt * 1000);
        dateOutput.innerHTML = `${dayOfTheWeek(date)} ${date.getDate()}, ${date.getMonth() + 1} ${date.getFullYear()}`;
        nameOutput.innerHTML = data.name;
        icon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`; // Optionally keep the OpenWeather icon for display
        cloudOutput.innerHTML = `${data.clouds.all}%`;
        humidityOutput.innerHTML = `${data.main.humidity}%`;
        windOutput.innerHTML = `${data.wind.speed} m/s`;

        // Show weather details container
        weatherDetailsContainer.style.display = 'block';
        weatherInfoContainer.style.display = 'block';

        // Get the weather condition (e.g., 'Clear', 'Clouds', 'Rain', etc.)
        const weatherCondition = data.weather[0].main.toLowerCase();

        // Update the favicon and title with static images based on OpenWeatherMap condition
        await updateTitleAndFavicon(weatherCondition);

        // Fetch background image based on city and weather condition
        await fetchBackgroundImage(cityInput, weatherCondition);

        // Fetch future weather data
        await getFutureData(data.coord.lat, data.coord.lon);

        // Show alerts based on weather conditions
        showAlerts(data);

        // Suggest activities based on weather conditions
        suggestActivities(data);

    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert("Failed to fetch weather data. Please try again later.");
        weatherDetailsContainer.style.display = 'none';
    } finally {
        setLoading(false);
    }
};


// Update the favicon and title dynamically based on the weather condition
const updateTitleAndFavicon = async (weatherCondition) => {
    const iconUrl = getWeatherIcon(weatherCondition);  // Get the icon based on the weather condition

    // Update favicon
    const favicon = document.getElementById('favicon');
    favicon.href = iconUrl;  // Set the favicon URL dynamically

};

// Helper function to get the appropriate static weather icon based on OpenWeatherMap condition
const getWeatherIcon = (condition) => {
    switch (condition.toLowerCase()) {
        case 'clouds':
            return './images/clouds.png';       // clouds.png for cloudy weather
        case 'rain':
            return './images/rain.png';         // rain.png for rain
        case 'snow':
            return './images/snow.png';         // snow.png for snow
        case 'thunderstorm':
            return './images/thunderstorm.png'; // thunderstorm.png for thunderstorms
        case 'fog':
            return './images/fog.png';          // fog.png for foggy weather
        default:
            return './images/weather.jpeg';
    }
};





// Show alerts based on weather conditions
const showAlerts = (data) => {
    const alerts = [];
    const alertContainer = document.querySelector('.alert-container');
    const panel = document.querySelector('.panel');

    // Clear previous alerts
    alertContainer.innerHTML = '';

    // Temperature alerts
    if (data.main.temp < 0) {
        alerts.push("Alert: It's freezing outside! Stay warm!");
    }
    if (data.main.temp > 35) {
        alerts.push("Alert: It's very hot outside! Stay hydrated!");
    }

    // Wind alerts
    if (data.wind.speed > 20) {
        alerts.push("Alert: High winds detected! Be cautious!");
    }

    // Cloudiness and visibility
    if (data.clouds.all > 80) {
        alerts.push("Alert: It's very cloudy! Possible rain!");
    }

    // Humidity
    if (data.main.humidity > 80) {
        alerts.push("Alert: High humidity! It might feel muggy!");
    }

    // Create alert messages
    alerts.forEach((alertMessage) => {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-message';
        alertDiv.innerText = alertMessage;
        alertContainer.appendChild(alertDiv);

        // Show pop-up alert
        window.alert(alertMessage);
    });

    // Show alert container only if there are alerts
    alertContainer.style.display = alerts.length > 0 ? 'block' : 'none';

    // Adjust panel position based on alerts
    panel.classList.toggle('alert-visible', alerts.length > 0);
};

// Function to suggest activities based on weather conditions
const suggestActivities = (data) => {
    const activityDiv = document.querySelector('.activity');
    const condition = data.weather[0].main.toLowerCase();
    let activities = [];

    // Define activity suggestions based on weather condition
    if (condition === 'clear') {
        activities = [
            "Go for a hike",
            "Have a picnic",
            "Take a bike ride",
            "Go for a swim",
            "Explore a new park or trail",
            "Try outdoor photography",
            "Plan a barbecue with friends"
        ];
    } else if (condition === 'clouds') {
        activities = [
            "Read a book indoors",
            "Visit a museum",
            "Watch a movie",
            "Try a new recipe",
            "Do a puzzle or board game",
            "Have a cozy indoor gathering",
            "Listen to a podcast while relaxing"
        ];
    } else if (condition === 'rain') {
        activities = [
            "Go to a coffee shop",
            "Play indoor games",
            "Visit a shopping mall",
            "Have a movie marathon",
            "Attend an indoor fitness class",
            "Explore an indoor botanical garden",
            "Take a long bath and relax"
        ];
    } else if (condition === 'snow') {
        activities = [
            "Build a snowman",
            "Go skiing",
            "Enjoy a warm drink indoors",
            "Go ice skating",
            "Have a snowball fight",
            "Make a snow angel",
            "Cozy up with a good book or movie"
        ];
    } else if (condition === 'thunderstorm') {
        activities = [
            "Stay indoors",
            "Watch a storm from a safe place",
            "Read a book",
            "Listen to soothing music or podcasts",
            "Organize your closet or desk",
            "Bake some comfort food",
            "Try a new indoor craft or hobby"
        ];
    } else if (condition === 'fog') {
        activities = [
            "Visit a local park",
            "Enjoy a scenic drive",
            "Take photos of the fog",
            "Go for a peaceful walk through the fog",
            "Read a mystery or atmospheric novel",
            "Visit a quiet café and relax",
            "Take a yoga class indoors"
        ];
    } else {
        activities = ["Stay safe and enjoy your day!"];
    }

    // Pick a random activity from the list
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];

    // Display the random activity
    activityDiv.innerHTML = `
        <strong style="color: black; border-radius: 20px; padding: 0.16em;">Suggested Activity:</strong>
        <p style="padding-top: 0.5em; font-size: 1.1em; font-weight: bold;">${randomActivity}</p>
    `;
};

// Fetch a background image from Unsplash
const fetchBackgroundImage = async (city, weatherCondition) => {
    try {
        const res = await fetch(`https://api.unsplash.com/search/photos?query=${weatherCondition}+sky+skyImages&client_id=${unsplashApiKey}`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.results.length);
            const imageUrl = data.results[randomIndex].urls.regular;
            app.style.backgroundImage = `url(${imageUrl})`;
            app.style.backgroundSize = 'cover';
            app.style.backgroundPosition = 'center';
        } else {
            console.error("No image found for the given city and weather condition.");
        }
    } catch (error) {
        console.error("Error fetching background image:", error);
        app.style.backgroundImage = "url('./images/defaultImage.jpg')";
    }
};

// Fetch future weather data
const getFutureData = async (lat, long) => {
    document.querySelector(".forecast-container").style.display = "block";
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Tokyo`;
        const res = await fetch(url);
        const data = await res.json();
        displayForecast(data.daily); // Ensure you call displayForecast here
    } catch (error) {
        console.error("Error fetching future weather data:", error);
    }
};

// Display 7-day forecast
const displayForecast = (dailyForecasts) => {
    const forecastDaysContainer = document.querySelector('.forecast-days');
    forecastDaysContainer.innerHTML = ''; // Clear previous forecasts

    const today = new Date(); // Get the current date

    dailyForecasts.time.forEach((_, i) => {
        const date = new Date(today); // Create a new date object
        date.setDate(today.getDate() + i); // Set the date to today + i days

        // Format the date to dd/mm/yyyy
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`; // Create formatted date string

        const dayDiv = document.createElement('div');
        dayDiv.className = 'forecast-day';

        dayDiv.innerHTML = `
            <div class="day">${formattedDate}</div>
            <div class="temp">
                <span class="max">${dailyForecasts.temperature_2m_max[i]}°C / </span>
                <span class="min">${dailyForecasts.temperature_2m_min[i]}°C</span>
            </div>
        `;
        forecastDaysContainer.appendChild(dayDiv);
    });
};
