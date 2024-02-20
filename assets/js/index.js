const h1Element = document.querySelector('h1');
const paginationElement = document.querySelector('.pagination');
const mapWindow = document.getElementById('map-window');
const cityTable = document.getElementById('city-table');
const paginationContainer = document.querySelector('.pagination-container');
const countriesTable = document.getElementById('countries-table');
const overlay = document.querySelector('.overlay');
const countryNameElement = document.getElementById('country-name');
const filterWindow = document.getElementById('filter-window');
const settingsWindow = document.getElementById('settings-window');
const sortButton = document.querySelector('.sort-button');
const regionToggleLabels = document.querySelectorAll('#filter-window .toggle-label');
const regionToggles = document.querySelectorAll('input[type="checkbox"][id^="region-filter-toggle-"]');

let bigCardToggle;
let map = null;
let marker = null;
let selectedRowPage = null;
let openCountryRow = null;
let openExpandedCountryRow = null;
let sortOrder = true;
let currentPage = 1;
let totalPages = 1;
let toggleStates = [];
let filteredCountries = [];
let independentCountries = [];
let countriesPerPage = calculateCountriesPerPage();
function calculateCountriesPerPage() {
    const h1Rect = h1Element.getBoundingClientRect();
    const paginationRect = paginationElement.getBoundingClientRect();
    const distanceToButtons = paginationRect.top - (h1Rect.top + h1Rect.height);
    const heightDifference = window.innerHeight - window.innerWidth;
    let count;
    if (window.matchMedia("(orientation: portrait)").matches) {
        const screenHeight = window.innerHeight;
        const distanceToCenter = screenHeight / 2 - (h1Rect.top + h1Rect.height);
        const fontSize = 16 + heightDifference / 100;
        document.body.style.fontSize = fontSize + 'px';
        count = Math.floor(distanceToCenter / 58);
    } else {
        document.body.style.fontSize = '16px';
        count = Math.floor(distanceToButtons / 42.65);
    }
    return count > 1 ? count : 1;
}

window.addEventListener('resize', function () {
    countriesPerPage = calculateCountriesPerPage();
    filterCountriesByRegion();
    if (mapWindow && mapWindow.style.display === 'block') {
        hideMapOfCountry();
    }
    if (cityTable && cityTable.style.display === 'block') {
        hideCountryCitiesTable();
    }
    if (filterWindow && filterWindow.style.display === 'block') {
        hideFilterWindow();
    }
    hideCountryInfo();
});

function fetchCountries() {
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(data => {
            independentCountries = data.filter(country => country.independent);
            independentCountries.sort((a, b) => a.name.common.localeCompare(b.name.common));
            filterCountriesByRegion();
        })
        .catch(error => console.log('Error:', error));
}

function renderPagination(totalPages) {
    paginationContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.addEventListener('click', () => setCurrentPage(i));
        if (i === currentPage) {
            button.classList.add('active');
        }
        paginationContainer.appendChild(button);
    }
}

