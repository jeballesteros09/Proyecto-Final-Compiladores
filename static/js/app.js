document.addEventListener("DOMContentLoaded", loadCities);

function loadCities() {
    fetch('/api/cities')
        .then(response => response.json())
        .then(data => displayCities(data))
        .catch(error => console.error("Error loading cities:", error));
}

// Función para buscar por nombre de ciudad
function searchByCityName() {
    const name = document.getElementById("searchCityName").value;
    fetch(`/api/cities/search?name=${name}`)
        .then(response => response.json())
        .then(data => displayCities(data))
        .catch(error => console.error("Error searching by city name:", error));
}

// Función para buscar por código de país
function searchByCountryCode() {
    const countryCode = document.getElementById("searchCountryCode").value;
    fetch(`/api/cities/search?countryCode=${countryCode}`)
        .then(response => response.json())
        .then(data => displayCities(data))
        .catch(error => console.error("Error searching by country code:", error));
}

// Función para buscar por nombre de distrito
function searchByDistrict() {
    const district = document.getElementById("searchDistrict").value;
    fetch(`/api/cities/search?district=${district}`)
        .then(response => response.json())
        .then(data => displayCities(data))
        .catch(error => console.error("Error searching by district:", error));
}

// Función para mostrar las ciudades en la tabla
function displayCities(cities) {
    const cityTable = document.getElementById("cityTable");
    cityTable.innerHTML = ''; // Limpia la pantalla de las filas existentes

    cities.forEach(city => {
        const row = document.createElement("tr");
        row.setAttribute("data-id", city.ID); // Asigna un identificador a cada fila

        row.innerHTML = `
            <td>${city.ID}</td>
            <td>${city.Name}</td>
            <td>${city.CountryCode}</td>
            <td>${city.District}</td>
            <td>${city.Population}</td>
            <td>
                <button onclick="enableEditMode(${city.ID})">Editar</button>
                <button onclick="deleteCity(${city.ID})">Eliminar</button>
            </td>
        `;
        
        cityTable.appendChild(row);
    });
}


function addCity() {
    // Obtiene los valores de los campos de entrada
    const cityName = document.getElementById("cityName").value;
    const countryCode = document.getElementById("countryCode").value;
    const district = document.getElementById("district").value;
    const population = document.getElementById("population").value;
    
    // Crear un objeto con los datos de la nueva ciudad
    const newCity = {
        Name: cityName,
        CountryCode: countryCode,
        District: district,
        Population: parseInt(population, 10)
    };
    
    // Enviar una solicitud POST para agregar la nueva ciudad
    fetch('/api/cities', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCity)
    })
    .then(response => {
        if (response.ok) {
            // Limpiar los campos del formulario
            document.getElementById("cityName").value = '';
            document.getElementById("countryCode").value = '';
            document.getElementById("district").value = '';
            document.getElementById("population").value = '';
            
            // Recargar la lista de ciudades para incluir la nueva ciudad
            loadCities();
        } else {
            console.error("Error al agregar la ciudad:", response.statusText);
        }
    })
    .catch(error => console.error("Error al agregar la ciudad:", error));
}


function enableEditMode(cityId) {
    const row = document.querySelector(`tr[data-id='${cityId}']`);
    if (!row) return; // Valida que exista la fila

    const cells = row.children;

    // Convierte cada celda (a excepcion del ID y los botones) a campos de input
    const name = cells[1].innerText;
    const countryCode = cells[2].innerText;
    const district = cells[3].innerText;
    const population = cells[4].innerText;

    cells[1].innerHTML = `<input type="text" value="${name}" id="editName${cityId}">`;
    cells[2].innerHTML = `<input type="text" value="${countryCode}" id="editCountryCode${cityId}" maxlength="3">`;
    cells[3].innerHTML = `<input type="text" value="${district}" id="editDistrict${cityId}">`;
    cells[4].innerHTML = `<input type="number" value="${population}" id="editPopulation${cityId}">`;

    // Cambia los botones a "Guardar" y "Cancelar"
    cells[5].innerHTML = `
        <button onclick="saveCity(${cityId})">Guardar</button>
        <button onclick="cancelEdit(${cityId}, '${name}', '${countryCode}', '${district}', ${population})">Cancelar</button>
    `;
}


function cancelEdit(cityId, name, countryCode, district, population) {
    const row = document.querySelector(`tr[data-id='${cityId}']`);
    if (!row) return; // Valida que exista la fila

    row.innerHTML = `
        <td>${cityId}</td>
        <td>${name}</td>
        <td>${countryCode}</td>
        <td>${district}</td>
        <td>${population}</td>
        <td>
            <button onclick="enableEditMode(${cityId})">Editar</button>
            <button onclick="deleteCity(${cityId})">Eliminar</button>
        </td>
    `;
}


function saveCity(cityId) {
    const updatedCity = {
        Name: document.getElementById(`editName${cityId}`).value,
        CountryCode: document.getElementById(`editCountryCode${cityId}`).value,
        District: document.getElementById(`editDistrict${cityId}`).value,
        Population: parseInt(document.getElementById(`editPopulation${cityId}`).value, 10)
    };

    fetch(`/api/cities/${cityId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedCity)
    })
    .then(response => {
        if (response.ok) {
            loadCities(); // Recargar la tabla para mostrar los cambios guardados
        } else {
            console.error("Error guardando la ciudad:", response.statusText);
        }
    })
    .catch(error => console.error("Error guardando la ciudad:", error));
}


function deleteCity(cityId) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta ciudad?")) return;

    fetch(`/api/cities/${cityId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            console.log("Ciudad eliminada con éxito");
            loadCities(); // Recargar la tabla para reflejar la eliminación
        } else {
            console.error("Error eliminando la ciudad:", response.statusText);
        }
    })
    .catch(error => console.error("Error eliminando la ciudad:", error));
}

