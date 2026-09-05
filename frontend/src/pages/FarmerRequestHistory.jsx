import React, {
  useEffect,
  useState
} from "react";

import axios from "axios";


const API =
  "http://127.0.0.1:5000";


function FarmerRequestHistory({

  user,

  goBack

}) {


  const [

    requests,

    setRequests

  ] = useState(
    []
  );


  const [

    loading,

    setLoading

  ] = useState(
    true
  );


  const [

    error,

    setError

  ] = useState(
    ""
  );


  const farmerId =

    user?.id ||

    user?.farmer_id ||

    user?.user_id;


  // =====================================================
  // LOAD FARMER REQUESTS
  // =====================================================

  const loadRequests =
    async () => {


      if (
        !farmerId
      ) {

        setError(
          "Farmer ID is not available."
        );

        setLoading(
          false
        );

        return;

      }


      try {

        setLoading(
          true
        );

        setError(
          ""
        );


        const response =
          await axios.get(

            `${API}/api/procurement-requests/farmer/${farmerId}`

          );


        if (
          response.data.success
        ) {

          setRequests(

            response.data.requests ||

            []

          );

        }


      } catch (
        error
      ) {

        console.error(
          error
        );


        setError(

          error.response?.data?.message ||

          "Unable to load procurement requests."

        );


      } finally {

        setLoading(
          false
        );

      }

    };


  useEffect(

    () => {

      loadRequests();

    },

    []

  );


  return (

    <div
      style={
        styles.page
      }
    >


      <div
        style={
          styles.header
        }
      >

        <button

          style={
            styles.backButton
          }

          onClick={
            goBack
          }

        >

          ← Back

        </button>


        <div>

          <h1>
            📋 My Procurement Requests
          </h1>


          <p>
            Track your request status.
          </p>

        </div>


        <button

          style={
            styles.refreshButton
          }

          onClick={
            loadRequests
          }

        >

          🔄 Refresh

        </button>


      </div>


      <div
        style={
          styles.container
        }
      >


        {loading && (

          <p>
            Loading requests...
          </p>

        )}


        {error && (

          <div
            style={
              styles.error
            }
          >

            ❌ {error}

          </div>

        )}


        {!loading &&

          !error &&

          requests.length === 0 && (

            <div
              style={
                styles.empty
              }
            >

              No procurement requests found.

            </div>

          )}


        {requests.map(

          request => (

            <div

              key={
                request.id
              }

              style={
                styles.card
              }

            >

              <div
                style={
                  styles.topRow
                }
              >

                <h2>

                  🌾 {request.crop}

                </h2>


                <span

                  style={
                    getStatusStyle(
                      request.status
                    )
                  }

                >

                  {request.status}

                </span>

              </div>


              <p>

                <b>
                  Request ID:
                </b>

                {" "}

                {request.id}

              </p>


              <p>

                <b>
                  Center:
                </b>

                {" "}

                {

                  request.center_name ||

                  request.procurement_center_name ||

                  "-"

                }

              </p>


              <p>

                <b>
                  District:
                </b>

                {" "}

                {

                  request.center_district ||

                  request.district ||

                  "-"

                }

              </p>


              <p>

                <b>
                  Quantity:
                </b>

                {" "}

                {request.quantity} tons

              </p>


              <p>

                <b>
                  Vehicle:
                </b>

                {" "}

                {

                  request.vehicle ||

                  "-"

                }

              </p>


              <p>

                <b>
                  Transport Cost:
                </b>

                {" "}

                ₹{

                  Number(

                    request.transport_cost ||

                    0

                  ).toFixed(
                    2
                  )

                }

              </p>


              <p>

                <b>
                  Request Sent:
                </b>

                {" "}

                {

                  request.created_at ||

                  "-"

                }

              </p>


              <p>

                <b>
                  Last Updated:
                </b>

                {" "}

                {

                  request.updated_at ||

                  "-"

                }

              </p>


              <div
                style={
                  styles.statusBox
                }
              >

                {

                  request.status ===
                  "pending" &&

                  "⏳ Your request is waiting for Government review."

                }


                {

                  request.status ===
                  "approved" &&

                  "✅ Your procurement request has been approved by Government."

                }


                {

                  request.status ===
                  "rejected" &&

                  "❌ Your procurement request has been rejected."

                }

              </div>


            </div>

          )

        )}


      </div>


    </div>

  );

}


function getStatusStyle(
  status
) {

  if (
    status === "approved"
  ) {

    return {

      ...styles.status,

      background:
        "#dcfce7",

      color:
        "#15803d"

    };

  }


  if (
    status === "rejected"
  ) {

    return {

      ...styles.status,

      background:
        "#fee2e2",

      color:
        "#dc2626"

    };

  }


  return {

    ...styles.status,

    background:
      "#fef3c7",

    color:
      "#d97706"

  };

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
      "25px",

    display:
      "flex",

    gap:
      "20px",

    alignItems:
      "center",

    justifyContent:
      "space-between"

  },


  container: {

    maxWidth:
      "900px",

    margin:
      "auto",

    padding:
      "30px"

  },


  card: {

    background:
      "white",

    marginBottom:
      "20px",

    padding:
      "25px",

    borderRadius:
      "12px",

    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)"

  },


  topRow: {

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center"

  },


  status: {

    padding:
      "8px 15px",

    borderRadius:
      "20px",

    fontWeight:
      "bold"

  },


  statusBox: {

    marginTop:
      "20px",

    padding:
      "15px",

    background:
      "#f1f8f3",

    borderRadius:
      "8px"

  },


  backButton: {

    padding:
      "10px 15px",

    border:
      "none",

    borderRadius:
      "8px",

    cursor:
      "pointer"

  },


  refreshButton: {

    padding:
      "10px 15px",

    background:
      "#176b4d",

    color:
      "white",

    border:
      "none",

    borderRadius:
      "8px",

    cursor:
      "pointer"

  },


  error: {

    padding:
      "15px",

    background:
      "#fee2e2",

    color:
      "#dc2626",

    borderRadius:
      "8px"

  },


  empty: {

    padding:
      "30px",

    background:
      "white",

    textAlign:
      "center",

    borderRadius:
      "10px"

  }

};


export default FarmerRequestHistory;