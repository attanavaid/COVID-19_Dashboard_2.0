// app.js
import { countiesDataOrigin } from './us-counties'; 
import covidData from '../data/covid_data.json'; 

// Global variables
let selectedState = '';
let selectedCounty = '';
let selectedView = 'cases';
let selectedDate = '2022-03-15'; // Last date in our dataset
let countiesData = [];
const defaultDataset = [0, 0, 0, 0, 0, 0, 0];
const defaultLabel = ["N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A"];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    countiesData = filterGeoJSON(countiesDataOrigin);
    initMap();
    initUI();
});

// Filter GeoJSON to include only MD, DE, DC, and VA
function filterGeoJSON(data) {
    const targetStates = ['Maryland', 'Delaware', 'District of Columbia', 'Virginia'];
    data.features = data.features.filter(feature => targetStates.includes(feature.properties.STATE));
    return data;
}

let map;
let geojson;
let info = L.control();
let legendForInfs = L.control({position: 'bottomright'});
let legendForVaccs = L.control({position: 'bottomright'});
let legendForCases = L.control({position: 'bottomright'});
let legendForDeaths = L.control({position: 'bottomright'});

let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href = "https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

let googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    subdomains:['mt0','mt1','mt2','mt3']
});

let carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href = "https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href = "https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
	maxZoom: 19
});

let googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    subdomains:['mt0','mt1','mt2','mt3']
});

let watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href = "http://stamen.com">Stamen Design</a>, <a href = "http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    maxZoom: 19,
    ext: 'jpg'
});

let CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 19
});

let baseLayers = {
    "Dark" : CartoDB_DarkMatter,
    "Water Color" : watercolor,
    "Satellite" : googleSat,
    "Google Map" : googleStreets,
    "OpenStreetMap" : osm
};

// Initialize the map
function initMap() {
    //map = L.map('map').setView([39.7128,-94.0060], 4.3);
    map = L.map('map').setView([38.8, -77.5], 7); // Centered on the target area
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    geojson = L.geoJson(countiesData, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);

    addInfoControl();
    addLegend();
}

// Initialize UI elements
function initUI() {
    populateStateDropdown();
    populateDateDropdown();
    document.getElementById('stateSelectMenu').addEventListener('change', onStateChange);
    document.getElementById('countySelectMenu').addEventListener('change', onCountyChange);
    document.getElementById('typeOfMapMenu').addEventListener('change', onViewChange);
    document.getElementById('dateOfDataMenu').addEventListener('change', onDateChange);
    document.getElementById('resetSelectionButton').addEventListener('click', resetSelection);
    updateCharts();
}

// Populate state dropdown
function populateStateDropdown() {
    const stateSelectMenu = document.getElementById('stateSelectMenu');
    const states = [...new Set(countiesData.features.map(f => f.properties.STATE))];
    states.sort().forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelectMenu.appendChild(option);
    });
}

// Populate date dropdown
function populateDateDropdown() {
    const dateSelectMenu = document.getElementById('dateOfDataMenu');
    const dates = [...new Set(covidData.map(d => d.date))];
    dates.sort().forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        dateSelectMenu.appendChild(option);
    });
    dateSelectMenu.value = selectedDate;
}

// Event handlers
function onStateChange(e) {
    selectedState = e.target.value;
    updateCountyDropdown();
    updateMap();
    updateInfoBoxes();
    updateCharts();
}

function onCountyChange(e) {
    selectedCounty = e.target.value;
    updateMap();
    updateInfoBoxes();
    updateCharts();
}

function onDateChange(e) {
    selectedDate = e.target.value;
    updateMap();
    updateInfoBoxes();
    updateCharts();
}

function onViewChange(e) {
    selectedView = e.target.value;
    updateMap();
    updateLegend();
}

function resetSelection() {
    selectedState = '';
    selectedCounty = '';
    selectedView = 'cases';
    selectedDate = '2022-03-15';
    document.getElementById('stateSelectMenu').value = '';
    document.getElementById('countySelectMenu').innerHTML = '<option value="">Select a County</option>';
    document.getElementById('typeOfMapMenu').value = 'cases';
    document.getElementById('dateOfDataMenu').value = selectedDate;
    updateMap();
    updateInfoBoxes();
}