async function renderCountriesTable(countries, currentPage) {
    const startIndex = (currentPage - 1) * countriesPerPage;
    const tableBody = countriesTable.tBodies[0];
    const imagePromises = filteredCountries
        .slice(startIndex, startIndex + countriesPerPage)
        .map(country => loadImage(`https://flagcdn.com/24x18/${getCountryCode(country)}.png`));
    const images = await Promise.all(imagePromises);
    const maxRows = images.length;
    while (tableBody.children.length > 1) {
        tableBody.removeChild(tableBody.lastChild);
    }
    return new Promise(resolve => {
        for (let i = 0; i < maxRows; i++) {
            const country = filteredCountries[startIndex + i];
            const { name: { common: countryName } } = country;
            let row = tableBody.children[i + 1];
            if (!row) {
                row = document.createElement('tr');
                tableBody.appendChild(row);
            }
            const imageCell = row.cells[0] || row.insertCell(0);
            const countryNameCell = row.cells[1] || row.insertCell(1);
            countryNameCell.textContent = countryName;
            const img = document.createElement('img');
            img.src = images[i].src;
            img.width = 24;
            img.height = 18;
            img.alt = `${countryName} Flag`;
            if (imageCell.firstChild) {
                imageCell.replaceChild(img, imageCell.firstChild);
            } else {
                imageCell.appendChild(img);
            }
            row.addEventListener('click', () => bigCardToggle.checked ? showExpandedCountryInfo(row, country) : showCountryInfo(row, country));
            if (selectedRowPage === currentPage) {
                if (openCountryRow && openCountryRow.rowElement.innerHTML === row.innerHTML) {
                    row.classList.add('selected');
                    openCountryRow.rowElement = row;
                }
                if (openExpandedCountryRow && openExpandedCountryRow.rowElement.innerHTML === row.innerHTML) {
                    row.classList.add('selected');
                    openExpandedCountryRow.row = row;
                }
            }
        }
        resolve();
    });
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const filterValue = searchInput.value.toLowerCase();
    filteredCountries = independentCountries.filter(country => {
        const { name: { common: countryName } } = country;
        return countryName.toLowerCase().startsWith(filterValue);
    });
    totalPages = Math.ceil(filteredCountries.length / countriesPerPage);
    currentPage = 1;
    renderPagination(totalPages);
    renderCountriesTable(filteredCountries, currentPage);
}

function filterCountriesByRegion() {
    const selectedRegions = Array.from(regionToggles)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.id.split('-').pop().toUpperCase());
    filteredCountries = independentCountries.filter(country =>
        selectedRegions.includes(country.region.toUpperCase())
    );
    totalPages = Math.ceil(filteredCountries.length / countriesPerPage);
    currentPage = 1;
    renderPagination(totalPages);
    renderCountriesTable(filteredCountries, currentPage);
    regionToggles.forEach((regionToggle, index) => {
        const toggleIcon = regionToggleLabels[index].querySelector('.toggle-icon');
        toggleStates[index] = regionToggle.checked;
        localStorage.setItem(`regionToggle${index}`, regionToggle.checked);
        toggleIcon.src = regionToggle.checked ? '/assets/images/toggle_on.svg' : '/assets/images/toggle_off.svg';
    });
    hideCountryInfo();
}

function resetFilters() {
    regionToggles.forEach(checkbox => checkbox.checked = true);
    hideCountryInfo();
    filterCountriesByRegion();
}

async function setCurrentPage(page) {
    if (currentPage === page) return;
    currentPage = page;
    renderPagination(totalPages);
    await renderCountriesTable(independentCountries, currentPage);
    if (selectedRowPage !== page) {
        if (openCountryRow && openCountryRow.rowElement) {
            openCountryRow.rowElement.classList.remove('selected');
        }
        if (openExpandedCountryRow && openExpandedCountryRow.rowElement) {
            openExpandedCountryRow.rowElement.classList.remove('selected');
        }
    }
}

