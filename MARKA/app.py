import sqlite3
import os
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            vehicle_type TEXT NOT NULL,
            vehicle_name TEXT NOT NULL,
            passengers INTEGER NOT NULL DEFAULT 1,
            distance_km REAL NOT NULL,
            total_carbon_kg REAL NOT NULL,
            passenger_carbon_kg REAL NOT NULL,
            carbon_saved_kg REAL NOT NULL DEFAULT 0.0,
            duration_sec INTEGER NOT NULL DEFAULT 0,
            avg_speed_kmh REAL NOT NULL DEFAULT 0.0,
            route_name TEXT
        )
    """)

    # Seed data if table is empty
    cursor.execute("SELECT COUNT(*) FROM trips")
    count = cursor.fetchone()[0]
    if count == 0:
        now = datetime.now()
        sample_trips = [
            (
                (now - timedelta(days=6, hours=4)).strftime("%Y-%m-%d %H:%M"),
                "petrol_sedan",
                "Sedan (Petrol)",
                3,
                14.2,
                round(14.2 * 0.180, 2),
                round((14.2 * 0.180) / 3, 2),
                round((14.2 * 0.180) - ((14.2 * 0.180) / 3), 2),
                1380,
                37.0,
                "Downtown Commute (Carpool)",
            ),
            (
                (now - timedelta(days=5, hours=8)).strftime("%Y-%m-%d %H:%M"),
                "public_bus",
                "City Electric Bus",
                28,
                9.5,
                round(9.5 * 1.150, 2),
                round((9.5 * 1.150) / 28, 2),
                round((9.5 * 0.180) - ((9.5 * 1.150) / 28), 2),
                1620,
                21.1,
                "Subway Express Route",
            ),
            (
                (now - timedelta(days=4, hours=2)).strftime("%Y-%m-%d %H:%M"),
                "hybrid_car",
                "Hybrid Crossover",
                2,
                18.0,
                round(18.0 * 0.105, 2),
                round((18.0 * 0.105) / 2, 2),
                round((18.0 * 0.105) / 2, 2),
                1800,
                36.0,
                "Tech Park Westway",
            ),
            (
                (now - timedelta(days=3, hours=5)).strftime("%Y-%m-%d %H:%M"),
                "electric_car",
                "Tesla Model 3 (EV)",
                4,
                26.4,
                round(26.4 * 0.045, 2),
                round((26.4 * 0.045) / 4, 2),
                round((26.4 * 0.180) - ((26.4 * 0.045) / 4), 2),
                2100,
                45.2,
                "Interstate Carpool",
            ),
            (
                (now - timedelta(days=2, hours=3)).strftime("%Y-%m-%d %H:%M"),
                "cycling",
                "Commuter Bike",
                1,
                4.8,
                0.0,
                0.0,
                round(4.8 * 0.180, 2),
                1140,
                15.2,
                "Greenway Park Loop",
            ),
            (
                (now - timedelta(days=1, hours=7)).strftime("%Y-%m-%d %H:%M"),
                "petrol_sedan",
                "Sedan (Petrol)",
                2,
                11.6,
                round(11.6 * 0.180, 2),
                round((11.6 * 0.180) / 2, 2),
                round((11.6 * 0.180) / 2, 2),
                1260,
                33.1,
                "Market District Run",
            ),
            (
                (now - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M"),
                "hybrid_car",
                "Hybrid Crossover",
                3,
                7.8,
                round(7.8 * 0.105, 2),
                round((7.8 * 0.105) / 3, 2),
                round((7.8 * 0.180) - ((7.8 * 0.105) / 3), 2),
                720,
                39.0,
                "Morning Office Shuttle",
            ),
        ]
        cursor.executemany("""
            INSERT INTO trips (
                timestamp, vehicle_type, vehicle_name, passengers, distance_km,
                total_carbon_kg, passenger_carbon_kg, carbon_saved_kg, duration_sec,
                avg_speed_kmh, route_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_trips)
        conn.commit()

    conn.close()


