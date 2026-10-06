from flask import Blueprint, request, jsonify
import os
import glob
import pandas as pd
import math
import requests
import json
import time
from dotenv import load_dotenv


# ==========================================================
# PROCUREMENT BLUEPRINT
# ==========================================================

procurement_bp = Blueprint(
    "procurement",
    __name__,
    url_prefix="/api/procurement"
)


# ==========================================================
# PATH CONFIGURATION
# ==========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DATASETS_DIR = os.path.join(
    BASE_DIR,
    "datasets"
)

# ==========================================================
# ENVIRONMENT CONFIGURATION
# ==========================================================

load_dotenv(
    os.path.join(
        BASE_DIR,
        ".env"
    ),
    override=True
)


# ==========================================================
# VALHALLA ROUTE CACHE
# ==========================================================

ROUTE_CACHE_FILE = os.path.join(
    BASE_DIR,
    "instance",
    "valhalla_route_cache.json"
)

# Successful road routes are stable enough for this project to
# reuse for 30 days. This prevents repeated page refreshes from
# consuming Geoapify API credits.
ROUTE_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60


def build_route_cache_key(lat1, lon1, lat2, lon2):
    """Create a stable cache key for one origin -> destination route."""

    return "|".join([
        f"{float(lat1):.6f}",
        f"{float(lon1):.6f}",
        f"{float(lat2):.6f}",
        f"{float(lon2):.6f}",
        "car"
    ])


def load_route_cache():
    """Load previously calculated successful Valhalla routes."""

    try:

        if not os.path.exists(
            ROUTE_CACHE_FILE
        ):
            return {}

        with open(
            ROUTE_CACHE_FILE,
            "r",
            encoding="utf-8"
        ) as cache_file:

            data = json.load(
                cache_file
            )

        if isinstance(
            data,
            dict
        ):
            return data

        return {}

    except Exception as error:

        print(
            "Valhalla cache read error:",
            str(error)
        )

        return {}


def save_route_cache(cache):
    """Persist successful Geoapify routes to backend/instance."""

    try:

        os.makedirs(
            os.path.dirname(
                ROUTE_CACHE_FILE
            ),
            exist_ok=True
        )

        temporary_file = (
            ROUTE_CACHE_FILE
            + ".tmp"
        )

        with open(
            temporary_file,
            "w",
            encoding="utf-8"
        ) as cache_file:

            json.dump(
                cache,
                cache_file,
                indent=2
            )

        os.replace(
            temporary_file,
            ROUTE_CACHE_FILE
        )

    except Exception as error:

        print(
            "Valhalla cache write error:",
            str(error)
        )


def get_cached_route(lat1, lon1, lat2, lon2):
    """
    Return a valid cached route as:
        (distance_km, duration_minutes)
    or:
        (None, None)
    """

    cache = load_route_cache()

    cache_key = build_route_cache_key(
        lat1,
        lon1,
        lat2,
        lon2
    )

    cached_route = cache.get(
        cache_key
    )

    if not isinstance(
        cached_route,
        dict
    ):
        return None, None

    cached_at = optional_float(
        cached_route.get(
            "cached_at"
        )
    )

    if cached_at is None:
        return None, None

    if (
        time.time()
        -
        cached_at
        >
        ROUTE_CACHE_TTL_SECONDS
    ):

        cache.pop(
            cache_key,
            None
        )

        save_route_cache(
            cache
        )

        return None, None

    distance_km = optional_float(
        cached_route.get(
            "distance_km"
        )
    )

    duration_minutes = optional_float(
        cached_route.get(
            "duration_minutes"
        )
    )

    if distance_km is None:
        return None, None

    return (
        round(
            distance_km,
            2
        ),
        (
            round(
                duration_minutes,
                1
            )
            if duration_minutes is not None
            else None
        )
    )


