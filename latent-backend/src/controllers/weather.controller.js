// src/controllers/weather.controller.js
const axios = require('axios');
const { ok, err } = require('../utils/response.utils');

// 30-minute in-memory cache
let weatherCache = { data: null, fetchedAt: 0 };

const getWeather = async (req, res, next) => {
  try {
    // Serve from cache if fresh
    if (weatherCache.data && Date.now() - weatherCache.fetchedAt < 30 * 60 * 1000) {
      return ok(res, weatherCache.data);
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey || apiKey.startsWith('XXXXX')) {
      return err(res, 'Weather API key not configured', 'NO_API_KEY', 503);
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=22.2863&lon=73.3641&appid=${apiKey}&units=metric`
    );
    const d = response.data;

    const parsed = {
      temp:        Math.round(d.main.temp),
      feels_like:  Math.round(d.main.feels_like),
      humidity:    d.main.humidity,
      description: d.weather[0].description,
      icon:        d.weather[0].main, // 'Clear'|'Clouds'|'Rain'|'Thunderstorm' etc.
      city:        'Vadodara',
    };

    weatherCache = { data: parsed, fetchedAt: Date.now() };
    return ok(res, parsed);
  } catch (e) { next(e); }
};

module.exports = { getWeather };