function showExpandedCountryInfo(row, country) {
    if (!(openExpandedCountryRow && openExpandedCountryRow.rowElement === row)) {
        hideCountryInfo();
        const countryCard = document.createElement('div');
        countryCard.classList.add('country-card');
        countryCard.innerHTML = '<div class="loader"></div>';
        const apiUrl = `https://api.api-ninjas.com/v1/country?name=${getCountryCode(country)}`;
        fetchResource(apiUrl, { headers: { 'X-Api-Key': 'W+OQ/iBAPzIQYLIRvdQgVQ==ixnCBWtlJHxmXrMv' } })
            .then(data => {
                const cachedData = JSON.parse(data);
                renderCountryInfo(cachedData);
            })
            .catch(error => {
                handleError(error, countryCard);
            });
        async function renderCountryInfo(data) {
            const countryData = data[0];
            const gdp = countryData.gdp || 'N/A';
            const gdpGrowth = countryData.gdp_growth || 'N/A';
            const gdpPerCapita = countryData.gdp_per_capita || 'N/A';
            const territory = countryData.surface_area || 'N/A';
            const currencyCode = getCurrencyCode(country.currencies);
            try {
                const flagImage = await loadImage(`https://flagcdn.com/h120/${getCountryCode(country)}.png`);
                countryCard.innerHTML = `
                    <span class="flag-coat">
                      <img class="flag-image" src="${flagImage.src}" alt="${country.name.common} Flag">
                      <img class="coat-image" src="https://mainfacts.com/media/images/coats_of_arms/${getCountryCode(country)}.svg" alt="${country.name.common} Coat" loading="lazy">
                    </span>
                    <span class="material-symbols-outlined close-icon">close</span>s
                    <h2>
                      ${country.name.common}
                      <span class="material-symbols-outlined map-icon" onclick="showMapOfCountry('${country.name.common}')">location_on</span>
                      <span class="material-symbols-outlined cities-icon" onclick="showCountryCitiesTable('${country.name.common}')">apartment</span>
                    </h2>
                    <p><strong>Capital:</strong> ${country.capital}</p>
                    <p><strong>Language:</strong> ${country.languages[Object.keys(country.languages)[0]]}</p>
                    <p><strong>Currency:</strong> ${currencyCode}</p>
                    <p><strong>GDP:</strong> $${(gdp / 1000).toFixed(2)}b <i class="fas fa-dollar-sign"></i></p>
                    <p><strong>GDP Per Capita:</strong> $${gdpPerCapita} <i class="fas fa-dollar-sign"></i></p>
                    <p><strong>GDP Growth:</strong> <span class="gdp-growth ${gdpGrowth > 0 ? 'positive' : 'negative'}">${gdpGrowth}% ${gdpGrowth > 0 ? '&#8593;' : '&#8595;'}</span></p>
                    <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
                    <p><strong>Territory:</strong> ${territory} km<sup>2</sup></p>
                    <p><strong>Region:</strong> ${country.region}/${country.subregion}</p>
                    <p><strong>Neighboring Countries:</strong> ${getNeighboringCountries(country)}</p>
                    <span class="wiki-icon" onclick="openCountryWiki('${country.name.common}')">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/1/14/OOjs_UI_icon_logo-wikipedia.svg" alt="Wikipedia">
                    </span>
                    <span id="expand-icon-less" class="material-symbols-outlined">expand_less</span>`;
                const closeIcon = countryCard.querySelector('.close-icon');
                closeIcon?.addEventListener('click', () => hideCountryInfo());
                const expandIcon = document.getElementById('expand-icon-less');
                expandIcon?.addEventListener('click', () => showCountryInfo(row, country));
                const maxHeight = window.innerHeight * 0.7;
                countryCard.style.fontSize = countryCard.offsetHeight > maxHeight ? '12px' : '18px';
            } catch (error) {
                handleError(error, countryCard);
            }
        }
        row.classList.add('selected');
        selectedRowPage = currentPage;
        document.body.appendChild(countryCard);
        openCountryRow = {
            rowElement: row,
            countryCard: countryCard
        };
    }
}

async function showCountryInfo(row, country) {
    if (!(openCountryRow && openCountryRow.rowElement === row)) {
        hideCountryInfo();
        const countryCard = document.createElement('div');
        countryCard.classList.add('country-card');
        const flagImage = await loadImage(`https://flagcdn.com/h120/${getCountryCode(country)}.png`);
        countryCard.innerHTML = `
            <img src="${flagImage.src}" height="120" width="190" alt="${country.name.common} Flag">
            <span class="material-symbols-outlined close-icon">close</span>
            <h2>${country.name.common}</h2>
            <p><strong>Capital:</strong> ${country.capital}</p>
            <p><strong>Language:</strong> ${country.languages[Object.keys(country.languages)[0]]}</p>
            <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
            <span id="expand-icon" class="material-symbols-outlined">expand_more</span>`;
        row.classList.add('selected');
        selectedRowPage = currentPage;
        document.body.appendChild(countryCard);
        openCountryRow = {
            rowElement: row,
            countryCard: countryCard
        };
        const closeIcon = countryCard.querySelector('.close-icon');
        closeIcon?.addEventListener('click', () => hideCountryInfo());
        const expandIcon = document.getElementById('expand-icon');
        expandIcon?.addEventListener('click', () => showExpandedCountryInfo(row, country));
    }
}

