
import { 
    setLocationObject, 
    getHomeLocation,
    getWeatherFromCoords, 
    getCoordsFromApi,
    cleanText
    
} from "./dataFunctions.js";
import { 
    setPlaceholderText,
    addSpinner, 
    displayError,
    displayApiError, 
    updateScreenReaderConfirmation,
    updateDisplay
} from "./domFunctions.js";

import CurrentLocation from "./CurrentLocation.js";

const currentLoc = new CurrentLocation()


const initApp = () => {
    // listening, staging, loading
    const geoButton = document.getElementById("getLocation");
    geoButton.addEventListener("click", getGeoWeather);

    const homeButton = document.getElementById("home")
    homeButton.addEventListener("click", loadWeather)
    loadWeather();

    const saveButton = document.getElementById("saveLocation")
    saveButton.addEventListener("click", saveLocation);

    const unitButton =  document.getElementById("unit")
    unitButton.addEventListener("click", setUnitPref);

    const refreshButton = document.getElementById("searchBar__form")
    refreshButton.addEventListener("click", refreshWeather);

    const locationEntry = document.getElementById("searchBar__form")
    locationEntry.addEventListener("submit", submitNewLocation);

    setPlaceholderText();

    loadWeather();

}
document.addEventListener("DOMContentLoaded", initApp)

const getGeoWeather = (event) => {

    if (event) {
        if (event.type === "click") {
            // spin
            const mapIcon = document.querySelector(".fa-map-marker-alt");
            addSpinner(mapIcon);
        }
    }
    if (!navigator.geolocation) return geoError();
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
}

const geoError = (errObj) => {
    const errMsg = errObj.message ? errObj.message : "Geolocation not supported";
    displayError(errMsg, errMsg)

}

const geoSuccess = (position) => {
    const myCoordsObj = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        name: `Lat:${position.coords.latitude} Long:${position.coords.longitude}`
    };

    setLocationObject(currentLoc, myCoordsObj)
    console.table(currentLoc)
    updateDateAndDisplay(currentLoc);
};

const loadWeather = (event) =>{
    const savedLocation = getHomeLocation();
    if(!savedLocation && !event) return getGeoWeather();
    if (!savedLocation && event.type === "click" ) {
        displayError(
            "No Home Location Saved.",
            "Sorry. Please save your home location first."
        );
    } else if (savedLocation && !event) {
        displayHomeLocationWeather(savedLocation);
    } else {
        const homeIcon = document.querySelector(".fa-home");
        addSpinner(homeIcon);
        displayHomeLocationWeather(savedLocation);
    }
}

const displayHomeLocationWeather = (home) => {
    if (typeof home === "string") {
        const locationJson = JSON.parse(home);
        const myCoordsObj = {
            lat: locationJson.lat,
            lon: locationJson.lon,
            name: locationJson.name,
            unit: locationJson.unit
        };
        setLocationObject(currentLoc, myCoordsObj);
        updateDateAndDisplay(currentLoc);
    }
};

const saveLocation = () => {
    if (currentLoc.getLat() && currentLoc.getLon()) {
        const saveIcon = document.querySelector(".fa-save");
        addSpinner(saveIcon);
        const location = {
            name: currentLoc.getName(),
            lat: currentLoc.getLat(),
            lon: currentLoc.getLon(),
            unit: currentLoc.getUnit()
        };
        localStorage.setItem("defaultWeatherLocation", JSON.stringify(location));
        updateScreenReaderConfirmation(
          `Saved ${currentLoc.getName()} as home location.`
        );
    }
}

const setUnitPref = () => {
     const unitIcon = document.querySelector(".fa-chart-bar");
     addSpinner(unitIcon);
     currentLoc.toggleUnit();
     updateDateAndDisplay(currentLoc)
}

const refreshWeather = () => {
    const refreshIcon = document.querySelector(".fa-sync-alt");
    addSpinner(refreshIcon);
    updateDateAndDisplay(currentLoc);
}

const submitNewLocation =  async (event) => {
    event.preventDefault();
    const text = document.getElementById("searchBar__text").value;
    const entryText = cleanText(text)
    if (!entryText.length) return;
    const locationIcon = document.querySelector(".fa-magnifying-glass");
    addSpinner(locationIcon);
    const coordsData = await getCoordsFromApi(entryText, currentLoc.getUnit());
    if (coordsData) {
        if(coordsData.cod === 200) {

            const myCoordsObj = {
                lat: coordsData.coord.lat,
                lon: coordsData.coord.lon,
                name: coordsData.sys.country ? `${coordsData.name}, ${coordsData.sys.country}` : coordsData.name
            };
            setLocationObject(currentLoc, myCoordsObj);
            updateDateAndDisplay(currentLoc)
        } else {
            displayApiError(coordsData);
        }
    } else {
        displayError( "Connection! Error!")
    }

}

const updateDateAndDisplay = async (locationObj) => {
    const weatherJson = await getWeatherFromCoords(locationObj)
    if (weatherJson) updateDisplay(weatherJson, locationObj)
    console.log("here", locationObj)

}