import React, {
useState
} from "react";

const API =
"http://127.0.0.1:5000";

function ProcurementRequest({

user,

selectedCenter,

selectedCrop,

transportData,

goBack,

onRequestSent

}) {

const [quantity, setQuantity] =
useState(
transportData?.quantity ||
""
);

const [crop, setCrop] =
useState(
selectedCrop ||
user?.primary_crop ||
user?.crop ||
""
);

const [loading, setLoading] =
useState(false);

const [error, setError] =
useState("");

const [success, setSuccess] =
useState("");

const farmerName =
user?.full_name ||
user?.name ||
user?.farmer_name ||
user?.username ||
"Farmer";

const farmerId =
user?.id ||
user?.farmer_id ||
user?.user_id ||
1234;

const mobile =
user?.mobile_number ||
user?.mobile ||
user?.phone ||
"";

const district =
user?.district ||
user?.District ||
"";

const centerName =
selectedCenter?.center_name ||
selectedCenter?.name ||
"";

const centerId =
selectedCenter?.center_id ||
selectedCenter?.id ||
"";

const centerDistrict =
selectedCenter?.district ||
district;

const centerLocation =
selectedCenter?.location ||
selectedCenter?.mandal ||
"";

const distanceKm =
transportData?.distance ??
selectedCenter?.distance_km ??
0;

const vehicle =
transportData?.vehicle ||
"Medium Truck";

const transportCost =
transportData?.totalCost ??
transportData?.transport_cost ??
0;

const handleSubmit = async (
event
) => {

event.preventDefault();


setError("");

setSuccess("");


if (
  !quantity ||
  Number(quantity) <= 0
) {

  setError(
    "Please enter a valid quantity."
  );

  return;

}


if (!crop) {

  setError(
    "Please enter crop name."
  );

  return;

}


if (!centerName) {

  setError(
    "Please select a procurement center."
  );

  return;

}


const requestData = {

  farmer_id:
    farmerId,

  farmer_name:
    farmerName,

  mobile_number:
    mobile,

  district:
    district,

  crop:
    crop,

  quantity:
    Number(quantity),

  center_id:
    centerId,

  center_name:
    centerName,

  center_district:
    centerDistrict,

  center_location:
    centerLocation,

  distance_km:
    Number(distanceKm),

  vehicle:
    vehicle,

  transport_cost:
    Number(transportCost),

  total_cost:
    Number(transportCost)

};


console.log(
  "SENDING PROCUREMENT REQUEST:",
  requestData
);


try {

  setLoading(
    true
  );


  const response =
    await fetch(

      `${API}/api/procurement-requests`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify(
            requestData
          )

      }

    );


  const result =
    await response.json();


  console.log(
    "PROCUREMENT RESPONSE:",
    result
  );


  if (!response.ok) {

    throw new Error(

      result.message ||
      result.error ||
      "Unable to send procurement request."

    );

  }


  if (
    result.success === false
  ) {

    throw new Error(

      result.message ||
      result.error ||
      "Unable to send procurement request."

    );

  }


  const createdRequest =

    result.request ||

    result.data ||

    {

      ...requestData,

      id:
        result.request_id ||
        result.id ||
        null,

      status:
        result.status ||
        "pending"

    };


  setSuccess(
    "Procurement request created successfully."
  );


  console.log(
    "CREATED REQUEST:",
    createdRequest
  );


  setTimeout(() => {

    if (onRequestSent) {

      onRequestSent(
        createdRequest
      );

    }

  }, 1000);


} catch (error) {

  console.error(
    "PROCUREMENT REQUEST ERROR:",
    error
  );


  setError(

    error.message ||

    "Unable to send procurement request."

  );


} finally {

  setLoading(
    false
  );

}

};