function hideCountryInfo() {
    hideRowInfo(openCountryRow);
    hideRowInfo(openExpandedCountryRow);
    openCountryRow = null;
    openExpandedCountryRow = null;
    function hideRowInfo(row) {
        if (row && row.rowElement) {
            row.rowElement.classList.remove('selected');
        }
        if (row && row.countryCard) {
            row.countryCard.remove();
        }
    }
}

async function showNeighboringCountry(countryName) {
    if (!countryName) return;
    const country = independentCountries.find(c => c.name.common === countryName);
    const countryIndex = independentCountries.indexOf(country);
    const page = Math.floor(countryIndex / countriesPerPage) + 1;
    await setCurrentPage(page);
    const rows = countriesTable.querySelectorAll('tr');
    const row = Array.from(rows).find(row => row.cells[1].textContent.includes(country.name.common));
    if (row) {
        showExpandedCountryInfo(row, country);
    }
}

function showMapOfCountry(countryName) {
    const country = independentCountries.find(country => country.name.common === countryName);
    if (!country) return;
    countryNameElement.textContent = countryName;
    overlay.style.display = 'block';
    mapWindow.style.display = 'block';
    const closeButton = mapWindow.querySelector('.close-icon');
    closeButton.addEventListener('click', hideMapOfCountry);
    overlay.addEventListener('click', hideMapOfCountry);
    mapWindow.appendChild(document.getElementById('map-container'));
    if (marker) {
        map.removeLayer(marker);
    }
    if (!map) {
        map = L.map('map-container');
        const openstreetmapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        });
        const googlemapsStreetsLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        });
        googlemapsStreetsLayer.addTo(map);
        const openstreetmapButton = document.getElementById('openstreetmap-button');
        const googlemapsButton = document.getElementById('googlemaps-button');
        openstreetmapButton.addEventListener('click', () => {
            if (map.hasLayer(googlemapsStreetsLayer)) {
                map.removeLayer(googlemapsStreetsLayer);
                openstreetmapLayer.addTo(map);
            }
        });
        googlemapsButton.addEventListener('click', () => {
            if (!map.hasLayer(googlemapsStreetsLayer)) {
                map.removeLayer(openstreetmapLayer);
                googlemapsStreetsLayer.addTo(map);
            }
        });
    }
    map.setView([country.latlng[0], country.latlng[1]], 5);
    const markerIcon = L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Google_Maps_pin.svg',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    });
    marker = L.marker([country.latlng[0], country.latlng[1]], { icon: markerIcon });
    marker.addTo(map);
}

function hideMapOfCountry() {
    overlay.style.display = 'none';
    mapWindow.style.display = 'none';
}

