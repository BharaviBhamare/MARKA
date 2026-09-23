/* ==========================================================================
   MARKA — EVERY JOURNEY LEAVES A MARK.
   Dashboard Analytics & Data Orchestration
   ========================================================================== */

let weeklyEmissionsChart = null;
let modeDonutChart = null;

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData();
    setupMobileMenu();
});

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.querySelector(".app-sidebar");
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("mobile-open");
        });
    }
}

/* ---------------------------------------------------------
   FETCH & REFRESH DASHBOARD DATA
--------------------------------------------------------- */
async function loadDashboardData() {
    try {
        const [statsRes, tripsRes, chartRes] = await Promise.all([
            fetch("/api/stats"),
            fetch("/api/trips"),
            fetch("/api/chart-data")
        ]);

        const statsData = await statsRes.json();
        const tripsData = await tripsRes.json();
        const chartData = await chartRes.json();

        if (statsData.status === "success") {
            renderKPIs(statsData.data);
        }

        if (tripsData.status === "success") {
            renderTripsTable(tripsData.trips);
        }

        if (chartData.status === "success") {
            renderWeeklyChart(chartData);
            renderDonutChart(chartData.breakdown);
        }
    } catch (err) {
        console.error("Dashboard data load error:", err);
    }
}

/* ---------------------------------------------------------
   RENDER KPI METRICS
--------------------------------------------------------- */
function renderKPIs(data) {
    const today = data.today;
    const week = data.week;

    safeUpdate("kpiTodayPassengerCarbon", today.passenger_carbon_kg.toFixed(2));
    safeUpdate("kpiTodayTotalCarbon", today.total_carbon_kg.toFixed(2));
    safeUpdate("kpiTodayCarbonSaved", today.carbon_saved_kg.toFixed(2));
    safeUpdate("kpiTodayDistance", today.distance_km.toFixed(2));

    safeUpdate("kpiGreenScore", data.green_score);
    const scoreBar = document.getElementById("kpiScoreBarFill");
    if (scoreBar) {
        const pct = Math.min(100, Math.round((data.green_score / 1000) * 100));
        scoreBar.style.width = `${pct}%`;
    }

    safeUpdate("kpiWeekSaved", week.carbon_saved_kg.toFixed(1) + " kg");
    safeUpdate("kpiAvgPassengers", week.avg_passengers + " / trip");
}

function safeUpdate(id, text) {
    const elem = document.getElementById(id);
    if (elem) elem.innerText = text;
}