def cache_route(
    lat1,
    lon1,
    lat2,
    lon2,
    distance_km,
    duration_minutes
):
    """Save one successful GraphHopper route."""

    cache = load_route_cache()

    cache_key = build_route_cache_key(
        lat1,
        lon1,
        lat2,
        lon2
    )

    cache[
        cache_key
    ] = {
        "distance_km":
            round(
                float(
                    distance_km
                ),
                2
            ),
        "duration_minutes":
            (
                round(
                    float(
                        duration_minutes
                    ),
                    1
                )
                if duration_minutes is not None
                else None
            ),
        "cached_at":
            time.time(),
        "provider":
            "valhalla"
    }

    save_route_cache(
        cache
    )


# ==========================================================
# FIND PROCUREMENT CENTERS CSV
# ==========================================================

def find_centers_file():

    files = glob.glob(
        os.path.join(
            DATASETS_DIR,
            "*procurement*center*.csv"
        )
    )

    if not files:
        return None

    return files[0]


# ==========================================================
# CLEAN VALUE
# ==========================================================

def clean_value(value, default=""):

    if value is None:
        return default

    try:

        if pd.isna(value):
            return default

    except Exception:
        pass

    value = str(value).strip()

    if value.lower() in [
        "nan",
        "none",
        "null"
    ]:
        return default

    return value


# ==========================================================
# SAFE FLOAT
# ==========================================================

def safe_float(value, default=0):

    try:

        if value is None:
            return float(default)

        if pd.isna(value):
            return float(default)

        value = str(value).strip()

        if value == "":
            return float(default)

        return float(value)

    except Exception:
        return float(default)




# ==========================================================
# TEXT NORMALIZATION
# ==========================================================

def normalize_text(value):
    return " ".join(
        clean_value(
            value,
            ""
        ).lower().split()
    )


# ==========================================================
# OPTIONAL FLOAT
# ==========================================================

def optional_float(value):

    try:

        if value is None:
            return None

        if pd.isna(value):
            return None

        value = str(
            value
        ).strip()

        if value == "":
            return None

        return float(
            value
        )

    except Exception:
        return None


# ==========================================================
# VALIDATE COORDINATES
# ==========================================================

def valid_coordinates(
    latitude,
    longitude
):

    latitude = optional_float(
        latitude
    )

    longitude = optional_float(
        longitude
    )

    if (
        latitude is None
        or longitude is None
    ):
        return False

    return (
        -90 <= latitude <= 90
        and
        -180 <= longitude <= 180
    )


# ==========================================================
# HAVERSINE DISTANCE
# ==========================================================

def haversine_distance(
    lat1,
    lon1,
    lat2,
    lon2
):

    """
    Straight-line geographic distance in KM.

    Origin:
        farmer's entered profile village

    Destination:
        procurement center coordinates
    """

    lat1 = float(
        lat1
    )

    lon1 = float(
        lon1
    )

    lat2 = float(
        lat2
    )

    lon2 = float(
        lon2
    )

    earth_radius_km = 6371.0088

    lat1_rad = math.radians(
        lat1
    )

    lon1_rad = math.radians(
        lon1
    )

    lat2_rad = math.radians(
        lat2
    )

    lon2_rad = math.radians(
        lon2
    )

    delta_lat = (
        lat2_rad
        -
        lat1_rad
    )

    delta_lon = (
        lon2_rad
        -
        lon1_rad
    )

    a = (
        math.sin(
            delta_lat / 2
        ) ** 2
        +
        math.cos(
            lat1_rad
        )
        *
        math.cos(
            lat2_rad
        )
        *
        math.sin(
            delta_lon / 2
        ) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(
            a
        ),
        math.sqrt(
            1 - a
        )
    )

    distance = (
        earth_radius_km
        *
        c
    )

    return round(
        distance,
        2
    )


# ==========================================================
# GEOAPIFY GEOCODING + DRIVING ROAD DISTANCE
# ==========================================================

GEOCODE_CACHE_FILE = os.path.join(
    BASE_DIR,
    "instance",
    "geoapify_geocode_cache.json"
)


def get_geoapify_api_key():
    return clean_value(os.getenv("GEOAPIFY_API_KEY"), "")


