async function getWeather(lat, lon, timezone) {
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,rain,weathercode,uv_index&daily=weathercode,temperature_2m_max,apparent_temperature_max,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum&current_weather=true&timeformat=unixtime&timezone=${timezone}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(
        `Network response was not ok (HTTP Status: ${response.status})`
      );
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getWeatherAndHandle(lat, lon, timezone) {
  return getWeather(lat, lon, timezone)
    .then((data) => {
      // Handle the data
      console.log(data);
      return {
        country: parseCurrentCountryAndUTC(data),
        current: parseCurrentWeather(data),
        daily: parseDailyWeather(data),
        hourly: parseHourlyWeather(data),
      };
    })
    .catch((error) => {
      // Handle any errors
      console.error(error);
    });
}

function parseCurrentCountryAndUTC({ timezone, utc_offset_seconds }) {
  return { countryCity: timezone, uos: utc_offset_seconds };
}

function parseCurrentWeather({ current_weather }) {
  const {
    temperature: temp,
    windspeed: windSpeed,
    time: timeNow,
    weathercode: weatherCode,
  } = current_weather;

  return {
    temp,
    windSpeed,
    timeNow,
    weatherCode,
  };
}

function parseDailyWeather({ daily }) {
  return daily.time.map((time, index) => {
    return {
      timestamp: time,
      iconCode: daily.weathercode[index],
      maxTemp: Math.round(daily.temperature_2m_max[index]),
    };
  });
}

function parseHourlyWeather({ hourly, current_weather }) {
  return hourly.time
    .map((time, index) => {
      return {
        timestamp: time * 1000,
        iconCode: hourly.weathercode[index],
        temp: Math.round(hourly.temperature_2m[index]),
        uvIndex: Math.round(hourly.uv_index[index]),
      };
    })
    .filter(({ timestamp }) => timestamp >= current_weather.time * 1000);
}