/* ---------------------------------------------------------
   RENDER RECENT TRIPS TABLE
--------------------------------------------------------- */
function renderTripsTable(trips) {
    const tbody = document.getElementById("recentTripsTbody");
    if (!tbody) return;

    if (!trips || trips.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: #94a3b8;">No recorded trips yet. Start tracking to build your history!</td></tr>`;
        return;
    }

    let rowsHtml = "";
    trips.slice(0, 7).forEach(trip => {
        let vehicleIcon = "bi-car-front-fill";
        if (trip.vehicle_type === "electric_car") vehicleIcon = "bi-lightning-charge-fill";
        if (trip.vehicle_type === "hybrid_car") vehicleIcon = "bi-ev-front-fill";
        if (trip.vehicle_type === "public_bus") vehicleIcon = "bi-bus-front-fill";
        if (trip.vehicle_type === "cycling") vehicleIcon = "bi-bicycle";

        const passCount = trip.passengers || 1;
        const passBadge = passCount > 1 
            ? `<span class="passenger-avatar-stack"><i class="bi bi-people-fill"></i> ${passCount}</span>` 
            : `<span class="passenger-avatar-stack" style="background:#f1f5f9;"><i class="bi bi-person-fill"></i> Solo</span>`;

        const savedBadge = trip.carbon_saved_kg > 0
            ? `<span class="saved-pill">+${trip.carbon_saved_kg.toFixed(2)} kg saved</span>`
            : `<span style="color:#94a3b8; font-size:11px;">0.00 kg</span>`;

        rowsHtml += `
            <tr>
                <td>
                    <div class="trip-vehicle-pill">
                        <i class="bi ${vehicleIcon}"></i>
                        <div>
                            <strong>${trip.vehicle_name}</strong>
                            <small style="display:block; color:#94a3b8; font-size:10px;">${trip.timestamp}</small>
                        </div>
                    </div>
                </td>
                <td>${passBadge}</td>
                <td><strong>${trip.distance_km.toFixed(1)} km</strong></td>
                <td>${trip.total_carbon_kg.toFixed(2)} kg</td>
                <td><strong class="carbon-highlight-pass">${trip.passenger_carbon_kg.toFixed(2)} kg</strong></td>
                <td>${savedBadge}</td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

/* ---------------------------------------------------------
   CHART.JS: WEEKLY EMISSIONS COMPARISON
--------------------------------------------------------- */
function renderWeeklyChart(data) {
    const ctx = document.getElementById("weeklyChartCanvas");
    if (!ctx || typeof Chart === "undefined") return;

    if (weeklyEmissionsChart) {
        weeklyEmissionsChart.destroy();
    }

    weeklyEmissionsChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: "Gross Vehicle CO₂ (kg)",
                    data: data.gross_vehicle_emissions,
                    backgroundColor: "rgba(148, 163, 184, 0.4)",
                    borderRadius: 6,
                    barPercentage: 0.65
                },
                {
                    label: "Your Passenger Share CO₂ (kg)",
                    data: data.passenger_emissions,
                    backgroundColor: "rgba(5, 150, 105, 0.9)",
                    borderRadius: 6,
                    barPercentage: 0.65
                },
                {
                    label: "Carbon Avoided / Saved (kg)",
                    data: data.carbon_saved,
                    backgroundColor: "rgba(2, 132, 199, 0.8)",
                    borderRadius: 6,
                    barPercentage: 0.65
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        boxWidth: 12,
                        font: { family: "'Inter', sans-serif", size: 11, weight: 600 },
                        color: "#475569"
                    }
                },
                tooltip: {
                    backgroundColor: "#0f172a",
                    titleFont: { size: 12, family: "'Manrope', sans-serif" },
                    bodyFont: { size: 11, family: "'Inter', sans-serif" },
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9" },
                    ticks: {
                        font: { size: 10, family: "'Inter', sans-serif" },
                        color: "#94a3b8",
                        callback: val => val + " kg"
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 11, family: "'Inter', sans-serif", weight: 600 },
                        color: "#64748b"
                    }
                }
            }
        }
    });
}

/* ---------------------------------------------------------
   CHART.JS: MODAL BREAKDOWN DONUT
--------------------------------------------------------- */
function renderDonutChart(breakdown) {
    const ctx = document.getElementById("modeDonutCanvas");
    if (!ctx || typeof Chart === "undefined") return;

    if (modeDonutChart) {
        modeDonutChart.destroy();
    }

    const labels = [];
    const values = [];
    const colors = ["#059669", "#0284c7", "#6366f1", "#10b981", "#d97706", "#8b5cf6"];

    const friendlyNames = {
        petrol_sedan: "Sedan (Petrol)",
        diesel_suv: "Diesel SUV",
        hybrid_car: "Hybrid Crossover",
        electric_car: "Electric (EV)",
        public_bus: "Public Bus",
        cycling: "Cycling / Active"
    };

    let colorIdx = 0;
    const bgColors = [];

    for (const [key, item] of Object.entries(breakdown || {})) {
        labels.push(friendlyNames[key] || key);
        values.push(item.carbon);
        bgColors.push(colors[colorIdx % colors.length]);
        colorIdx++;
    }

    // Fallback if empty
    if (values.length === 0 || values.every(v => v === 0)) {
        labels.push("Sedan Carpool", "Public Bus", "Electric EV");
        values.push(4.2, 1.8, 0.9);
        bgColors.push("#059669", "#0284c7", "#6366f1");
    }

    modeDonutChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "74%",
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: item => ` ${item.label}: ${item.raw} kg CO₂`
                    }
                }
            }
        }
    });

    // Populate legend items
    const legendList = document.getElementById("donutLegendList");
    if (legendList) {
        let legHtml = "";
        labels.forEach((lab, i) => {
            legHtml += `
                <div class="legend-row">
                    <div class="legend-row-left">
                        <span class="legend-color-dot" style="background: ${bgColors[i]}"></span>
                        <span>${lab}</span>
                    </div>
                    <strong>${values[i]} kg</strong>
                </div>
            `;
        });
        legendList.innerHTML = legHtml;
    }
}