// Update county dropdown based on selected state
function updateCountyDropdown() {
    const countySelectMenu = document.getElementById('countySelectMenu');
    countySelectMenu.innerHTML = '<option value="">Select a County</option>';
    if (selectedState) {
        const counties = countiesData.features
            .filter(f => f.properties.STATE === selectedState)
            .map(f => f.properties.NAME);
        counties.sort().forEach(county => {
            const option = document.createElement('option');
            option.value = county;
            option.textContent = county;
            countySelectMenu.appendChild(option);
        });
    }
}

// Map styling and interaction
function style(feature) {
    return {
        fillColor: getColorForInfs(getValueForFeature(feature)),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function changeMapType(val) {
    mapColorNum = val;

    switch (mapColorNum) {
        case "0":
            map.removeLayer(geojson);
            map.removeControl(legendForVaccs);
            map.removeControl(legendForCases);
            map.removeControl(legendForDeaths);
            geojson = L.geoJson(countiesData, {style: styleInfs, onEachFeature: onEachFeature});
            document.getElementById("mapBoxTitle").innerHTML = "<h5 id = 'mapBoxTitle'>COVID Infection Rates by County</h5>";
            map.addLayer(geojson);
            legendForInfs.addTo(map);
            break;

        case "1":
            map.removeLayer(geojson);
            map.removeControl(legendForInfs);
            map.removeControl(legendForCases);
            map.removeControl(legendForDeaths);
            geojson = L.geoJson(countiesData, {style: styleVaccs, onEachFeature: onEachFeature});
            document.getElementById("mapBoxTitle").innerHTML = "<h5 id = 'mapBoxTitle'>COVID Vaccination Rates by County</h5>";
            map.addLayer(geojson);
            legendForVaccs.addTo(map);
            break;
        
        case "2":
            map.removeLayer(geojson);
            map.removeControl(legendForInfs);
            map.removeControl(legendForVaccs);
            map.removeControl(legendForDeaths);
            geojson = L.geoJson(countiesData, {style: styleCases, onEachFeature: onEachFeature});
            document.getElementById("mapBoxTitle").innerHTML = "<h5 id = 'mapBoxTitle'>COVID Cases by County</h5>";
            map.addLayer(geojson);
            legendForCases.addTo(map);
            break;

        case "3":
            map.removeLayer(geojson);
            map.removeControl(legendForInfs);
            map.removeControl(legendForVaccs);
            map.removeControl(legendForCases);
            geojson = L.geoJson(countiesData, {style: styleDeaths, onEachFeature: onEachFeature});
            document.getElementById("mapBoxTitle").innerHTML = "<h5 id = 'mapBoxTitle'>COVID Deaths by County</h5>";
            map.addLayer(geojson);
            legendForDeaths.addTo(map);
            break;
    }
}

function getColorForInfs(d) {
    return d > 63      ? '#800026' :
           d > 54      ? '#BD0026' :
           d > 45      ? '#E31A1C' :
           d > 36      ? '#FC4E2A' :
           d > 27      ? '#FD8D3C' :
           d > 18      ? '#FEB24C' :
           d > 9       ? '#FED976' :
                         '#FFEDA0' ;
}

function getColorForVaccs(d) {
    return d > 77      ? '#131A55' :
           d > 66      ? '#1B277C' :
           d > 55      ? '#274B93' :
           d > 44      ? '#3371AA' :
           d > 33      ? '#3F97C2' :
           d > 22      ? '#56B9D2' :
           d > 11      ? '#91D0CE' :
                         '#CEE6CA' ;
}

function getColorForCases(d) {
    return d > 30000   ? '#004629' :
           d > 20000   ? '#016738' :
           d > 15000   ? '#248444' :
           d > 12000   ? '#40AB5D' :
           d > 10000   ? '#79C57C' :
           d > 7000    ? '#B0DC91' :
           d > 5000    ? '#DAEFA2' :
                         '#FAFBB7' ;
}

function getColorForDeaths(d) {
    return d > 1800    ? '#33104A' :
           d > 1500    ? '#4B186C' :
           d > 1200    ? '#63218F' :
           d > 800     ? '#8F3192' :
           d > 500     ? '#C0458A' :
           d > 250     ? '#E8608A' :
           d > 100     ? '#EF9198' :
                         '#F8C1A8' ;
}

function getValueForFeature(feature) {
    const countyData = covidData.find(d => 
        d.state_name === feature.properties.STATE &&
        d.county_name === feature.properties.NAME &&
        d.date === selectedDate
    );
    if (countyData) {
        switch (selectedView) {
            case 'cases': return countyData.cases;
            case 'deaths': return countyData.confirmed_deaths;
            case 'infection': return countyData.county_infection_rate;
            case 'vaccination': return countyData.county_vaccination_rate;
            default: return 0;
        }
    }
    return 0;
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: (e) => zoomToFeature(e, feature)
    });
}