function showCountryCitiesTable(countryName) {
    const country = independentCountries.find((country) => country.name.common === countryName);
    if (!country) return;
    const cityTable = document.getElementById('city-table');
    cityTable.innerHTML = '<div class="loader"></div>';
    cityTable.style.display = 'block';
    const apiUrl = `https://secure.geonames.org/searchJSON?country=${getCountryCode(country)}&featureCode=PPLC&featureCode=PPLA&maxRows=1000&username=flaks`;
    fetchResource(apiUrl, 'text')
        .then(data => {
            const cachedData = JSON.parse(data);
            if (cachedData.status && cachedData.status.value === 19) {
                throw new Error('Request limit exceeded');
            }
            processCityData(cachedData);
        })
        .catch(error => {
            console.error('Error:', error);
            cityTable.innerHTML = '<div class="error-message">Sorry, an error occurred while fetching city data. Please try again later.</div>';
        });

    function processCityData({ geonames }) {
        const filteredCities = geonames.filter((cityData) => cityData.population > 0).sort((a, b) => b.population - a.population);
        const citiesPerPage = countriesPerPage > 15 ? 15 : countriesPerPage;
        const citiesTotalPages = Math.ceil(filteredCities.length / citiesPerPage);
        const divContainer = document.createElement('div');
        divContainer.innerHTML = `
            <h2 class="city-title">Cities of ${countryName}</h2>
            <span class="material-symbols-outlined close-icon">close</span>
            <table id="cities-list"></table>
            <div class="cities-pagination">
              <div class="cities-pagination-container"></div>
            </div>`;
        const closeIcon = divContainer.querySelector('.close-icon');
        const citiesTable = divContainer.querySelector('#cities-list');
        cityTable.innerHTML = '';
        cityTable.appendChild(divContainer);
        renderCitiesTable(1);
        if (citiesTotalPages > 1) {
            renderCitiesPagination(citiesTotalPages);
        }
        overlay.style.display = 'block';
        closeIcon.addEventListener('click', hideCountryCitiesTable);
        overlay.addEventListener('click', hideCountryCitiesTable);

        function renderCitiesTable(page) {
            const startIndex = (page - 1) * citiesPerPage;
            const endIndex = startIndex + citiesPerPage;
            const citiesToShow = filteredCities.slice(startIndex, endIndex);
            citiesTable.innerHTML = `
              <tr>
                <th>City</th>
                <th>Population</th>
                <th>Wiki</th>
              </tr> ${citiesToShow.map((cityData) => `
              <tr onclick="openCountryWiki('${cityData.name}')">
                <td>${cityData.name}</td>
                <td>${cityData.population}</td>
                <td><span class="cities-wiki-icon">
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/14/OOjs_UI_icon_logo-wikipedia.svg" alt="Wikipedia">
              </span></td>
              </tr>`).join('')}`;
        }
        function renderCitiesPagination(totalPages) {
            const citiesPaginationContainer = cityTable.querySelector('.cities-pagination-container');
            citiesPaginationContainer.innerHTML = '';
            for (let i = 1; i <= totalPages; i++) {
                const button = document.createElement('button');
                button.textContent = i;
                button.addEventListener('click', () => {
                    renderCitiesTable(i);
                    const buttons = citiesPaginationContainer.querySelectorAll('button');
                    buttons.forEach((btn) => btn.classList.remove('active'));
                    button.classList.add('active');
                });
                if (i === 1) {
                    button.classList.add('active');
                }
                citiesPaginationContainer.appendChild(button);
            }
        }
    }
}

function hideCountryCitiesTable() {
    cityTable.style.display = 'none';
    overlay.style.display = 'none';
}

function getCountryCode(country) {
    return (country.cca2 || country.cca3).toLowerCase();
}

function getCurrency(currencies) {
    const [currencyCode] = Object.keys(currencies);
    if (currencyCode) {
        const { name } = currencies[currencyCode];
        return `${name} (${currencyCode})`;
    }
    return 'N/A';
}

function getCurrencyCode(currencies) {
    const [currencyCode] = Object.keys(currencies);
    return currencyCode || 'N/A';
}

function getNeighboringCountries(country) {
    if (country.borders && country.borders.length > 0) {
        const neighboringCountries = country.borders.map(border => {
            const neighboringCountry = independentCountries.find(c => c.cca3 === border);
            return neighboringCountry ? `<img class="neighboring-country-icon" src="https://flagcdn.com/24x18/${getCountryCode(neighboringCountry)}.png" alt="${neighboringCountry.name.common} Flag" onclick="showNeighboringCountry('${neighboringCountry.name.common}')"> ${neighboringCountry.name.common}` : '';
        }).filter(Boolean);
        return neighboringCountries.length > 0 ? neighboringCountries.join(', ') : "Don't Have";
    }
    return "Don't Have";
}

function sortTable() {
    toggleSortOrder();
    filteredCountries.reverse();
    renderCountriesTable(filteredCountries, currentPage);
    updateSortButton();
}