init_db()


# ---------------- PAGE ROUTES ----------------
@app.route("/")
def login():
    return render_template("login.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/tracking")
def tracking():
    return render_template("tracking.html")


@app.route("/analytics")
def analytics():
    return render_template("analytics.html")


@app.route("/goals")
def goals():
    return render_template("goals.html")


@app.route("/challenges")
def challenges():
    return render_template("challenges.html")


@app.route("/reports")
def reports():
    return render_template("reports.html")


# ---------------- API ENDPOINTS ----------------
@app.route("/api/stats")
def api_stats():
    conn = get_db_connection()
    cursor = conn.cursor()

    today_str = datetime.now().strftime("%Y-%m-%d")

    # Today's stats
    cursor.execute("""
        SELECT 
            COALESCE(SUM(passenger_carbon_kg), 0) as today_passenger_carbon,
            COALESCE(SUM(total_carbon_kg), 0) as today_total_carbon,
            COALESCE(SUM(carbon_saved_kg), 0) as today_carbon_saved,
            COALESCE(SUM(distance_km), 0) as today_distance,
            COUNT(*) as today_trips
        FROM trips
        WHERE timestamp LIKE ?
    """, (f"{today_str}%",))
    today = cursor.fetchone()

    # Overall / Weekly stats
    week_ago_str = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d %H:%M")
    cursor.execute("""
        SELECT 
            COALESCE(SUM(passenger_carbon_kg), 0) as week_passenger_carbon,
            COALESCE(SUM(total_carbon_kg), 0) as week_total_carbon,
            COALESCE(SUM(carbon_saved_kg), 0) as week_carbon_saved,
            COALESCE(SUM(distance_km), 0) as week_distance,
            COALESCE(AVG(passengers), 1.0) as avg_passengers,
            COUNT(*) as total_trips
        FROM trips
        WHERE timestamp >= ?
    """, (week_ago_str,))
    week = cursor.fetchone()

    # Green score computation: baseline 750 + bonus for carpooling / green modes, minus high solo driving
    saved_val = float(week["week_carbon_saved"])
    pass_val = float(week["week_passenger_carbon"])
    green_score = min(980, max(420, int(750 + (saved_val * 18) - (pass_val * 6))))

    conn.close()

    return jsonify({
        "status": "success",
        "data": {
            "today": {
                "passenger_carbon_kg": round(float(today["today_passenger_carbon"]), 2),
                "total_carbon_kg": round(float(today["today_total_carbon"]), 2),
                "carbon_saved_kg": round(float(today["today_carbon_saved"]), 2),
                "distance_km": round(float(today["today_distance"]), 2),
                "trips_count": int(today["today_trips"]),
            },
            "week": {
                "passenger_carbon_kg": round(float(week["week_passenger_carbon"]), 2),
                "total_carbon_kg": round(float(week["week_total_carbon"]), 2),
                "carbon_saved_kg": round(float(week["week_carbon_saved"]), 2),
                "distance_km": round(float(week["week_distance"]), 2),
                "avg_passengers": round(float(week["avg_passengers"]), 1),
                "total_trips": int(week["total_trips"]),
            },
            "green_score": green_score,
        }
    })


