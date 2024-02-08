import { ICON_MAP } from "./iconMap.js";
import { getCCAndHandle } from "./options.js";
import { getWeatherAndHandle } from "./weather.js";

const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const HOUR_FORMATTER = new Intl.DateTimeFormat(undefined, { hour: "numeric" });
const DropDown_Btn = document.getElementById("drop_btn");
const Current_City = document.getElementById("current_city");
const Current_Date = document.getElementById("current_date");
const Current_Day = document.getElementById("current_day");
// const Current_Temp = document.getElementById("current_temp");
Current_City.innerText = "";
const INPUT_VALUE = document.getElementById("searchInput");
const DROPDOWN_CONT = document.getElementById("dropdown_container");
let debounceTimer;

function handleSearch() {
  let filter = INPUT_VALUE.value.toUpperCase();
  let p = DROPDOWN_CONT.getElementsByTagName("p");

  for (let i = 0; i < p.length; i++) {
    let a = p[i];
    let txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      p[i].style.display = "";
    } else {
      p[i].style.display = "none";
    }
  }
}

INPUT_VALUE.addEventListener("input", function () {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(handleSearch, 300);
});

DropDown_Btn.addEventListener("click", handleToggle);

function handleToggle() {
  document.getElementById("myDropdown").classList.toggle("show");
  document.addEventListener("click", handleClickOutside, false);
}


const handleClickOutside = (event) => {

  if (
    !event.target.closest(".city") &&
    !event.target.closest(".dropdown-content") &&
    !event.target.closest(".drop_input") &&
    !event.target.closest(".drop_cty")
  ) {
    handleToggle();
    //?? INPUT_VALUE.value = ""
    document.removeEventListener("click", handleClickOutside, false);
  }
};




navigator.geolocation.getCurrentPosition(positionSuccess, positionError);

function updateInfo(info) {
  if (info) {
    Current_City.innerText = info.coun;
    getWeatherAndHandle(info.lat, info.long, "Asia/Yerevan")
      .then(renderData)
      .catch((err) => {
        console.log(err);
      });
  } else {
    console.log("err");
  }
}

function positionSuccess({ coords }) {
  getWeatherAndHandle(
    coords.latitude,
    coords.longitude,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
    .then(renderData)
    .catch((err) => {
      console.log(err);
    });
}

function positionError() {
  alert("There is an error finding your location");
}

function getCurrentDate(offset) {
  // UTC offset in seconds (14400 seconds = 4 hours)
  const utcOffsetSeconds = offset;
  // Create a Date object based on the current UTC time
  const currentDateUtc = new Date();
  // Calculate the local date by adding the offset in milliseconds
  const currentDateLocal = new Date(
    currentDateUtc.getTime() + utcOffsetSeconds * 1000
  );

  const day = currentDateLocal.getDate();
  const month = currentDateLocal.getMonth() + 1; // Months are zero-indexed, so we add 1
  const year = currentDateLocal.getFullYear();

  // Format the date as "d/m/y"
  const formattedDate = `${day}/${month}/${year}`;

  return formattedDate;
}

function getCurrentDayHour(timestamp) {
  const weekday = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const date = new Date(timestamp * 1000);

  const hours = date.getHours();
  let minutes = date.getMinutes();
  const day = weekday[date.getDay()];
  const shortDay = day.slice(0, 3);
  //? If needed the time with seconds
  //? const seconds = date.getSeconds();
  if (minutes === 0) {
    minutes = "00";
  }
  const formattedDate = `${hours}:${minutes}`;
  return { formattedDate, shortDay };
}

function renderData({ country, current, daily, hourly }) {
  renderCurrentInfo(country, current);
  renderDailyWeather(daily);
  renderHourlyWeather(hourly);
  document.body.classList.remove("blurred");
}
function setValue(selector, side, value, { parent = document } = {}) {
  parent.querySelector(`[data-${side}-${selector}]`).textContent = value;
}

function getIconUrl(iconCode) {
  return `icons/${ICON_MAP.get(iconCode)}.svg`;
}

function renderCurrentInfo(country, current) {
  const { formattedDate, shortDay } = getCurrentDayHour(current.timeNow);
  const currentIcon = document.querySelector("[data-current-icon]");
  const currentLeftIcon = document.querySelector("[data-left-icon]");

  if (Current_City.innerText === "") {
    Current_City.innerText = country.countryCity;
  }

  currentIcon.src = getIconUrl(current.weatherCode);
  currentLeftIcon.src = getIconUrl(current.weatherCode);
  Current_Date.innerText = `${getCurrentDate(country.uos)} ${shortDay}`;
  Current_Day.innerText = formattedDate;
  // Current_Temp.innerText = current.temp;
  setValue("day", "left", shortDay);
  setValue("degree", "left", current.temp);
}

function renderDailyWeather(daily) {
  const rigthBlocks = document.querySelector("[data-rigth-blocks]");
  const blockTemplate = rigthBlocks.querySelector(".block-template");

  if (daily.length !== 7) {
    console.error("Invalid number of data points. Expected 7.");
    return;
  }
  rigthBlocks.innerHTML = "";

  daily.forEach((day, index) => {
    if (index > 0) {
      const { shortDay } = getCurrentDayHour(day.timestamp);
      const newBlock = blockTemplate.cloneNode(true);
      // newBlock.classList.remove("block-template");
      newBlock.style.display = "block";
      setValue("temp", "rigth", day.maxTemp, { parent: newBlock });
      setValue("day", "rigth", shortDay, { parent: newBlock });
      newBlock.querySelector("[data-rigth-icon]").src = getIconUrl(
        day.iconCode
      );

      rigthBlocks.appendChild(newBlock);
    }
  });
}

function renderHourlyWeather(hourly) {
  const hourlySection = document.querySelector("[data-hour-section]");
  const hourRowTemplate = document.getElementById("hour-row-template");
  hourlySection.innerHTML = "";
  hourly.forEach((hour) => {
    const element = hourRowTemplate.content.cloneNode(true);
    setValue("temp", "row", hour.temp, { parent: element });
    setValue("uv", "row", hour.uvIndex, { parent: element });
    setValue("day", "row", DAY_FORMATTER.format(hour.timestamp), {
      parent: element,
    });
    setValue("time", "row", HOUR_FORMATTER.format(hour.timestamp), {
      parent: element,
    });

    element.querySelector("[data-row-icon]").src = getIconUrl(hour.iconCode);
    hourlySection.append(element);
  });
}

getCCAndHandle()
  .then(renderCountryData)
  .catch((err) => {
    console.log(err);
  });

function renderCountryData(data) {
  const mainData = data.country_code;
  const countryArr = mainData.map((a) => a.coun);
  // const latitudeArr = mainData.map((a) => a.lat);
  // const longitudeArr = mainData.map((a) => a.long);
  // console.log(countryArr, latitudeArr,longitudeArr );

  const dropSection = document.querySelector("[data-drop-section]");
  const countryDropTemplate = document.getElementById("country-drop-template");
  dropSection.innerHTML = "";
  countryArr.forEach((cty) => {
    const element = countryDropTemplate.content.cloneNode(true);
    const everyRow = element.querySelector("[data-drop-country]");
    everyRow.textContent = cty;
    dropSection.append(element);
    everyRow.addEventListener("click", (e) => {
      handleClickEvent(e, mainData);
    });
  });
}

function handleClickEvent(event, data) {
  let text = event.target.innerText;
  let currentCountryInfo;
  data.forEach((n) => {
    if (n.coun === text) {
      currentCountryInfo = n;
      // console.log(currentCountryInfo)
    }
  });

  return updateInfo(currentCountryInfo);
}