function toggleSortOrder() {
    sortOrder = !sortOrder;
    const sortSymbol = document.getElementById('sort-symbol');
    sortSymbol.style.transform = `rotate(${sortOrder ? '90deg' : '270deg'})`;
}

function updateSortButton() {
    const sortSymbol = document.getElementById('sort-symbol');
    sortSymbol.style.transform = `rotate(${sortOrder ? '90deg' : '270deg'})`;
    sortButton.dataset.sortOrder = sortOrder ? 'asc' : 'desc';
}

function openCountryWiki(countryName) {
    const wikiUrl = `https://en.wikipedia.org/wiki/${countryName}`;
    window.open(wikiUrl, '_blank');
}

function showFilterWindow() {
    filterWindow.style.display = 'block';
    overlay.style.display = 'block';
    const closeButton = filterWindow.querySelector('.close-icon');
    closeButton.addEventListener('click', hideFilterWindow);
    overlay.addEventListener('click', hideFilterWindow);
    regionToggleLabels.forEach((toggleLabel, index) => {
        const toggleIcon = toggleLabel.querySelector('.toggle-icon');
        const regionToggle = regionToggles[index];
        toggleLabel.addEventListener('click', function () {
            regionToggle.checked = !regionToggle.checked;
            toggleIcon.src = regionToggle.checked ? '/assets/images/toggle_on.svg' : '/assets/images/toggle_off.svg';
        });
        const initialRegionToggleValue = localStorage.getItem(`regionToggle${index}`);
        const initialToggleState = initialRegionToggleValue ? initialRegionToggleValue === 'true' : false;
        regionToggle.checked = initialToggleState;
        toggleIcon.src = initialToggleState ? '/assets/images/toggle_on.svg' : '/assets/images/toggle_off.svg';
        toggleStates[index] = initialToggleState;
    });
}

function hideFilterWindow() {
    overlay.style.display = 'none';
    filterWindow.style.display = 'none';
}

function showSettingsWindow() {
    if (mapWindow && mapWindow.style.display === 'block') {
        hideMapOfCountry();
    }
    if (cityTable && cityTable.style.display === 'block') {
        hideCountryCitiesTable();
    }
    if (filterWindow && filterWindow.style.display === 'block') {
        hideFilterWindow();
    }
    settingsWindow.style.display = 'block';
    overlay.style.display = 'block';
    const closeButton = settingsWindow.querySelector('.close-icon');
    closeButton.addEventListener('click', hideSettingsWindow);
    overlay.addEventListener('click', hideSettingsWindow);
}

function hideSettingsWindow() {
    overlay.style.display = 'none';
    settingsWindow.style.display = 'none';
}

function handleError(error, countryCard) {
    console.log('Error:', error);
    if (countryCard) countryCard.innerHTML = 'Failed to fetch country information.';
}

document.addEventListener('DOMContentLoaded', function () {
    toggleSortOrder();
    updateSortButton();
    bigCardToggle = document.getElementById('big-card-toggle');
    const bigCardToggleIcon = document.querySelector('#settings-window .toggle-icon');
    const bigCardToggleLabel = document.querySelector('#settings-window .toggle-label');
    setToggleState(bigCardToggle, bigCardToggleIcon, 'bigCardToggle');
    regionToggles.forEach((regionToggle, index) => {
        const toggleLabel = regionToggleLabels[index];
        const toggleIcon = toggleLabel.querySelector('.toggle-icon');
        setToggleState(regionToggle, toggleIcon, `regionToggle${index}`);
    });
    fetchCountries();
});

function setToggleState(toggle, toggleIcon, storageKey) {
    toggle.checked = localStorage.getItem(storageKey) === null ? true : localStorage.getItem(storageKey) === 'true';
    toggleIcon.src = toggle.checked ? '/assets/images/toggle_on.svg' : '/assets/images/toggle_off.svg';
    toggle.addEventListener('change', function () {
        toggleIcon.src = toggle.checked ? '/assets/images/toggle_on.svg' : '/assets/images/toggle_off.svg';
        localStorage.setItem(storageKey, toggle.checked);
    });
}