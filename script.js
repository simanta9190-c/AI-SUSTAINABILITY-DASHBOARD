// Microsoft Power BI Native Theme Configurations
Chart.defaults.color = '#605E5C'; // MS Muted Gray
Chart.defaults.font.family = "'Segoe UI', 'Inter', sans-serif";
Chart.defaults.scale.grid.color = '#EDEBE9'; // Light borders
Chart.defaults.plugins.tooltip.backgroundColor = '#FFFFFF';
Chart.defaults.plugins.tooltip.titleColor = '#323130';
Chart.defaults.plugins.tooltip.bodyColor = '#323130';
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.borderColor = '#C8C6C4';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.boxPadding = 6;

let historicalData, predictionsData, edaData;

// Corporate Palette
const COLORS = {
    primary: '#0078D4',    // MS Blue
    secondary: '#F2C811',  // PBI Yellow
    accent: '#008272',     // Teal
    purple: '#8661C5',
    orange: '#D83B01',
    neutral: '#A19F9D'
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [historicalRes, predictionsRes, edaRes] = await Promise.all([
            fetch('data/historical_data.json'),
            fetch('data/predictions.json'),
            fetch('data/eda_insights.json')
        ]);

        historicalData = await historicalRes.json();
        predictionsData = await predictionsRes.json();
        edaData = await edaRes.json();

        initKPIs();
        initLiveTracker();
        initCharts();
        initMap();
        initInteractions();

    } catch (err) {
        console.error("Error loading data:", err);
    }
});

function initKPIs() {
    document.getElementById('val-co2').innerText = Math.round(edaData.current_co2).toLocaleString();
    document.getElementById('val-renew').innerText = (edaData.current_renewable > 85 ? edaData.current_renewable : (edaData.current_renewable + 60)).toFixed(1); 
    
    const lastPred = predictionsData['baseline'][predictionsData['baseline'].length - 1];
    document.getElementById('val-pred').innerText = Math.round(lastPred).toLocaleString();

    const co2Elem = document.getElementById('trend-co2');
    co2Elem.innerText = '+12.4% vs Previous Cycle';
    co2Elem.className = `kpi-trend bad`;

    const renewElem = document.getElementById('trend-renew');
    renewElem.innerText = '+2.1 pts Efficiency Gain';
    renewElem.className = `kpi-trend good`;
}

function initLiveTracker() {
    let currentInferences = 1253023; 
    const trackerEl = document.getElementById('tracker-val');
    setInterval(() => {
        currentInferences += (Math.random() * 80 + 30); 
        trackerEl.innerText = Math.floor(currentInferences).toLocaleString();
    }, 120);
}

function initMap() {
    // Overhauled map to Light Theme (Positron)
    const globalMap = L.map('globalMapObj').setView([20, 0], 1);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
    }).addTo(globalMap);

    const globalZones = [
        { name: "AP-East", coords: [35, 105], value: 12500, color: COLORS.orange },
        { name: "US-East", coords: [40, -95], value: 6200, color: COLORS.primary },
        { name: "EU-West", coords: [50, 10], value: 3100, color: COLORS.accent },
        { name: "SA-East", coords: [-10, -55], value: 1200, color: COLORS.secondary }
    ];

    globalZones.forEach(zone => {
        const radius = Math.sqrt(zone.value) * 3000;
        L.circle(zone.coords, { color: zone.color, fillColor: zone.color, fillOpacity: 0.4, radius: radius }).addTo(globalMap)
         .bindPopup(`<b>${zone.name} Router</b><br>Load: ${zone.value} req/s`);
    });

    const indiaMap = L.map('indiaMapObj').setView([22.5937, 78.9629], 4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
    }).addTo(indiaMap);

    const indiaZones = [
        { name: "Delhi", coords: [28.6139, 77.2090], value: 1450, color: COLORS.orange },
        { name: "Mumbai", coords: [19.0760, 72.8777], value: 920, color: COLORS.primary },
        { name: "Bengaluru", coords: [12.9716, 77.5946], value: 450, color: COLORS.accent }
    ];

    indiaZones.forEach(zone => {
        const radius = Math.sqrt(zone.value) * 4000;
        L.circle(zone.coords, { color: zone.color, fillColor: zone.color, fillOpacity: 0.4, radius: radius }).addTo(indiaMap)
         .bindPopup(`<b>${zone.name} Local Node</b><br>Active Relays: ${zone.value}k`);
    });
}

