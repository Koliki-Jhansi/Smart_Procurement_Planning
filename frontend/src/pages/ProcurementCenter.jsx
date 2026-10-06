import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL as API } from "../apiConfig";

function ProcurementCenter({
user,
selectedCrop,
goBack,
onSelectCenter,
villageLatitude,
villageLongitude,
}) {

// =====================================================
// STATE
// =====================================================

const [centers, setCenters] =
useState([]);

const [loading, setLoading] =
useState(false);

const [error, setError] =
useState("");

const [selectedCenter, setSelectedCenter] =
useState(null);

const [searchDistrict, setSearchDistrict] =
useState("");

const [locationSearch, setLocationSearch] =
useState("");

// =====================================================
// FARMER INFORMATION
// =====================================================

const farmerName =
user?.full_name ||
user?.name ||
user?.farmer_name ||
user?.username ||
"Farmer";

const farmerVillage =
user?.village ||
user?.Village ||
"";

const farmerMandal =
user?.mandal ||
user?.Mandal ||
"";

const farmerLatitude =
villageLatitude ??
user?.latitude ??
user?.village_latitude ??
user?.lat ??
null;

const farmerLongitude =
villageLongitude ??
user?.longitude ??
user?.village_longitude ??
user?.lon ??
user?.lng ??
null;

const rawDistrict =
user?.district ||
user?.District ||
"";

const farmerDistrict =
rawDistrict
.toString()
.trim()
.toLowerCase()
.replace(
/\b\w/g,
(letter) => letter.toUpperCase()
);

// =====================================================
// SELECTED CROP
// =====================================================

// Keep the complete prediction object for the next page.
// farmerCropName is used only where a crop name string is required.
const farmerCrop =
selectedCrop ||
user?.crop ||
user?.primary_crop ||
user?.Crop ||
"";

const farmerCropName =
typeof farmerCrop === "string"
? farmerCrop
: farmerCrop?.crop ||
  farmerCrop?.name ||
  farmerCrop?.crop_name ||
  farmerCrop?.Crop ||
  "";

// =====================================================
// ACTIVE DISTRICT
// =====================================================

const activeDistrict =
searchDistrict.trim() ||
farmerDistrict;

// =====================================================
// NORMALIZE CENTER DATA
// =====================================================

const normalizeCenter = (
center,
index = 0
) => {

const centerId =
  center.id ||
  center.center_id ||
  center.procurement_center_id ||
  center.Procurement_Center_ID ||
  `CENTER-${index + 1}`;


const centerName =
  center.name ||
  center.center_name ||
  center.procurement_center_name ||
  center.Procurement_Center_Name ||
  "Procurement Center";


const centerDistrict =
  center.district ||
  center.District ||
  activeDistrict;


const centerVillage =
  center.village ||
  center.Village ||
  center.location ||
  center.Location ||
  "";


const centerMandal =
  center.mandal ||
  center.Mandal ||
  "";


const distance =

  center.distance_km ??

  center.distance ??

  center.Distance_KM ??

  null;


const capacity =

  center.total_capacity ??

  center.capacity ??

  center.Total_Capacity ??

  center.Total_Capacity_Tons ??

  null;


const availableCapacity =

  center.available_capacity ??

  center.Available_Capacity ??

  null;


const supportedCrops =

  center.supported_crops ||

  center.crops ||

  center.Crops ||

  [];


const centerLatitude =

  center.latitude ??

  center.Latitude ??

  center.lat ??

  null;


const centerLongitude =

  center.longitude ??

  center.Longitude ??

  center.lon ??

  center.lng ??

  null;


const distanceSource =

  center.distance_source ||

  center.distanceSource ||

  "";


return {

  ...center,

  id: centerId,

  center_id: centerId,

  name: centerName,

  center_name: centerName,

  district: centerDistrict,

  village: centerVillage,

  mandal: centerMandal,

  location: centerVillage,

  distance_km: distance,

  distance: distance,

  total_capacity: capacity,

  capacity: capacity,

  available_capacity:
    availableCapacity,

  supported_crops:
    supportedCrops,

  latitude:
    centerLatitude,

  longitude:
    centerLongitude,

  distance_source:
    distanceSource,

};

};

// =====================================================
// LOAD PROCUREMENT CENTERS
// =====================================================

const loadCenters = async (
districtToLoad = activeDistrict
) => {

const cleanDistrict =
  districtToLoad
    .toString()
    .trim();


const cleanCrop =
  String(farmerCropName || "").trim();


// -------------------------------------------------
// VALIDATE DISTRICT
// -------------------------------------------------

if (!cleanDistrict) {

  setError(
    "Please enter or select a district to find procurement centers."
  );

  setCenters([]);

  return;

}


// -------------------------------------------------
// VALIDATE CROP (OPTIONAL FOR DISPLAYING CENTERS)
// -------------------------------------------------

setLoading(true);

setError("");

setSelectedCenter(null);


try {

  console.log(
    "Loading procurement centers"
  );


  console.log(
    "District:",
    cleanDistrict
  );


  console.log(
    "Crop:",
    cleanCrop
  );


  console.log(
    "Farmer village:",
    farmerVillage
  );


  console.log(
    "Farmer coordinates:",
    farmerLatitude,
    farmerLongitude
  );


  const response =
    await axios.get(

      `${API}/api/procurement/centers`,

      {

        params: {

          district:
            cleanDistrict,

          crop:
            cleanCrop,

          village:
            farmerVillage,

          mandal:
            farmerMandal,

          ...(farmerLatitude !== null &&
          farmerLatitude !== undefined
            ? { originLatitude: farmerLatitude }
            : {}),

          ...(farmerLongitude !== null &&
          farmerLongitude !== undefined
            ? { originLongitude: farmerLongitude }
            : {}),

        },

        timeout:
          10000,

      }

    );


  console.log(
    "Procurement center response:",
    response.data
  );


  const data =
    response.data;


  // -------------------------------------------------
  // API ERROR
  // -------------------------------------------------

  if (
    data?.success === false
  ) {

    setError(

      data.message ||

      "Unable to load procurement centers."

    );


    setCenters([]);

    return;

  }


  // -------------------------------------------------
  // CENTER LIST
  // -------------------------------------------------

  const centerList =

    data?.centers ||

    data?.procurement_centers ||

    [];


  if (
    Array.isArray(
      centerList
    )
  ) {

    const normalizedCenters =
      centerList.map(
        normalizeCenter
      );


    setCenters(
      normalizedCenters
    );

  } else {

    setCenters([]);

  }


} catch (err) {

  console.error(
    "Procurement center error:",
    err
  );


  setCenters([]);


  if (
    err.response
  ) {

    setError(

      err.response.data?.message ||

      `Server returned status ${err.response.status}.`

    );

  } else if (
    err.request
  ) {

    setError(
      "Unable to load procurement centers. Please check your connection or try again later."
    );

  } else {

    setError(
      "Unable to load procurement centers."
    );

  }


} finally {

  setLoading(false);

}

};

// =====================================================
// INITIAL LOAD
// =====================================================

useEffect(() => {

if (
  farmerDistrict
) {

  loadCenters(
    farmerDistrict
  );

}

}, [
farmerDistrict,
farmerCrop
]);

// =====================================================
// SEARCH DISTRICT
// =====================================================

const handleDistrictSearch =
() => {

  const district =
    searchDistrict
      .trim();


  if (
    !district
  ) {

    setError(
      "Please enter a district name."
    );

    return;

  }


  loadCenters(
    district
  );

};

// =====================================================
// RESET TO FARMER DISTRICT
// =====================================================

const resetToMyDistrict =
() => {

  setSearchDistrict("");

  setLocationSearch("");

  setSelectedCenter(null);

  setError("");

  loadCenters(
    farmerDistrict
  );

};

// =====================================================
// FILTER BY VILLAGE / LOCATION
// =====================================================

const filteredCenters =
centers.filter(
(center) => {

    if (
      !locationSearch.trim()
    ) {

      return true;

    }


    const search =
      locationSearch
        .trim()
        .toLowerCase();


    const searchableText =
      [

        center.name,

        center.location,

        center.village,

        center.mandal,

        center.district,

      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


    return searchableText.includes(
      search
    );

  }
);

// =====================================================
// SELECT CENTER
// =====================================================

const handleSelectCenter =
(center) => {

  console.log(
    "Selected procurement center:",
    center
  );

  setSelectedCenter(center);
  setError("");

  if (!farmerCrop) {
    setError("Crop information is missing.");
    return;
  }

  // Selecting a center immediately opens the Transport page.
  // Preserve the complete crop-prediction object and production in tons.
  const transportData = {
    center,
    selectedCrop: farmerCrop,
    crop: farmerCropName,
    estimated_production:
      typeof farmerCrop === "object" && farmerCrop !== null
        ? (
            farmerCrop?.estimated_production ??
            farmerCrop?.estimatedProduction ??
            farmerCrop?.predicted_production ??
            farmerCrop?.predictedProduction ??
            farmerCrop?.production ??
            null
          )
        : null,
    district: activeDistrict,
  };

  if (onSelectCenter) {
    onSelectCenter(transportData);
  }

};

// =====================================================
// CONTINUE TO TRANSPORT
// =====================================================

const continueToTransport =
() => {

  if (
    !selectedCenter
  ) {

    setError(
      "Please select a procurement center first."
    );

    return;

  }


  if (
    !farmerCrop
  ) {

    setError(
      "Crop information is missing."
    );

    return;

  }


  const transportData = {

    center:
      selectedCenter,

    // Preserve the full Crop Prediction result so TransportCost
    // receives estimated/predicted production in TONS.
    selectedCrop:
      farmerCrop,

    // Keep a plain crop-name field for backward compatibility.
    crop:
      farmerCropName,

    estimated_production:
      typeof farmerCrop === "object" && farmerCrop !== null
        ? (
            farmerCrop?.estimated_production ??
            farmerCrop?.estimatedProduction ??
            farmerCrop?.predicted_production ??
            farmerCrop?.predictedProduction ??
            farmerCrop?.production ??
            null
          )
        : null,

    district:
      activeDistrict,

  };


  console.log(
    "Sending to transportation:",
    transportData
  );


  if (
    onSelectCenter
  ) {

    onSelectCenter(
      transportData
    );

  }

};

// =====================================================
// GET CENTER DISTANCE
// =====================================================

const getCenterDistance =
(center) => {

  if (
    center.distance_km !== null &&
    center.distance_km !== undefined
  ) {

    return center.distance_km;

  }


  return null;

};

// =====================================================
// DISPLAY
// =====================================================

return (

<div style={styles.page}>


  {/* =================================================
      HEADER
  ================================================= */}

  <header style={styles.header}>


    <div>

      <p style={styles.headerLabel}>
        SMART PROCUREMENT SYSTEM
      </p>


      <h1 style={styles.headerTitle}>
        Procurement Centers
      </h1>


      <p style={styles.headerSubtitle}>
        Find a suitable procurement center
        for your predicted crop.
      </p>


    </div>


    <button
      onClick={goBack}
      style={styles.backButton}
    >

      ← Dashboard

    </button>


  </header>


  <main style={styles.container}>


    {/* =================================================
        SEARCH PANEL
    ================================================= */}

    <section style={styles.searchCard}>


      <div style={styles.searchHeader}>


        <div>

          <h2 style={styles.searchTitle}>
            🔎 Find Procurement Centers
          </h2>


          <p style={styles.searchSubtitle}>
            Search another district or
            filter centers by village or location.
          </p>


        </div>


        <button
          onClick={resetToMyDistrict}
          style={styles.resetButton}
        >

          📍 My District

        </button>


      </div>


      <div style={styles.searchGrid}>


        <div style={styles.searchField}>


          <label style={styles.inputLabel}>
            Search District
          </label>


          <input
            type="text"
            value={searchDistrict}
            onChange={(e) =>
              setSearchDistrict(
                e.target.value
              )
            }
            onKeyDown={(e) => {

              if (
                e.key === "Enter"
              ) {

                handleDistrictSearch();

              }

            }}
            placeholder={
              farmerDistrict ||
              "Enter district name"
            }
            style={styles.input}
          />


        </div>


        <div style={styles.searchField}>


          <label style={styles.inputLabel}>
            Filter Village / Location
          </label>


          <input
            type="text"
            value={locationSearch}
            onChange={(e) =>
              setLocationSearch(
                e.target.value
              )
            }
            placeholder={
              farmerVillage ||
              "Enter village or location"
            }
            style={styles.input}
          />


        </div>


        <button
          onClick={
            handleDistrictSearch
          }
          style={styles.searchButton}
        >

          🔍 Search Centers

        </button>


      </div>


    </section>


    {/* =================================================
        ERROR
    ================================================= */}

    {error && (

      <div style={styles.error}>


        <div>

          <strong>
            Unable to continue
          </strong>


          <p style={styles.errorText}>
            {error}
          </p>


        </div>


        <button
          onClick={() =>
            loadCenters(
              activeDistrict
            )
          }
          style={styles.retryButton}
        >

          🔄 Retry

        </button>


      </div>

    )}


    {/* =================================================
        LOADING
    ================================================= */}

    {loading && (

      <div style={styles.loadingCard}>


        <div style={styles.loadingIcon}>
          ⏳
        </div>


        <h2>
          Loading Centers...
        </h2>


        <p>

          Searching procurement centers
          for <b>{farmerCropName}</b>
          {" "}in <b>{activeDistrict}</b>

        </p>


      </div>

    )}


    {/* =================================================
        NO CENTERS
    ================================================= */}

    {!loading &&
      !error &&
      filteredCenters.length === 0 && (

        <div style={styles.emptyCard}>


          <div style={styles.emptyIcon}>
            🏢
          </div>


          <h2>
            No Suitable Procurement Centers Found
          </h2>


          <p>

            We could not find procurement
            centers for {farmerCropName} in
            {" "}{activeDistrict}.

          </p>


          <button
            onClick={() =>
              loadCenters(
                activeDistrict
              )
            }
            style={styles.primaryButton}
          >

            🔄 Refresh Centers

          </button>


        </div>

      )}


    {/* =================================================
        PROCUREMENT CENTER LIST
    ================================================= */}

    {!loading &&
      !error &&
      filteredCenters.length > 0 && (

        <section>


          <div style={styles.centerGrid}>


            {filteredCenters.map(
              (center, index) => {


                const isSelected =

                  selectedCenter?.id ===
                  center.id;


                const distance =
                  getCenterDistance(
                    center
                  );


                return (

                  <div

                    key={
                      center.id ||
                      index
                    }

                    style={{

                      ...styles.centerCard,

                      ...(isSelected
                        ? styles.selectedCenterCard
                        : {}),

                    }}

                  >


                    {isSelected && (

                      <div style={styles.selectedTag}>

                        ✓ Selected

                      </div>

                    )}


                    <div style={styles.centerIcon}>

                      🏢

                    </div>


                    <h2 style={styles.centerName}>

                      {center.name}

                    </h2>


                    <p style={styles.centerId}>

                      Center ID:
                      {" "}
                      {center.id}

                    </p>


                    <div style={styles.detailBox}>


                      <Detail
                        icon="🏛️"
                        label="District"
                        value={
                          center.district ||
                          "-"
                        }
                      />


                      <Detail
                        icon="📍"
                        label="Location"
                        value={
                          center.location ||
                          "-"
                        }
                      />


                      {center.mandal && (

                        <Detail
                          icon="🗺️"
                          label="Mandal"
                          value={
                            center.mandal
                          }
                        />

                      )}


                      {distance !== null && (

                        <Detail
                          icon="📏"
                          label="Straight-Line Distance"
                          value={
                            `${Number(distance).toFixed(2)} KM`
                          }
                        />

                      )}


                      {center.distance_source && (

                        <Detail
                          icon="🧭"
                          label="Distance Source"
                          value={
                            center.distance_source === "haversine"
                              ? "Haversine (Coordinates)"
                              : center.distance_source
                          }
                        />

                      )}


                      {center.available_capacity !== null &&
                        center.available_capacity !== undefined && (

                          <Detail
                            icon="📦"
                            label="Available Capacity"
                            value={
                              `${center.available_capacity} Tons`
                            }
                          />

                        )}


                    </div>


                    <button

                      onClick={() =>
                        handleSelectCenter(
                          center
                        )
                      }

                      style={

                        isSelected

                          ? styles.selectedButton

                          : styles.selectButton

                      }

                    >

                      Select Center →

                    </button>


                  </div>

                );

              }
            )}


          </div>


          {/* =========================================
              CONTINUE
          ========================================= */}

          {false && selectedCenter && (

            <div style={styles.continueCard}>


              <div>

                <p style={styles.continueLabel}>
                  SELECTED PROCUREMENT CENTER
                </p>


                <h2>
                  🏢 {selectedCenter.name}
                </h2>


                <p>

                  🌾 Crop:
                  {" "}
                  <strong>
                    {farmerCropName}
                  </strong>

                </p>


                <p>

                  📍 {
                    selectedCenter.location ||
                    selectedCenter.district
                  }

                </p>


              </div>


              <button
                onClick={
                  continueToTransport
                }
                style={styles.continueButton}
              >

                Continue to Transportation
                →

              </button>


            </div>

          )}


        </section>

      )}


  </main>


</div>

);

}

// =====================================================
// LOCATION ITEM
// =====================================================

function LocationItem({
icon,
label,
value,
}) {

return (

<div style={styles.locationItem}>


  <div style={styles.locationIcon}>
    {icon}
  </div>


  <div>

    <p style={styles.itemLabel}>
      {label}
    </p>


    <strong style={styles.itemValue}>
      {value}
    </strong>


  </div>


</div>

);

}

// =====================================================
// DETAIL
// =====================================================

function Detail({
icon,
label,
value,
}) {

return (

<div style={styles.detailRow}>


  <span>

    {icon}
    {" "}
    {label}

  </span>


  <strong>
    {value}
  </strong>


</div>

);

}

// =====================================================
// STYLES
// =====================================================

const styles = {

page: {

minHeight:
  "100vh",

background:
  "#f4f7f5",

fontFamily:
  "Arial, sans-serif",

},

header: {

background:
  "linear-gradient(135deg, #153f30, #286147)",

color:
  "white",

padding:
  "28px 7%",

display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",

gap:
  "18px",

},

headerLabel: {

fontSize:
  "11px",

letterSpacing:
  "1.5px",

opacity:
  0.7,

margin:
  "0 0 7px",

},

headerTitle: {

margin:
  "0 0 7px",

fontSize:
  "30px",

},

headerSubtitle: {

margin:
  0,

opacity:
  0.85,

},

backButton: {

padding:
  "11px 20px",

background:
  "white",

color:
  "#1f4d3a",

border:
  "none",

borderRadius:
  "8px",

cursor:
  "pointer",

fontWeight:
  "bold",

},

container: {

maxWidth:
  "1250px",

margin:
  "auto",

padding:
  "35px 25px 60px",

boxSizing:
  "border-box",

},

locationCard: {

background:
  "white",

padding:
  "28px",

borderRadius:
  "16px",

boxShadow:
  "0 5px 20px rgba(0,0,0,0.06)",

border:
  "1px solid #e8eeea",

},

locationCardHeader: {

display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",

gap:
  "20px",

},

cardLabel: {

margin:
  "0 0 7px",

fontSize:
  "11px",

color:
  "#5b8d72",

letterSpacing:
  "1px",

fontWeight:
  "bold",

},

cardTitle: {

margin:
  0,

color:
  "#254235",

},

locationBadge: {

background:
  "#edf7f0",

color:
  "#236144",

padding:
  "9px 14px",

borderRadius:
  "20px",

fontSize:
  "13px",

fontWeight:
  "bold",

},

locationGrid: {

display:
  "grid",

gridTemplateColumns:
  "repeat(auto-fit, minmax(220px, 1fr))",

gap:
  "15px",

marginTop:
  "25px",

},

locationItem: {

background:
  "#f6f9f7",

padding:
  "17px",

borderRadius:
  "12px",

display:
  "flex",

alignItems:
  "center",

gap:
  "12px",

},

locationIcon: {

width:
  "44px",

height:
  "44px",

background:
  "#e7f2eb",

borderRadius:
  "10px",

display:
  "flex",

alignItems:
  "center",

justifyContent:
  "center",

fontSize:
  "20px",

},

itemLabel: {

margin:
  "0 0 5px",

color:
  "#7b8580",

fontSize:
  "12px",

},

itemValue: {

color:
  "#294737",

},

locationHelp: {

color:
  "#68746d",

margin:
  "22px 0 0",

lineHeight:
  "1.6",

},

searchCard: {

marginTop:
  "25px",

background:
  "white",

padding:
  "28px",

borderRadius:
  "16px",

border:
  "1px solid #e8eeea",

},

searchHeader: {

display:
  "flex",

justifyContent:
  "space-between",

gap:
  "20px",

marginBottom:
  "20px",

},

searchTitle: {

margin:
  "0 0 7px",

color:
  "#254235",

},

searchSubtitle: {

margin:
  0,

color:
  "#747d78",

},

resetButton: {

height:
  "42px",

padding:
  "0 16px",

border:
  "1px solid #286147",

borderRadius:
  "8px",

background:
  "white",

color:
  "#236144",

cursor:
  "pointer",

fontWeight:
  "bold",

},

searchGrid: {

display:
  "grid",

gridTemplateColumns:
  "1fr 1fr auto",

gap:
  "15px",

alignItems:
  "end",

},

searchField: {

display:
  "flex",

flexDirection:
  "column",

},

inputLabel: {

fontSize:
  "13px",

fontWeight:
  "bold",

color:
  "#45574d",

marginBottom:
  "7px",

},

input: {

padding:
  "12px",

border:
  "1px solid #d8e0db",

borderRadius:
  "8px",

fontSize:
  "14px",

outline:
  "none",

boxSizing:
  "border-box",

background:
  "#ffffff",

color:
  "#1f2937",

colorScheme:
  "light",

},

searchButton: {

height:
  "44px",

padding:
  "0 22px",

border:
  "none",

borderRadius:
  "8px",

background:
  "#1f4d3a",

color:
  "white",

cursor:
  "pointer",

fontWeight:
  "bold",

},

activeSearch: {

display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",

margin:
  "28px 0 20px",

},

activeLabel: {

fontSize:
  "11px",

color:
  "#8a938e",

letterSpacing:
  "1px",

},

activeDistrict: {

margin:
  "5px 0",

color:
  "#254235",

},

cropInfo: {

margin:
  "8px 0 0",

color:
  "#52645a",

},

centerCount: {

background:
  "#eaf5ed",

color:
  "#236144",

padding:
  "10px 16px",

borderRadius:
  "20px",

fontWeight:
  "bold",

fontSize:
  "13px",

},

error: {

background:
  "#fff0f0",

border:
  "1px solid #f1cccc",

padding:
  "18px 20px",

borderRadius:
  "10px",

color:
  "#a52d2d",

display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",

gap:
  "20px",

},

errorText: {

margin:
  "5px 0 0",

},

retryButton: {

padding:
  "9px 15px",

border:
  "none",

borderRadius:
  "7px",

cursor:
  "pointer",

fontWeight:
  "bold",

},

loadingCard: {

background:
  "white",

padding:
  "55px",

textAlign:
  "center",

borderRadius:
  "16px",

},

loadingIcon: {

fontSize:
  "42px",

},

emptyCard: {

background:
  "white",

padding:
  "55px",

textAlign:
  "center",

borderRadius:
  "16px",

border:
  "1px solid #e8eeea",

},

emptyIcon: {

fontSize:
  "55px",

},

primaryButton: {

marginTop:
  "18px",

padding:
  "11px 20px",

background:
  "#1f4d3a",

color:
  "white",

border:
  "none",

borderRadius:
  "8px",

cursor:
  "pointer",

fontWeight:
  "bold",

},

sectionHeading: {

display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",

marginBottom:
  "20px",

},

selectedBadge: {

background:
  "#e6f6eb",

color:
  "#237a35",

padding:
  "9px 14px",

borderRadius:
  "20px",

fontWeight:
  "bold",

fontSize:
  "13px",

},

centersToolbar: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  margin: "4px 0 16px",
  padding: "0 2px",
},

centersToolbarText: {
  color: "#557064",
  fontSize: "13px",
  fontWeight: 700,
},

centerGrid: {

display:
  "grid",

gridTemplateColumns:
  "repeat(3, minmax(0, 1fr))",

gap:
  "20px",

},

centerCard: {

position:
  "relative",

minWidth:
  0,

width:
  "100%",

boxSizing:
  "border-box",

overflow:
  "hidden",

background:
  "white",

padding:
  "18px",

borderRadius:
  "20px",

border:
  "1px solid #e6ece8",

boxShadow:
  "0 12px 30px rgba(18,70,46,0.09)",

},

selectedCenterCard: {

border:
  "2px solid #2d7a55",

boxShadow:
  "0 8px 24px rgba(45,122,85,0.14)",

},

selectedTag: {

position:
  "absolute",

top:
  "15px",

right:
  "15px",

background:
  "#2d7a55",

color:
  "white",

padding:
  "6px 10px",

borderRadius:
  "15px",

fontSize:
  "11px",

fontWeight:
  "bold",

},

centerIcon: {

width:
  "58px",

height:
  "58px",

background:
  "#edf7f0",

borderRadius:
  "14px",

display:
  "flex",

justifyContent:
  "center",

alignItems:
  "center",

fontSize:
  "28px",

marginBottom:
  "18px",

},

centerName: {

color:
  "#254235",

overflowWrap:
  "anywhere",

wordBreak:
  "break-word",

margin:
  "0 0 8px",

fontSize:
  "20px",

},

centerId: {

color:
  "#7a847f",

overflowWrap:
  "anywhere",

wordBreak:
  "break-word",

fontSize:
  "12px",

margin:
  "0 0 18px",

},

detailBox: {

width:
  "100%",

boxSizing:
  "border-box",

background:
  "#f7faf8",

border:
  "1px solid #e4eee8",

borderRadius:
  "14px",

padding:
  "6px 12px",

overflow:
  "hidden",

},

detailRow: {

display:
  "grid",

gridTemplateColumns:
  "minmax(0, 1fr) minmax(0, 1.15fr)",

alignItems:
  "start",

gap:
  "10px",

padding:
  "10px 0",

borderBottom:
  "1px solid #e5ebe7",

fontSize:
  "12.5px",

lineHeight:
  1.4,

minWidth:
  0,

overflowWrap:
  "anywhere",

wordBreak:
  "break-word",

},

selectButton: {

width:
  "100%",

padding:
  "12px",

marginTop:
  "20px",

border:
  "1px solid #1f4d3a",

borderRadius:
  "8px",

background:
  "white",

color:
  "#1f4d3a",

cursor:
  "pointer",

fontWeight:
  "bold",

},

selectedButton: {

width:
  "100%",

padding:
  "12px",

marginTop:
  "20px",

border:
  "none",

borderRadius:
  "8px",

background:
  "#2d7a55",

color:
  "white",

cursor:
  "pointer",

fontWeight:
  "bold",

},

continueCard: {

marginTop:
  "30px",

padding:
  "25px 30px",

borderRadius:
  "16px",

background:
  "linear-gradient(135deg, #1f4d3a, #2d6a4f)",

color:
  "white",

display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",

gap:
  "25px",

},

continueLabel: {

margin:
  "0 0 6px",

fontSize:
  "11px",

letterSpacing:
  "1px",

opacity:
  0.7,

},

continueButton: {

padding:
  "13px 22px",

border:
  "none",

borderRadius:
  "8px",

background:
  "white",

color:
  "#1f4d3a",

cursor:
  "pointer",

fontWeight:
  "bold",

whiteSpace:
  "nowrap",

},

};

export default ProcurementCenter;