function highlightFeature(e) {
    let layer = e.target;
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e, feature) {
    map.fitBounds(e.target.getBounds());
    updateSelectedCounty(feature.properties);
    updateInfoBoxes();
    updateCharts();
}

// Add info control to the map
function addInfoControl() {
    info = L.control();
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };
    info.update = function (props) {
        this._div.innerHTML = '<h4>COVID-19 Data</h4>' + (props ?
            '<b>' + props.NAME + ', ' + props.STATE + '</b><br />' + getDataForCounty(props)
            : 'Hover over a county');
    };
    info.addTo(map);
}

// Add legend to the map
function addLegend() {
    legendForInfs.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 9, 18, 27, 36, 45, 54, 63];
        
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML += '<i style = "background:' + getColorForInfs(grades[i] + 1) + '"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        
        return div;
    };

    legendForVaccs.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 11, 22, 33, 44, 55, 66, 77];
        
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML += '<i style = "background:' + getColorForVaccs(grades[i] + 1) + '"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        
        return div;
    };

    legendForCases.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 5000, 7000, 10000, 12000, 15000, 20000, 30000];
        
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML += '<i style = "background:' + getColorForCases(grades[i] + 1) + '"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        
        return div;
    };
        
    legendForDeaths.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 100, 250, 500, 800, 1200, 1500, 1800];
    
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML += '<i style = "background:' + getColorForDeaths(grades[i] + 1) + '"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
    
        return div;
    };

    legendForInfs.addTo(map);
}

// Update map based on current selections
function updateMap() {
    if (geojson) {
        geojson.setStyle(style);
    }
}

// Update info boxes with selected county data
function updateInfoBoxes() {
    const countyNameElement = document.getElementById('countyName');
    const stateNameElement = document.getElementById('stateName');
    const fipsCodeElement = document.getElementById('countyFIPSCode');
    const infectionRateElement = document.getElementById('infectionRate');
    const vaccinationRateElement = document.getElementById('vaccinationRate');
    const casesElement = document.getElementById('casesNum');
    const deathsElement = document.getElementById('deathsNum');

    if (selectedCounty && selectedState) {
        const countyData = getCountyData(selectedState, selectedCounty);
        if (countyData) {
            countyNameElement.textContent = `County Name: ${selectedCounty}`;
            stateNameElement.textContent = `State Name: ${selectedState}`;
            fipsCodeElement.textContent = `County FIPS code: ${countyData.state_id}${countyData.county_id.toString().padStart(3, '0')}`;
            infectionRateElement.innerHTML = `Infection Rate: <b>${countyData.county_infection_rate.toFixed(2)}</b> per 100k`;
            vaccinationRateElement.innerHTML = `Vaccination Rate: <b>${countyData.county_vaccination_rate.toFixed(2)}%</b>`;
            casesElement.textContent = countyData.cases;
            deathsElement.textContent = countyData.confirmed_deaths;
        } else {
            resetInfoBoxes();
        }
    } else {
        resetInfoBoxes();
    }
}

function resetInfoBoxes() {
    document.getElementById('countyName').textContent = 'County Name: N/A';
    document.getElementById('stateName').textContent = 'State Name: N/A';
    document.getElementById('countyFIPSCode').textContent = 'County FIPS code: N/A';
    document.getElementById('infectionRate').innerHTML = 'Infection Rate: <b>N/A</b>';
    document.getElementById('vaccinationRate').innerHTML = 'Vaccination Rate: <b>N/A</b>';
    document.getElementById('casesNum').textContent = 'N/A';
    document.getElementById('deathsNum').textContent = 'N/A';
}

// Get data for county
function getDataForCounty(props) {
    const countyData = getCountyData(props.STATE, props.NAME);
    if (countyData) {
        return `Infection Rate: ${countyData.county_infection_rate.toFixed(2)} per 100k<br>
                Vaccination Rate: ${countyData.county_vaccination_rate.toFixed(2)}%<br>
                Cases: ${countyData.cases}<br>
                Deaths: ${countyData.confirmed_deaths}`;
    }
    return 'No data available';
}