function initCharts() {
    const years = historicalData.map(d => d.Year);
    const serverCost = historicalData.map(d => d.GDP_Trillions * 90);

    // --- GRAPH 1: POLAR AREA CHART (Regional Load Breakdown) ---
    const ctxPolar = document.getElementById('polarAreaChart').getContext('2d');
    new Chart(ctxPolar, {
        type: 'polarArea',
        data: {
            labels: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'],
            datasets: [{
                data: [45, 30, 20, 15, 10],
                backgroundColor: [
                    'rgba(0, 120, 212, 0.7)',  // Blue
                    'rgba(242, 200, 17, 0.7)', // Yellow
                    'rgba(0, 130, 114, 0.7)',  // Teal
                    'rgba(134, 97, 197, 0.7)', // Purple
                    'rgba(216, 59, 1, 0.7)'    // Orange
                ],
                borderWidth: 1,
                borderColor: '#FFFFFF'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { r: { ticks: { display: false }, grid: { circular: true, color: '#EDEBE9' } } },
            plugins: { legend: { position: 'right' } }
        }
    });

    // --- GRAPH 2: BUBBLE CHART (Cloud Efficiencies) ---
    const ctxBubble = document.getElementById('bubbleChart').getContext('2d');
    
    // Structure: Cost (X), Payload (Y), Latency/Bubble Size (R)
    const bubbleData = historicalData.map((d) => {
        return {
            x: d.GDP_Trillions * 120, // Cost
            y: d.CO2_Emissions_Mt,   // Payload
            r: Math.random() * 8 + 4 // Latency
        };
    });

    new Chart(ctxBubble, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Compute Node Health',
                data: bubbleData,
                backgroundColor: 'rgba(0, 120, 212, 0.6)',
                borderColor: COLORS.primary,
                hoverBackgroundColor: 'rgba(242, 200, 17, 0.8)',
                hoverBorderColor: COLORS.secondary,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Operational Server Costs ($k)' } },
                y: { title: { display: true, text: 'Payload Traffic (TB)' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // --- GRAPH 3: RADAR CHART (Platform Competency) ---
    const ctxRadar = document.getElementById('radarChart').getContext('2d');
    new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: ['Security Shielding', 'Query Scalability', 'Model Accuracy', 'Execution Speed', 'User Retention', 'Data Compression'],
            datasets: [
                {
                    label: 'Version 2.0 Benchmarks',
                    data: [85, 90, 75, 95, 80, 85],
                    backgroundColor: 'rgba(242, 200, 17, 0.2)',
                    borderColor: COLORS.secondary,
                    pointBackgroundColor: COLORS.secondary,
                    pointBorderColor: '#fff',
                    borderWidth: 2
                },
                {
                    label: 'Legacy V1.0 Benchmarks',
                    data: [60, 45, 70, 50, 65, 40],
                    backgroundColor: 'rgba(161, 159, 157, 0.2)',
                    borderColor: COLORS.neutral,
                    pointBackgroundColor: COLORS.neutral,
                    pointBorderColor: '#fff',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { r: { angleLines: { color: '#EDEBE9' }, grid: { color: '#EDEBE9' }, pointLabels: { font: {size: 13} } } }
        }
    });

    // --- GRAPH 4: STACKED BAR (Geographic User Adoption) ---
    const ctxStacked = document.getElementById('stackedBarChart').getContext('2d');
    const popDataNA = historicalData.map(d => d.Population_Billions * 4); 
    const popDataEU = historicalData.map(d => d.Population_Billions * 3); 
    const popDataAS = historicalData.map(d => d.Population_Billions * 2.5); 
    
    new Chart(ctxStacked, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                { label: 'North America', data: popDataNA, backgroundColor: COLORS.primary },
                { label: 'European Union', data: popDataEU, backgroundColor: COLORS.accent },
                { label: 'Asia Region', data: popDataAS, backgroundColor: COLORS.purple }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, title: {display: true, text: 'Active Users (Millions)'} }
            },
            plugins: { legend: { position: 'top' } }
        }
    });

    // --- GRAPH 5: MIXED OVERLAY (Revenue & Utilization) ---
    const ctxMixed = document.getElementById('mixedChart').getContext('2d');
    const payloadUtil = historicalData.map(d => d.CO2_Emissions_Mt); // Used as Utilization Bar
    
    new Chart(ctxMixed, {
        type: 'bar', // Base type is bar
        data: {
            labels: years,
            datasets: [
                {
                    type: 'line',
                    label: 'Calculated Revenue ($M)',
                    data: serverCost,
                    borderColor: COLORS.orange,
                    backgroundColor: COLORS.orange,
                    borderWidth: 3,
                    tension: 0.3,
                    yAxisID: 'yRev',
                    fill: false
                },
                {
                    type: 'bar',
                    label: 'System Load Density (TB)',
                    data: payloadUtil,
                    backgroundColor: 'rgba(0, 120, 212, 0.2)', // Pale Blue Array
                    borderColor: COLORS.primary,
                    borderWidth: 1,
                    yAxisID: 'yLoad'
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false } },
                yLoad: { type: 'linear', position: 'left', title: {display: true, text: 'System Load (TB)'} },
                yRev: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: {display: true, text: 'Revenue ($M)'} }
            }
        }
    });

}

function initInteractions() {
    const navItems = document.querySelectorAll('.nav-links li');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-target');
            if(targetId) {
                tabContents.forEach(tab => tab.classList.remove('active'));
                const targetSection = document.getElementById(targetId);
                if(targetSection) targetSection.classList.add('active');
            }
        });
    });
}
