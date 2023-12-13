// Example function to load CSV data (using PapaParse)
function loadData(callback) {
    fetch('data/oregon_st_schedule.csv')
        .then(response => response.text())
        .then(csvData => {
            const parsedData = Papa.parse(csvData, { header: true }).data;
            callback(parsedData);
        });
}

// Example function to create a win-loss chart
function createWinLossChart(data) {
    const seasons = [...new Set(data.map(item => item.Year))];
    const winCount = [];
    const lossCount = [];

    seasons.forEach(season => {
        const seasonData = data.filter(item => item.Year === season);
        const wins = seasonData.filter(item => item.Status === 'W').length;
        

        winCount.push(wins);
        
    });

    const ctx = document.getElementById('winLossChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: seasons.map(String),
            datasets: [
                {
                    label: 'Wins',
                    backgroundColor: 'rgba(220, 68,5)', // Orange background
                    borderColor: 'rgba(220, 68,5)',
                    borderWidth: 1,
                    data: winCount,
                },
               
            ],
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        color: 'white', // X-axis text color
                    },
                    beginAtZero: true,
                },
                y: {
                    ticks: {
                        color: 'white', // X-axis text color
                    },
                    beginAtZero: true,
                },
            },
        },
    });
}

// Call functions to load data and create the chart
loadData(createWinLossChart);
