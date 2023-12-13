
function createLegendContent(){
    const maxWinPercentage = 100; // Maximum win percentage for color ramp

    let legendContent = '<div><strong>Games Played</strong></div>';

    const step = maxWinPercentage / 5; // Adjust the number of steps as needed

    for (let i = 0; i < 5; i++) {
        const from = i * step;
        const to = (i + 1) * step;

        // Calculate the radius for the proportional symbol (not used in this version)
        const radius = 5 + i * 5; // Increase radius by 5 for each step

        // Determine the label for the legend item
        const label = i === 4 ? '72+' : `${from}-${to}`;

        // Add black proportional symbol next to legend item
        const circleMarker = `<span class="legend-circle" style="background:black; border-radius: ${radius}px; display: inline-block; width: ${radius * 2}px; height: ${radius * 2}px;"></span>`;

        legendContent +=
            `<div>${circleMarker} ${label}</div>`;
    }

    return legendContent;
}


function createGrayLegendContent() {
    const maxWinPercentage = 100; // Maximum win percentage for color ramp
   

    let legendContent = '<div><strong>Win Percentage</strong></div>';

    const step = maxWinPercentage / 5; // Adjust the number of steps as needed

    for (let i = 0; i < 5; i++) {
        const from = i * step;
        const to = (i + 1) * step;

        // Calculate the radius for the proportional symbol (not used in this version)
        const radius = 5;

        // Calculate the color based on the midpoint of the range
        const midValue = (from + to) / 2;
        const color = getColor(midValue);

        // Add circle marker next to legend item with a border
        const circleMarker = `<span class="legend-circle" style="background:${color}; border-radius: ${radius}px; border: 1px solid black; display: inline-block; width: ${radius * 2}px; height: ${radius * 2}px;"></span>`;

        legendContent +=
            `<div>${circleMarker} ${from}&ndash;${to}</div>`;
    }

    return legendContent;
}

function getColor(winPercentage) {
    // Convert win percentage to a grayscale value (between 0 and 255)
    const grayscaleValue = Math.round((winPercentage / 100) * 255);

    // Create a grayscale color string
    const grayscaleColor = `rgb(${grayscaleValue}, ${grayscaleValue}, ${grayscaleValue})`;

    return grayscaleColor;
}






function createMap() {
    // Set up the map
    var map = L.map('college_football_map', {
        center: [39.8283, -98.5795],
        zoom: 4
    });

    // Add tile layer
    var defaultBasemap = L.tileLayer('https://api.mapbox.com/styles/v1/donaldmi/clonhl9e9003s01r7gnt51ksd/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZG9uYWxkbWkiLCJhIjoiY2xvaXlvYzhzMDBiODJsbW84dDg0OGYycyJ9.R7ApXrX_89B27zOIqDVujg', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    var customBasemap = L.tileLayer('http://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {foo: 'bar', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);

    // Add default basemap to map
    defaultBasemap.addTo(map);

    // Create a basemap switcher control
    var basemapSwitcher = L.control.layers({
        'Beaver Theme': defaultBasemap,
        'Default Basemap': customBasemap
    });

    basemapSwitcher.addTo(map);
    // Load and display the GeoJSON data
    fetch('data/Football_stadiums.geojson')
        .then(response => response.json())
        .then(data => {
            // Load and preprocess the CSV data
            return fetch('data/oregon_st_schedule.csv')
                .then(response => response.text())
                .then(csvData => {
                    // Parse the CSV data
                    const gameData = Papa.parse(csvData, { header: true }).data;

                    // Create a dictionary to store the count of games and wins for each stadium
                    const gameCountByStadium = {};
                    const winCountByStadium = {};

                    // Iterate through the game data to count games and wins for each stadium
                    gameData.forEach(game => {
                        const city = game.Location; // Assuming 'Location' in CSV corresponds to 'CITY' in GeoJSON
                        gameCountByStadium[city] = (gameCountByStadium[city] || 0) + 1;
                        if (game.Status === 'W') {
                            winCountByStadium[city] = (winCountByStadium[city] || 0) + 1;
                        }
                    });

                    // Create a GeoJSON layer with custom styling
                    // Create a GeoJSON layer with custom styling
                    const geojsonLayer = L.geoJSON(data, {
                        pointToLayer: function (feature, latlng) {
                            const city = feature.properties.CITY;
                            const gameCount = gameCountByStadium[city] || 0;
                
                            // Filter out stadiums with zero games played
                            if (gameCount === 0) {
                                return null; // Skip this stadium
                            }
                
                            const winCount = winCountByStadium[city] || 0;
                            const winPercentage = gameCount > 0 ? (winCount / gameCount) * 100 : 0;
                            const schoolName = feature.properties.COMP_AFFIL;
                            const stadiumName = feature.properties.NAME1;
                            const minGameCount = 1;
                            const maxGameCount = 72;
                            const maxRadiusDifference = 1;
                
                            // Assign color based on win percentage
                            const color = getColor(winPercentage);
                
                            // Set a constant radius for Corvallis
                            const constantRadius = 5; // You can adjust this value
                
                            // Calculate the radius based on the game count
                            let radius;
                            if (city === 'Corvallis') {
                                radius = 25;
                            } else {
                                // Calculate the radius with a difference of 5 for every 10 games played
                                radius = constantRadius + Math.floor((gameCount - minGameCount) / 5) * maxRadiusDifference;
                            }
                            
                            // Customize the appearance of each point based on win percentage
                            return L.circleMarker(latlng, {
                                radius: radius,
                                fillColor: color,
                                color: 'white',
                                weight: 1,
                                opacity: 1,
                                fillOpacity: 0.8,
                                zIndex: maxGameCount - gameCount // Adjust zIndex to ensure smaller symbols are on top
                            }).bindPopup(`Primary Home Team: ${schoolName}<br>Stadium: ${stadiumName} <br> Games Played: ${gameCount} <br> Win Percentage: ${winPercentage.toFixed(2)}%`);
                        }
                    });
                    geojsonLayer.addTo(map);

                    const legendContent = createLegendContent();

                    // Add legend to the map
                    const legend = L.control({ position: 'topright' });
                    legend.onAdd = function (map) {
                        const div = L.DomUtil.create('div', 'info legend');
                        div.innerHTML = legendContent;
                        return div;
                    };

                    legend.addTo(map);
                })
                .catch(error => {
                    console.error('Error loading data:', error);
                });
            })
            .catch(error => {
                console.error('Error loading data:', error);
            });
            var grayLegend = L.control({ position: 'topright' });

            grayLegend.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'yup legend');
                div.innerHTML = createGrayLegendContent();
                return div;
            };

            grayLegend.addTo(map);


            legend.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'info legend');

                return div;
            };
            legend.addTo(map);

    
}

// Call the function to create the map
createMap();