@app.route("/api/trips", methods=["GET", "POST"])
def api_trips():
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        data = request.get_json() or {}
        timestamp = data.get("timestamp") or datetime.now().strftime("%Y-%m-%d %H:%M")
        vehicle_type = data.get("vehicle_type", "petrol_sedan")
        vehicle_name = data.get("vehicle_name", "Sedan (Petrol)")
        passengers = max(1, int(data.get("passengers", 1)))
        distance_km = max(0.0, float(data.get("distance_km", 0.0)))
        total_carbon_kg = max(0.0, float(data.get("total_carbon_kg", 0.0)))
        passenger_carbon_kg = max(0.0, float(data.get("passenger_carbon_kg", 0.0)))
        carbon_saved_kg = max(0.0, float(data.get("carbon_saved_kg", 0.0)))
        duration_sec = int(data.get("duration_sec", 0))
        avg_speed_kmh = float(data.get("avg_speed_kmh", 0.0))
        route_name = data.get("route_name") or f"Trip on {timestamp.split(' ')[0]}"

        cursor.execute("""
            INSERT INTO trips (
                timestamp, vehicle_type, vehicle_name, passengers, distance_km,
                total_carbon_kg, passenger_carbon_kg, carbon_saved_kg, duration_sec,
                avg_speed_kmh, route_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            timestamp, vehicle_type, vehicle_name, passengers, distance_km,
            total_carbon_kg, passenger_carbon_kg, carbon_saved_kg, duration_sec,
            avg_speed_kmh, route_name
        ))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Trip saved successfully",
            "trip_id": new_id
        }), 201

    # GET: return recent trips
    cursor.execute("""
        SELECT * FROM trips 
        ORDER BY id DESC 
        LIMIT 15
    """)
    rows = cursor.fetchall()
    trips = [dict(row) for row in rows]
    conn.close()

    return jsonify({
        "status": "success",
        "trips": trips
    })


@app.route("/api/chart-data")
def api_chart_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 7-day trend
    days = []
    passenger_data = []
    gross_data = []
    saved_data = []

    for i in range(6, -1, -1):
        day_date = datetime.now() - timedelta(days=i)
        day_str = day_date.strftime("%Y-%m-%d")
        day_label = day_date.strftime("%a")

        cursor.execute("""
            SELECT 
                COALESCE(SUM(passenger_carbon_kg), 0) as pass_c,
                COALESCE(SUM(total_carbon_kg), 0) as gross_c,
                COALESCE(SUM(carbon_saved_kg), 0) as saved_c
            FROM trips
            WHERE timestamp LIKE ?
        """, (f"{day_str}%",))
        row = cursor.fetchone()

        days.append(day_label)
        passenger_data.append(round(float(row["pass_c"]), 2))
        gross_data.append(round(float(row["gross_c"]), 2))
        saved_data.append(round(float(row["saved_c"]), 2))

    # Breakdown by vehicle / mode
    cursor.execute("""
        SELECT 
            vehicle_type,
            COALESCE(SUM(passenger_carbon_kg), 0) as carbon,
            COALESCE(SUM(distance_km), 0) as distance
        FROM trips
        GROUP BY vehicle_type
    """)
    breakdown_rows = cursor.fetchall()
    breakdown = {row["vehicle_type"]: {
        "carbon": round(float(row["carbon"]), 2),
        "distance": round(float(row["distance"]), 2)
    } for row in breakdown_rows}

    conn.close()

    return jsonify({
        "status": "success",
        "labels": days,
        "passenger_emissions": passenger_data,
        "gross_vehicle_emissions": gross_data,
        "carbon_saved": saved_data,
        "breakdown": breakdown
    })


# Curated Verified Indian Places Index for Instant Autocomplete
VERIFIED_LOCATIONS = [
    {"name": "Dhule, Maharashtra", "subtitle": "District Headquarters, Maharashtra", "type": "city", "lat": 20.9042, "lon": 74.7749},
    {"name": "Dhule Railway Station", "subtitle": "Central Railway, Dhule", "type": "station", "lat": 20.9015, "lon": 74.7770},
    {"name": "Deopur, Dhule", "subtitle": "Key Urban Area, Dhule, Maharashtra", "type": "locality", "lat": 20.9167, "lon": 74.7725},
    {"name": "Agrasen Maharaj Chowk, Dhule", "subtitle": "Central Junction, Dhule", "type": "landmark", "lat": 20.9055, "lon": 74.7758},
    {"name": "Shirpur, Maharashtra", "subtitle": "Dhule District, Maharashtra (55 km)", "type": "city", "lat": 21.3500, "lon": 74.8800},
    {"name": "Sakri, Maharashtra", "subtitle": "Dhule District, Maharashtra (52 km)", "type": "city", "lat": 20.9333, "lon": 74.3167},
    {"name": "Dondaicha, Maharashtra", "subtitle": "Dhule District, Maharashtra (48 km)", "type": "city", "lat": 21.3292, "lon": 74.5714},
    {"name": "Malegaon, Maharashtra", "subtitle": "Textile Hub, Nashik District (50 km from Dhule)", "type": "city", "lat": 20.5539, "lon": 74.5269},
    {"name": "Jalgaon, Maharashtra", "subtitle": "North Maharashtra Hub (90 km from Dhule)", "type": "city", "lat": 21.0077, "lon": 75.5626},
    {"name": "Nashik, Maharashtra", "subtitle": "Kumbh City, Maharashtra (158 km from Dhule)", "type": "city", "lat": 19.9975, "lon": 73.7898},
    {"name": "New Delhi, Delhi", "subtitle": "National Capital of India (984 km from Dhule)", "type": "city", "lat": 28.6139, "lon": 77.2090},
    {"name": "Connaught Place, New Delhi", "subtitle": "Central Delhi Commercial Center", "type": "landmark", "lat": 28.6315, "lon": 77.2167},
    {"name": "Indira Gandhi International Airport (DEL)", "subtitle": "Terminal 3, New Delhi", "type": "airport", "lat": 28.5562, "lon": 77.1000},
    {"name": "India Gate, New Delhi", "subtitle": "Rajpath / Kartavya Path, New Delhi", "type": "landmark", "lat": 28.6129, "lon": 77.2295},
    {"name": "Delhi Cantt, Delhi", "subtitle": "Cantonment & Transit Hub, Delhi", "type": "station", "lat": 28.5983, "lon": 77.1264},
    {"name": "Mumbai, Maharashtra", "subtitle": "Financial Capital of India (325 km from Dhule)", "type": "city", "lat": 19.0760, "lon": 72.8777},
    {"name": "Chhatrapati Shivaji Maharaj Terminus (CSMT)", "subtitle": "Historic Rail Hub, South Mumbai", "type": "station", "lat": 18.9401, "lon": 72.8354},
    {"name": "Bandra Kurla Complex (BKC), Mumbai", "subtitle": "Prime Business District, Mumbai", "type": "landmark", "lat": 19.0664, "lon": 72.8688},
    {"name": "Pune, Maharashtra", "subtitle": "IT & Automobile Capital, Maharashtra (335 km)", "type": "city", "lat": 18.5204, "lon": 73.8567},
    {"name": "Indore, Madhya Pradesh", "subtitle": "Cleanest City, Madhya Pradesh (260 km from Dhule)", "type": "city", "lat": 22.7196, "lon": 75.8577},
    {"name": "Surat, Gujarat", "subtitle": "Diamond & Textile City, Gujarat (230 km)", "type": "city", "lat": 21.1702, "lon": 72.8311},
    {"name": "Ahmedabad, Gujarat", "subtitle": "Mega City, Gujarat (460 km from Dhule)", "type": "city", "lat": 23.0225, "lon": 72.5714},
    {"name": "Chhatrapati Sambhajinagar (Aurangabad), MH", "subtitle": "Heritage Tourism Hub (150 km from Dhule)", "type": "city", "lat": 19.8762, "lon": 75.3433},
    {"name": "Nagpur, Maharashtra", "subtitle": "Orange City & Zero Mile, Maharashtra", "type": "city", "lat": 21.1458, "lon": 79.0882},
    {"name": "Bengaluru, Karnataka", "subtitle": "Silicon Valley of India", "type": "city", "lat": 12.9716, "lon": 77.5946},
    {"name": "Hyderabad, Telangana", "subtitle": "Cyberabad & Charminar City", "type": "city", "lat": 17.3850, "lon": 78.4867},
    {"name": "Jaipur, Rajasthan", "subtitle": "Pink City, Rajasthan", "type": "city", "lat": 26.9124, "lon": 75.7873}
]


@app.route("/api/search-locations")
def api_search_locations():
    query = request.args.get("q", "").strip().lower()
    if not query:
        # Return popular initial choices with Dhule on top
        return jsonify({
            "status": "success",
            "results": VERIFIED_LOCATIONS[:8]
        })

    # 1. Match curated local and national locations
    matched = []
    for item in VERIFIED_LOCATIONS:
        if query in item["name"].lower() or query in item["subtitle"].lower():
            matched.append(item)

    # 2. If fewer than 4 matches and query length >= 3, search Nominatim
    if len(matched) < 4 and len(query) >= 3:
        try:
            encoded_q = urllib.parse.quote(query)
            url = f"https://nominatim.openstreetmap.org/search?format=json&q={encoded_q}&countrycodes=in&limit=4"
            req = urllib.request.Request(url, headers={"User-Agent": "MarkaEcoIntelligence/1.0"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode())
                for place in data:
                    raw_name = place.get("display_name", "")
                    parts = [p.strip() for p in raw_name.split(",")]
                    short_name = ", ".join(parts[:2])
                    subtitle = ", ".join(parts[2:5]) if len(parts) > 2 else "India"
                    
                    matched.append({
                        "name": short_name,
                        "subtitle": subtitle,
                        "type": "locality",
                        "lat": float(place["lat"]),
                        "lon": float(place["lon"])
                    })
        except Exception:
            pass

    return jsonify({
        "status": "success",
        "results": matched[:10]
    })


@app.route("/api/route")
def api_route():
    try:
        start_lat = float(request.args.get("start_lat", 20.9042))
        start_lon = float(request.args.get("start_lon", 74.7749))
        dest_lat = float(request.args.get("dest_lat", 28.6139))
        dest_lon = float(request.args.get("dest_lon", 77.2090))
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Invalid coordinates"}), 400

    # Query OSRM Driving Engine for actual road network tracing
    url = f"https://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{dest_lon},{dest_lat}?overview=full&geometries=geojson"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MarkaEcoIntelligence/1.0"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode())
            if data.get("routes") and len(data["routes"]) > 0:
                route = data["routes"][0]
                dist_km = round(route["distance"] / 1000.0, 1)
                dur_min = round(route["duration"] / 60.0)
                
                # Convert OSRM GeoJSON [lon, lat] coordinates to Leaflet [lat, lon]
                raw_coords = route["geometry"]["coordinates"]
                
                # Decimate if massive (over 2500 points) to optimize DOM rendering
                step = 1
                if len(raw_coords) > 2500:
                    step = max(1, len(raw_coords) // 1800)
                
                leaflet_coords = [[pt[1], pt[0]] for i, pt in enumerate(raw_coords) if i % step == 0 or i == len(raw_coords) - 1]
                
                legs = route.get("legs", [{}])[0]
                summary = legs.get("summary") or "National Highway Route"

                return jsonify({
                    "status": "success",
                    "distance_km": dist_km,
                    "duration_min": dur_min,
                    "summary": summary,
                    "coordinates": leaflet_coords
                })
    except Exception as e:
        print(f"OSRM query fallback triggered: {e}")

    # Fallback road corridor interpolation if OSRM is unreachable
    import math
    steps = 40
    coords = []
    # Haversine distance
    R = 6371.0
    dlat = math.radians(dest_lat - start_lat)
    dlon = math.radians(dest_lon - start_lon)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(start_lat)) * math.cos(math.radians(dest_lat)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    approx_dist = round(R * c * 1.22, 1)

    for i in range(steps + 1):
        ratio = i / steps
        lat = start_lat + (dest_lat - start_lat) * ratio + math.sin(ratio * math.pi) * 0.08
        lon = start_lon + (dest_lon - start_lon) * ratio - math.sin(ratio * math.pi) * 0.05
        coords.append([lat, lon])

    return jsonify({
        "status": "success",
        "distance_km": approx_dist,
        "duration_min": round(approx_dist * 1.1),
        "summary": "Corridor Route",
        "coordinates": coords
    })


if __name__ == "__main__":
    app.run(debug=True)