return (

<div style={styles.page}>


  <header style={styles.header}>


    <button
      onClick={goBack}
      style={styles.backButton}
    >
      ← Back
    </button>


    <div>

      <h1 style={styles.title}>
        Send Procurement Request
      </h1>


      <p style={styles.subtitle}>
        Enter your crop details and send the request.
      </p>

    </div>


  </header>


  <main style={styles.main}>


    <div style={styles.container}>


      <section style={styles.infoCard}>


        <h2>
          👨‍🌾 Farmer Details
        </h2>


        <p>

          <b>Name:</b>

          {" "}

          {farmerName}

        </p>


        <p>

          <b>Mobile:</b>

          {" "}

          {mobile || "-"}

        </p>


        <p>

          <b>District:</b>

          {" "}

          {district || "-"}

        </p>


      </section>


      <section style={styles.infoCard}>


        <h2>
          🏢 Procurement Center
        </h2>


        <p>

          <b>Center ID:</b>

          {" "}

          {centerId || "-"}

        </p>


        <p>

          <b>Center Name:</b>

          {" "}

          {centerName || "-"}

        </p>


        <p>

          <b>Location:</b>

          {" "}

          {centerLocation || "-"}

        </p>


        <p>

          <b>Distance:</b>

          {" "}

          {distanceKm} KM

        </p>


      </section>


      <form
        onSubmit={handleSubmit}
        style={styles.formCard}
      >


        <h2>
          🌾 Crop Request Details
        </h2>


        {error && (

          <div style={styles.error}>

            ❌ {error}

          </div>

        )}


        {success && (

          <div style={styles.success}>

            ✅ {success}

          </div>

        )}


        <div style={styles.field}>


          <label>
            Crop Name
          </label>


          <input

            type="text"

            value={crop}

            onChange={(event) =>
              setCrop(
                event.target.value
              )
            }

            required

            style={styles.input}

          />


        </div>


        <div style={styles.field}>


          <label>
            Quantity (Tons)
          </label>


          <input

            type="number"

            min="0.01"

            step="0.01"

            value={quantity}

            onChange={(event) =>
              setQuantity(
                event.target.value
              )
            }

            placeholder="Enter quantity"

            required

            style={styles.input}

          />


        </div>


        <div style={styles.summary}>


          <h3>
            🚛 Transport Details
          </h3>


          <p>

            <b>Vehicle:</b>

            {" "}

            {vehicle}

          </p>


          <p>

            <b>Distance:</b>

            {" "}

            {distanceKm} KM

          </p>


          <p>

            <b>Transport Cost:</b>

            {" "}

            ₹{transportCost}

          </p>


        </div>


        <button

          type="submit"

          disabled={loading}

          style={{

            ...styles.submitButton,

            opacity:
              loading
                ? 0.7
                : 1

          }}

        >

          {loading
            ? "Sending Request..."
            : "📨 Send Procurement Request"}

        </button>


      </form>


    </div>


  </main>


</div>

);

}

const styles = {

page: {

minHeight:
  "100vh",

background:
  "#f4f7f5",

fontFamily:
  "Arial, sans-serif"

},

header: {

background:
  "white",

padding:
  "25px 8%",

display:
  "flex",

alignItems:
  "center",

gap:
  "25px",

boxShadow:
  "0 2px 8px rgba(0,0,0,0.05)"

},

backButton: {

border:
  "none",

background:
  "#eaf4ed",

padding:
  "10px 18px",

borderRadius:
  "8px",

cursor:
  "pointer"

},

title: {

margin:
  0,

color:
  "#1f4d3a"

},

subtitle: {

color:
  "#777"

},

main: {

padding:
  "40px 20px"

},

container: {

maxWidth:
  "850px",

margin:
  "auto"

},

infoCard: {

background:
  "white",

padding:
  "25px",

borderRadius:
  "14px",

marginBottom:
  "20px",

boxShadow:
  "0 2px 8px rgba(0,0,0,0.05)"

},

formCard: {

background:
  "white",

padding:
  "30px",

borderRadius:
  "14px",

boxShadow:
  "0 2px 8px rgba(0,0,0,0.05)"

},

field: {

display:
  "flex",

flexDirection:
  "column",

marginBottom:
  "20px",

gap:
  "8px"

},

input: {

padding:
  "12px",

border:
  "1px solid #ccc",

borderRadius:
  "8px",

fontSize:
  "16px"

},

summary: {

background:
  "#f1f8f3",

padding:
  "20px",

borderRadius:
  "10px",

marginBottom:
  "20px"

},

submitButton: {

width:
  "100%",

padding:
  "15px",

border:
  "none",

borderRadius:
  "10px",

background:
  "#1f6b4f",

color:
  "white",

fontSize:
  "16px",

fontWeight:
  "bold",

cursor:
  "pointer"

},

error: {

background:
  "#ffe5e5",

color:
  "#b00020",

padding:
  "12px",

borderRadius:
  "8px",

marginBottom:
  "20px"

},

success: {

background:
  "#e3f7e8",

color:
  "#146c2e",

padding:
  "12px",

borderRadius:
  "8px",

marginBottom:
  "20px"

}

};

export default ProcurementRequest;