def load_geocode_cache():
    try:
        if not os.path.exists(GEOCODE_CACHE_FILE):
            return {}
        with open(GEOCODE_CACHE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception as error:
        print("Geoapify geocode cache read error:", str(error))
        return {}


def save_geocode_cache(cache):
    try:
        os.makedirs(os.path.dirname(GEOCODE_CACHE_FILE), exist_ok=True)
        temp = GEOCODE_CACHE_FILE + ".tmp"
        with open(temp, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
        os.replace(temp, GEOCODE_CACHE_FILE)
    except Exception as error:
        print("Geoapify geocode cache write error:", str(error))


def build_geocode_query(place, mandal, district):
    parts = []
    for value in [place, mandal, district, "Andhra Pradesh", "India"]:
        value = clean_value(value, "")
        if value and normalize_text(value) not in [normalize_text(x) for x in parts]:
            parts.append(value)
    return ", ".join(parts)


def geocode_location(place, mandal, district):
    """Convert Place + Mandal + District to coordinates using Geoapify."""
    if not clean_value(place, ""):
        return None, None, "", "geoapify_geocode_location_missing"

    query = build_geocode_query(place, mandal, district)
    key = normalize_text(query)
    cache = load_geocode_cache()
    cached = cache.get(key)

    if isinstance(cached, dict):
        lat = optional_float(cached.get("latitude"))
        lon = optional_float(cached.get("longitude"))
        if valid_coordinates(lat, lon):
            return (
                lat, lon,
                clean_value(cached.get("formatted_address"), query),
                "geoapify_geocode_cached"
            )

    api_key = get_geoapify_api_key()
    if not api_key:
        print("GEOAPIFY API KEY NOT FOUND - add GEOAPIFY_API_KEY to backend/.env")
        return None, None, "", "geoapify_api_key_missing"

    try:
        response = requests.get(
            "https://api.geoapify.com/v1/geocode/search",
            params={
                "text": query,
                "format": "json",
                "limit": 5,
                "filter": "countrycode:in",
                "apiKey": api_key
            },
            timeout=20
        )

        if response.status_code == 429:
            return None, None, "", "geoapify_rate_limit"
        if response.status_code != 200:
            print("Geoapify geocoding error:", response.status_code, response.text[:500])
            return None, None, "", "geoapify_geocode_api_error"

        results = response.json().get("results", [])
        if not results:
            print("Geoapify location not found:", query)
            return None, None, "", "geoapify_geocode_not_found"

        wanted_place = normalize_text(place)
        wanted_mandal = normalize_text(mandal)
        wanted_district = normalize_text(district)

        best = None
        best_score = -1
        for result in results:
            result_text = normalize_text(" ".join([
                clean_value(result.get("name"), ""),
                clean_value(result.get("village"), ""),
                clean_value(result.get("suburb"), ""),
                clean_value(result.get("city"), ""),
                clean_value(result.get("county"), ""),
                clean_value(result.get("state_district"), ""),
                clean_value(result.get("state"), ""),
                clean_value(result.get("formatted"), "")
            ]))
            score = 0
            if wanted_place and wanted_place in result_text:
                score += 8
            if wanted_mandal and wanted_mandal in result_text:
                score += 4
            if wanted_district and wanted_district in result_text:
                score += 4
            if "andhra pradesh" in result_text:
                score += 2
            rank = result.get("rank", {})
            confidence = optional_float(rank.get("confidence") if isinstance(rank, dict) else None)
            if confidence is not None:
                score += confidence
            if score > best_score:
                best_score = score
                best = result

        if best is None:
            best = results[0]

        lat = optional_float(best.get("lat"))
        lon = optional_float(best.get("lon"))
        if not valid_coordinates(lat, lon):
            return None, None, "", "geoapify_geocode_invalid_coordinates"

        formatted = clean_value(best.get("formatted"), query)
        cache[key] = {
            "query": query,
            "latitude": lat,
            "longitude": lon,
            "formatted_address": formatted,
            "cached_at": time.time(),
            "provider": "geoapify"
        }
        save_geocode_cache(cache)
        print("Geoapify geocode:", query, "->", lat, lon, "|", formatted)
        return lat, lon, formatted, "geoapify_geocoding"

    except requests.exceptions.Timeout:
        return None, None, "", "geoapify_geocode_api_error"
    except requests.exceptions.RequestException as error:
        print("Geoapify geocoding request error:", str(error))
        return None, None, "", "geoapify_geocode_api_error"
    except Exception as error:
        print("Geoapify geocoding error:", str(error))
        return None, None, "", "geoapify_geocode_api_error"


def get_road_distance(lat1, lon1, lat2, lon2):
    """Calculate actual driving distance and time with Valhalla Routing API."""
    if not (valid_coordinates(lat1, lon1) and valid_coordinates(lat2, lon2)):
        return None, None, "coordinates_unavailable"

    cached_distance, cached_duration = get_cached_route(lat1, lon1, lat2, lon2)
    if cached_distance is not None:
        print("Valhalla cached route:", cached_distance, "KM |", cached_duration, "minutes")
        return cached_distance, cached_duration, "valhalla_cached_route"

    try:
        response = requests.post(
            "https://valhalla1.openstreetmap.de/route",
            json={
                "locations": [
                    {"lat": float(lat1), "lon": float(lon1)},
                    {"lat": float(lat2), "lon": float(lon2)}
                ],
                "costing": "auto",
                "units": "kilometers"
            },
            timeout=30
        )

        if response.status_code == 429:
            return None, None, "valhalla_rate_limit"
        if response.status_code != 200:
            print("Valhalla routing error:", response.status_code, response.text[:500])
            return None, None, "valhalla_api_error"

        trip = response.json().get("trip", {})
        summary = trip.get("summary", {}) if isinstance(trip, dict) else {}
        distance_km = optional_float(summary.get("length"))
        duration_s = optional_float(summary.get("time"))

        if distance_km is None:
            return None, None, "road_route_unavailable"

        distance_km = round(distance_km, 2)
        duration_minutes = round(duration_s / 60.0, 1) if duration_s is not None else None

        cache_route(lat1, lon1, lat2, lon2, distance_km, duration_minutes)
        print("Valhalla route:", distance_km, "KM |", duration_minutes, "minutes")
        return distance_km, duration_minutes, "valhalla_driving_route"

    except requests.exceptions.Timeout:
        return None, None, "valhalla_api_error"
    except requests.exceptions.RequestException as error:
        print("Valhalla routing request error:", str(error))
        return None, None, "valhalla_api_error"
    except Exception as error:
        print("Valhalla routing error:", str(error))
        return None, None, "valhalla_api_error"


# ==========================================================
# VILLAGE COORDINATES CSV DATASET
# ==========================================================

VILLAGE_COORDINATES_FILE = os.path.join(
    DATASETS_DIR,
    "location_district_mandal_village_with_coordinates.csv"
)

_village_coordinates_cache = None


def load_village_coordinates():
    """Load the village coordinates CSV master dataset."""
    global _village_coordinates_cache
    if _village_coordinates_cache is not None:
        return _village_coordinates_cache

    if not os.path.exists(VILLAGE_COORDINATES_FILE):
        print(f"Village coordinates file not found at {VILLAGE_COORDINATES_FILE}")
        _village_coordinates_cache = []
        return _village_coordinates_cache

    try:
        df = pd.read_csv(VILLAGE_COORDINATES_FILE)
        df.columns = [str(col).strip().lower() for col in df.columns]
        records = df.to_dict(orient="records")
        _village_coordinates_cache = records
        print(f"Loaded {len(records)} village coordinates from CSV.")
        return _village_coordinates_cache
    except Exception as error:
        print("Error loading village coordinates CSV:", str(error))
        _village_coordinates_cache = []
        return _village_coordinates_cache


def resolve_village_coordinates(district, mandal, village):
    """
    Resolve coordinates for a given (district, mandal, village).
    First queries the master CSV dataset, then falls back to Geoapify geocoding.
    """
    records = load_village_coordinates()

    norm_district = normalize_text(district)
    norm_mandal = normalize_text(mandal)
    norm_village = normalize_text(village)

    if records:
        # 1. Exact match (district, mandal, village)
        if norm_district and norm_mandal and norm_village:
            for r in records:
                if (
                    normalize_text(r.get("district")) == norm_district
                    and normalize_text(r.get("mandal")) == norm_mandal
                    and normalize_text(r.get("village")) == norm_village
                ):
                    lat = optional_float(r.get("latitude"))
                    lon = optional_float(r.get("longitude"))
                    if valid_coordinates(lat, lon):
                        return lat, lon, clean_value(r.get("lgd_village_code"), "")

        # 2. Match (mandal, village)
        if norm_mandal and norm_village:
            for r in records:
                if (
                    normalize_text(r.get("mandal")) == norm_mandal
                    and normalize_text(r.get("village")) == norm_village
                ):
                    lat = optional_float(r.get("latitude"))
                    lon = optional_float(r.get("longitude"))
                    if valid_coordinates(lat, lon):
                        return lat, lon, clean_value(r.get("lgd_village_code"), "")

        # 3. Match (district, village)
        if norm_district and norm_village:
            for r in records:
                if (
                    normalize_text(r.get("district")) == norm_district
                    and normalize_text(r.get("village")) == norm_village
                ):
                    lat = optional_float(r.get("latitude"))
                    lon = optional_float(r.get("longitude"))
                    if valid_coordinates(lat, lon):
                        return lat, lon, clean_value(r.get("lgd_village_code"), "")

        # 4. Match village alone
        if norm_village:
            for r in records:
                if normalize_text(r.get("village")) == norm_village:
                    lat = optional_float(r.get("latitude"))
                    lon = optional_float(r.get("longitude"))
                    if valid_coordinates(lat, lon):
                        return lat, lon, clean_value(r.get("lgd_village_code"), "")

        # 5. Partial match on village substring
        if norm_village and len(norm_village) >= 3:
            for r in records:
                r_v = normalize_text(r.get("village"))
                if norm_village in r_v or r_v in norm_village:
                    if not norm_district or normalize_text(r.get("district")) == norm_district:
                        lat = optional_float(r.get("latitude"))
                        lon = optional_float(r.get("longitude"))
                        if valid_coordinates(lat, lon):
                            return lat, lon, clean_value(r.get("lgd_village_code"), "")

        # 6. Fallback: match mandal & district to get representative coordinates
        if norm_mandal and norm_district:
            for r in records:
                if (
                    normalize_text(r.get("district")) == norm_district
                    and normalize_text(r.get("mandal")) == norm_mandal
                ):
                    lat = optional_float(r.get("latitude"))
                    lon = optional_float(r.get("longitude"))
                    if valid_coordinates(lat, lon):
                        return lat, lon, clean_value(r.get("lgd_village_code"), "")

        # 7. Fallback: match district alone
        if norm_district:
            for r in records:
                if normalize_text(r.get("district")) == norm_district:
                    lat = optional_float(r.get("latitude"))
                    lon = optional_float(r.get("longitude"))
                    if valid_coordinates(lat, lon):
                        return lat, lon, clean_value(r.get("lgd_village_code"), "")

    # Secondary fallback: Geoapify API geocoding
    place = village or mandal or district
    lat, lon, formatted, status = geocode_location(place, mandal, district)
    return lat, lon, ""


# ==========================================================
# GET VALUE FROM POSSIBLE COLUMN NAMES
# ==========================================================

def get_column_value(
    row,
    columns,
    default=""
):

    for column in columns:

        if column in row:

            value = clean_value(
                row.get(column),
                ""
            )

            if value != "":
                return value

    return default


# ==========================================================
# LOAD PROCUREMENT CENTERS
# ==========================================================

def load_centers():

    centers_file = find_centers_file()

    if not centers_file:

        print("")
        print(" Procurement centers CSV file not found")
        print("Expected folder:")
        print(DATASETS_DIR)
        print("")

        return []

    try:

        print("")
        print("==========================================")
        print(" PROCUREMENT CENTERS FILE")
        print("==========================================")
        print(centers_file)
        print("==========================================")

        df = pd.read_csv(
            centers_file
        )

        df.columns = [
            str(column).strip()
            for column in df.columns
        ]

        print(
            f" Procurement centers loaded: {len(df)}"
        )

        print(
            "Columns:",
            df.columns.tolist()
        )

        return df.to_dict(
            orient="records"
        )

    except Exception as error:

        print(
            " Error loading procurement centers:",
            str(error)
        )

        return []


# ==========================================================
# DISTRICT MATCH
# ==========================================================

def district_matches(
    center_district,
    search_district
):

    center_district = clean_value(
        center_district
    ).lower()

    search_district = clean_value(
        search_district
    ).lower()

    if not search_district:
        return True

    if center_district == search_district:
        return True

    return (
        search_district in center_district
        or center_district in search_district
    )


# ==========================================================
# CROP MATCH
# ==========================================================

def crop_matches(
    center,
    search_crop
):

    search_crop = clean_value(
        search_crop
    ).lower()

    if not search_crop:
        return True

    crop_columns = [

        "crop",
        "Crop",

        "crop_name",
        "Crop_Name",

        "supported_crops",
        "Supported_Crops",

        "recommended_for_crop",
        "Recommended_For_Crop",

        "commodity",
        "Commodity"

    ]

    crop_values = []

    for column in crop_columns:

        if column in center:

            value = clean_value(
                center.get(column)
            ).lower()

            if value:
                crop_values.append(
                    value
                )

    # Dataset does not contain crop information.
    # Therefore show procurement centers from
    # the selected district.

    if not crop_values:
        return True

    all_crops = " ".join(
        crop_values
    )

    return (
        search_crop
        in all_crops
    )


# ==========================================================
# GET PROCUREMENT CENTERS
# RETURNS MAXIMUM 5 CENTERS
# ==========================================================

@procurement_bp.route(
    "/centers",
    methods=["GET"]
)
def get_procurement_centers():

    try:

        # ==================================================
        # GET SEARCH PARAMETERS
        # ==================================================

        district = request.args.get(
            "district",
            ""
        ).strip()

        crop = request.args.get(
            "crop",
            ""
        ).strip()

        location_filter = request.args.get(
            "location",
            ""
        ).strip().lower()


        farmer_village = request.args.get(
            "village",
            ""
        ).strip()

        farmer_mandal = request.args.get(
            "mandal",
            ""
        ).strip()


        # ==================================================
        # FARMER ORIGIN COORDINATES
        # ==================================================

        origin_lat = optional_float(
            request.args.get("originLatitude")
            or request.args.get("latitude")
            or request.args.get("lat")
        )
        origin_lon = optional_float(
            request.args.get("originLongitude")
            or request.args.get("longitude")
            or request.args.get("lon")
        )

        if valid_coordinates(origin_lat, origin_lon):
            farmer_latitude = origin_lat
            farmer_longitude = origin_lon
            farmer_village_code = "query_coordinates"
        else:
            (
                farmer_latitude,
                farmer_longitude,
                farmer_village_code
            ) = resolve_village_coordinates(
                district,
                farmer_mandal,
                farmer_village
            )


        print("")
        print(
            "=========================================="
        )
        print(
            " FARMER DISTANCE ORIGIN"
        )
        print(
            "=========================================="
        )
        print(
            "District:",
            district
        )
        print(
            "Mandal:",
            farmer_mandal
        )
        print(
            "Village:",
            farmer_village
        )
        print(
            "Village Code:",
            farmer_village_code
        )
        print(
            "Latitude:",
            farmer_latitude
        )
        print(
            "Longitude:",
            farmer_longitude
        )
        print(
            "=========================================="
        )


        # ==================================================
        # LOAD DATASET
        # ==================================================

        centers = load_centers()


        if not centers:

            return jsonify({

                "success": True,

                "district": district,

                "crop": crop,

                "total_centers": 0,

                "showing": 0,

                "centers": [],

                "message":
                    "No procurement centers available."

            }), 200


        filtered_centers = []


        # ==================================================
        # FILTER ALL PROCUREMENT CENTERS
        # ==================================================

        for index, center in enumerate(
            centers,
            start=1
        ):


            # ==============================================
            # DISTRICT
            # ==============================================

            center_district = get_column_value(

                center,

                [
                    "district",
                    "District",
                    "district_name",
                    "District_Name"
                ]

            )


            # ==============================================
            # CENTER NAME
            # ==============================================

            center_name = get_column_value(

                center,

                [
                    "center_name",
                    "Center_Name",
                    "name",
                    "Name",
                    "Procurement_Center_Name",
                    "procurement_center_name"
                ],

                "Procurement Center"

            )


            # ==============================================
            # CENTER ID
            # ==============================================

            center_id = get_column_value(

                center,

                [
                    "id",
                    "ID",
                    "center_id",
                    "Center_ID",
                    "procurement_center_id"
                ],

                str(index)

            )


            # ==============================================
            # VILLAGE
            # ==============================================

            village = get_column_value(

                center,

                [
                    "village",
                    "Village",
                    "village_name",
                    "Village_Name"
                ]

            )


            # ==============================================
            # MANDAL
            # ==============================================

            mandal = get_column_value(

                center,

                [
                    "mandal",
                    "Mandal",
                    "mandal_name",
                    "Mandal_Name"
                ]

            )


            # ==============================================
            # LOCATION / AREA
            # ==============================================

            location = get_column_value(

                center,

                [
                    "location",
                    "Location",
                    "area",
                    "Area",
                    "address",
                    "Address"
                ]

            )


            if not location:

                if village:

                    location = village

                elif mandal:

                    location = mandal

                else:

                    location = center_district


            # ==============================================
            # CAPACITY
            # ==============================================

            total_capacity = get_column_value(

                center,

                [
                    "total_capacity",
                    "Total_Capacity",
                    "Total_Capacity_Tons",
                    "capacity",
                    "Capacity",
                    "capacity_tons"
                ],

                "0"

            )


            # ==============================================
            # CURRENT STOCK
            # ==============================================

            current_stock = get_column_value(

                center,

                [
                    "current_stock",
                    "Current_Stock",
                    "current_stock_tons"
                ],

                "0"

            )


            # ==============================================
            # AVAILABLE CAPACITY
            # ==============================================

            available_capacity = get_column_value(

                center,

                [
                    "available_capacity",
                    "Available_Capacity",
                    "available_capacity_tons",
                    "Available_Capacity_Tons"
                ],

                ""

            )


            # Calculate available capacity if it is missing

            if not available_capacity:

                available_capacity_value = (
                    safe_float(
                        total_capacity
                    )
                    -
                    safe_float(
                        current_stock
                    )
                )

                if available_capacity_value < 0:

                    available_capacity_value = 0

                available_capacity = (
                    available_capacity_value
                )


            # ==============================================
            # DISTRICT FILTER
            # ==============================================

            if not district_matches(

                center_district,

                district

            ):

                continue


            # ==============================================
            # CROP FILTER
            # ==============================================

            if not crop_matches(

                center,

                crop

            ):

                continue


            # ==============================================
            # LOCATION FILTER
            # ==============================================

            if location_filter:

                searchable_text = " ".join([

                    clean_value(
                        location
                    ).lower(),

                    clean_value(
                        village
                    ).lower(),

                    clean_value(
                        mandal
                    ).lower(),

                    clean_value(
                        center_name
                    ).lower(),

                    clean_value(
                        center_district
                    ).lower()

                ])


                if (
                    location_filter
                    not in searchable_text
                ):

                    continue


            # ==============================================
            # PROCUREMENT CENTER COORDINATES (DIRECT FROM CSV)
            # ==============================================

            center_latitude = optional_float(
                get_column_value(
                    center,
                    ["latitude", "Latitude", "lat", "Lat"]
                )
            )

            center_longitude = optional_float(
                get_column_value(
                    center,
                    ["longitude", "Longitude", "lon", "lng", "Lon", "Lng"]
                )
            )

            center_geocoded_address = f"{location}, {center_district}" if location else str(center_district)
            center_geocode_status = "csv_dataset"

            if not valid_coordinates(center_latitude, center_longitude):
                center_geocode_name = location or village or mandal or center_name
                (
                    center_latitude,
                    center_longitude,
                    center_geocoded_address,
                    center_geocode_status
                ) = geocode_location(
                    center_geocode_name,
                    mandal,
                    center_district
                )


            # ==============================================
            # FARMER VILLAGE -> CENTER DISTANCE
            # ==============================================

            actual_distance = None
            route_duration_minutes = None
            straight_line_distance = None

            distance_source = (
                "coordinates_unavailable"
            )

            if (
                valid_coordinates(
                    farmer_latitude,
                    farmer_longitude
                )
                and
                valid_coordinates(
                    center_latitude,
                    center_longitude
                )
            ):

                # Straight-line distance using Haversine formula
                straight_line_distance = haversine_distance(
                    farmer_latitude,
                    farmer_longitude,
                    center_latitude,
                    center_longitude
                )

                # Try driving road distance via Valhalla
                (
                    road_distance,
                    road_duration,
                    route_status
                ) = get_road_distance(
                    farmer_latitude,
                    farmer_longitude,
                    center_latitude,
                    center_longitude
                )

                if road_distance is not None and road_distance > 0:
                    actual_distance = road_distance
                    route_duration_minutes = road_duration
                    distance_source = route_status
                else:
                    # Fallback to straight-line distance so distance is NEVER missing
                    actual_distance = straight_line_distance
                    route_duration_minutes = round(
                        (straight_line_distance / 40.0) * 60.0,
                        1
                    )
                    distance_source = "haversine_distance"


            # ==============================================
            # ADD PROCUREMENT CENTER
            # ==============================================

            filtered_centers.append({

                "id":
                    str(center_id),

                "center_id":
                    str(center_id),

                "name":
                    str(center_name),

                "center_name":
                    str(center_name),

                "district":
                    str(center_district),

                "location":
                    str(location),

                "area":
                    str(location),

                "village":
                    str(village),

                "mandal":
                    str(mandal),

                "distance_km":
                    actual_distance,

                "distance":
                    actual_distance,

                "distance_source":
                    distance_source,

                "duration_minutes":
                    route_duration_minutes,

                "straight_line_distance_km":
                    straight_line_distance,

                "center_latitude":
                    center_latitude,

                "center_longitude":
                    center_longitude,

                "center_geocoded_address":
                    center_geocoded_address,

                "center_geocode_source":
                    center_geocode_status,

                "origin_village":
                    farmer_village,

                "origin_mandal":
                    farmer_mandal,

                "origin_district":
                    district,

                "origin_village_code":
                    farmer_village_code,

                "origin_latitude":
                    farmer_latitude,

                "origin_longitude":
                    farmer_longitude,

                "capacity":
                    safe_float(
                        total_capacity
                    ),

                "total_capacity":
                    safe_float(
                        total_capacity
                    ),

                "current_stock":
                    safe_float(
                        current_stock
                    ),

                "available_capacity":
                    safe_float(
                        available_capacity
                    )

            })


        # ==================================================
        # SORT BY FARMER VILLAGE DISTANCE
        # ==================================================

        filtered_centers.sort(
            key=lambda center: (
                center.get(
                    "distance_km"
                ) is None,
                (
                    center.get(
                        "distance_km"
                    )
                    if center.get(
                        "distance_km"
                    ) is not None
                    else float(
                        "inf"
                    )
                )
            )
        )


        # ==================================================
        # TOTAL CENTERS FOUND
        # ==================================================

        total_found = len(
            filtered_centers
        )


        # ==================================================
        # RETURN ONLY 5 CENTERS
        # ==================================================

        filtered_centers = (
            filtered_centers[:5]
        )


        # ==================================================
        # RESPONSE
        # ==================================================

        return jsonify({

            "success": True,

            "district":
                district,

            "crop":
                crop,

            "total_centers":
                total_found,

            "showing":
                len(
                    filtered_centers
                ),

            "centers":
                filtered_centers

        }), 200


    except Exception as error:

        print("")
        print("==========================================")
        print(" PROCUREMENT CENTER ERROR")
        print("==========================================")
        print(
            str(error)
        )
        print("==========================================")
        print("")


        return jsonify({

            "success": False,

            "message":
                "Unable to load procurement centers.",

            "error":
                str(error)

        }), 500