// Get county data from covidData array
function getCountyData(state, county) {
    return covidData.find(d => 
        d.state_name === state &&
        (d.county_name === county || d.county_name === county + " city") &&
        d.date === selectedDate
    );
}

// Update legend based on selected view
function updateLegend() {
    // Implement legend update logic based on the selected view
    // This function should update the legend values and colors based on the current view (cases, deaths, infection rate, or vaccination rate)
}

// Function to update selected county (called when zooming to a feature)
function updateSelectedCounty(props) {
    selectedState = props.STATE;
    selectedCounty = props.NAME;
    
    const stateSelect = document.getElementById('stateSelectMenu');
    const countySelect = document.getElementById('countySelectMenu');
    
    stateSelect.value = selectedState;
    // Trigger the change event on the state dropdown to update the county dropdown
    stateSelect.dispatchEvent(new Event('change'));
    
    // Wait for the county dropdown to be populated before setting its value
    setTimeout(() => {
        countySelect.value = selectedCounty;
        // Trigger the change event on the county dropdown
        countySelect.dispatchEvent(new Event('change'));
    }, 0);
}

/*===================================================
        INFECTION AND VACCINATION GRAPH CODES             
===================================================*/

function updateCharts() {
    if (selectedCounty && selectedState) {
        const countyData = getCountyDataForLastWeek(selectedState, selectedCounty);
        if (countyData) {
            const dates = countyData.map(d => d.date);
            const infectionRates = countyData.map(d => d.county_infection_rate);
            const vaccinationRates = countyData.map(d => d.county_vaccination_rate);

            updateChart(infectionRateChart, infectionRates, dates);
            updateChart(vaccinationRateChart, vaccinationRates, dates);
        } else {
            updateChart(infectionRateChart, defaultDataset, defaultLabel);
            updateChart(vaccinationRateChart, defaultDataset, defaultLabel);
        }
    } else {
        updateChart(infectionRateChart, defaultDataset, defaultLabel);
        updateChart(vaccinationRateChart, defaultDataset, defaultLabel);
    }
}

function getCountyDataForLastWeek(state, county) {
    const endDate = new Date(selectedDate);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);

    return covidData.filter(d => 
        d.state_name === state &&
        (d.county_name === county || d.county_name === county + " city") &&
        new Date(d.date) >= startDate &&
        new Date(d.date) <= endDate
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function updateChart(chart, newDataset, dates) {
    chart.data.labels = dates.map(date => date.substring(5));
    chart.data.datasets[0].data = newDataset;
    chart.update();
}

let getInfectionRateChart = document.getElementById("infectionRateChart").getContext('2d');
let infectionRateChart = new Chart(getInfectionRateChart, {
    type: 'line',
    data: {
        labels: defaultLabel,
        datasets: [{
            label: "Infection Rate",
            data: defaultDataset,
            backgroundColor: 'rgba(253, 53, 63, .2)',
            borderColor: 'rgba(253, 10, 41, .7)',
            borderWidth: 2
        }]
    },
    options: {
        legend: {
            labels: {
                fontColor: "Gray",
                fontSize: 12
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    fontColor: "Gray",
                    fontSize: 12,
                    beginAtZero: true
                }
            }],
            xAxes: [{
                ticks: {
                    fontColor: "Gray",
                    fontSize: 12,
                }
            }]
        },
        responsive: true
    }
});

let getVaccinationRateChart = document.getElementById("vaccinationRateChart").getContext('2d');
let vaccinationRateChart = new Chart(getVaccinationRateChart, {
    type: 'line',
    data: {
        labels: defaultLabel,
        datasets: [{
            label: "Vaccination Rate",
            data: defaultDataset,
            backgroundColor: 'rgba(107, 212, 255, .2)',
            borderColor: 'rgba(39, 167, 255, .7)',
            borderWidth: 2
        }]
    },
    options: {
        legend: {
            labels: {
                fontColor: "Gray",
                fontSize: 12
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    fontColor: "Gray",
                    fontSize: 12,
                    beginAtZero: true
                }
            }],
            xAxes: [{
                ticks: {
                    fontColor: "Gray",
                    fontSize: 12,
                }
            }]
        },
        responsive: true
    }
});
