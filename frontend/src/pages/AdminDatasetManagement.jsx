import React, { useEffect, useState } from "react";

const API = "http://127.0.0.1:5000";

function AdminDatasetManagement({ goBack }) {
const DATASETS = [
{
key: "location",
icon: "📍",
title: "Location Dataset",
description:
"Upload district, mandal and village information.",
columns: [
"District",
"Mandal",
"Village"
]
},
{
key: "crop_production",
icon: "🌾",
title: "Crop Production Dataset",
description:
"Historical crop production data used to train the crop prediction model.",
columns: [
"District",
"Crop",
"Season",
"Year",
"Area",
"Production"
],
training: true
},
{
key: "procurement_centers",
icon: "🏢",
title: "Procurement Centers Dataset",
description:
"Upload procurement center information.",
columns: [
"Center ID",
"Center Name",
"District"
]
},
{
key: "warehouse",
icon: "🏭",
title: "Warehouse Dataset",
description:
"Upload warehouse information.",
columns: [
"Warehouse ID",
"Warehouse Name",
"District"
]
},
{
key: "transport",
icon: "🚚",
title: "Transport Dataset",
description:
"Upload village to procurement center distance information.",
columns: [
"Village",
"Center Name",
"Distance KM"
]
}
];

const [summary, setSummary] = useState({});
const [selectedFiles, setSelectedFiles] = useState({});
const [uploading, setUploading] = useState("");
const [loading, setLoading] = useState(true);

const [message, setMessage] = useState("");
const [messageType, setMessageType] = useState("");

const [training, setTraining] = useState(false);
const [trainingResult, setTrainingResult] = useState(null);

const loadDatasetSummary = async () => {
try {
setLoading(true);

  const adminMobile =
    localStorage.getItem("admin_mobile") || "";

  const response = await fetch(
    `${API}/api/admin/datasets/summary`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Mobile": String(adminMobile)
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Failed to load dataset summary."
    );
  }

  if (data.success) {
    setSummary(
      data.data ||
      data.summary ||
      {}
    );
  } else {
    throw new Error(
      data.message ||
      "Failed to load dataset summary."
    );
  }
} catch (error) {
  console.error(
    "Dataset summary error:",
    error
  );

  setMessageType("error");

  setMessage(
    error.message ||
    "Unable to load dataset summary."
  );
} finally {
  setLoading(false);
}

};

useEffect(() => {
loadDatasetSummary();
}, []);

const handleFileChange = (
datasetKey,
file
) => {
if (!file) {
return;
}

setSelectedFiles(
  previous => ({
    ...previous,
    [datasetKey]: file
  })
);

setMessage("");

};

const uploadDataset = async (
datasetKey
) => {
const file =
selectedFiles[datasetKey];

if (!file) {
  setMessageType("error");

  setMessage(
    "Please select a dataset file first."
  );

  return;
}

try {
  setUploading(datasetKey);

  setMessage("");
  setMessageType("");

  const adminMobile =
    localStorage.getItem(
      "admin_mobile"
    ) || "";

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "dataset_type",
    datasetKey
  );

  const response =
    await fetch(
      `${API}/api/admin/datasets/upload`,
      {
        method: "POST",
        headers: {
          "X-Admin-Mobile":
            String(adminMobile)
        },
        body: formData
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Dataset upload failed."
    );
  }

  if (!data.success) {
    throw new Error(
      data.message ||
      "Dataset upload failed."
    );
  }

  setMessageType("success");

  setMessage(
    `✓ ${data.message || "Dataset uploaded successfully."}`
  );

  setSelectedFiles(
    previous => ({
      ...previous,
      [datasetKey]: null
    })
  );

  await loadDatasetSummary();

} catch (error) {
  console.error(
    "Upload error:",
    error
  );

  setMessageType("error");

  setMessage(
    error.message ||
    "Unable to upload dataset."
  );
} finally {
  setUploading("");
}

};

const trainCropModel = async () => {
try {
setTraining(true);

  setMessage("");
  setTrainingResult(null);

  const adminMobile =
    localStorage.getItem(
      "admin_mobile"
    ) || "";

  const response =
    await fetch(
      `${API}/api/admin/train-model`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",

          "X-Admin-Mobile":
            String(adminMobile)
        }
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Model training failed."
    );
  }

  if (!data.success) {
    throw new Error(
      data.message ||
      "Model training failed."
    );
  }

  setTrainingResult(data);

  setMessageType("success");

  setMessage(
    `✓ ${data.message || "Model trained successfully."}`
  );

  await loadDatasetSummary();

} catch (error) {
  console.error(
    "Training error:",
    error
  );

  setMessageType("error");

  setMessage(
    error.message ||
    "Unable to train the model."
  );
} finally {
  setTraining(false);
}

};

const getRecordCount = (
datasetKey
) => {
const item =
summary[datasetKey];

if (
  typeof item === "number"
) {
  return item;
}

if (
  item &&
  typeof item === "object"
) {
  return Number(
    item.records ||
    item.record_count ||
    item.count ||
    0
  );
}

return 0;

};

return (
<div
style={{
minHeight: "100vh",
background: "#f4f6f8",
padding: "30px",
fontFamily: "Arial, sans-serif"
}}
>
<div
style={{
maxWidth: "1200px",
margin: "auto"
}}
>
<div
style={{
background: "white",
padding: "25px",
borderRadius: "12px",
marginBottom: "25px",
boxShadow:
"0 3px 12px rgba(0,0,0,0.08)",
display: "flex",
justifyContent:
"space-between",
alignItems: "center",
flexWrap: "wrap",
gap: "15px"
}}
>
<div>
<h1
style={{
margin: "0 0 8px 0"
}}
>
📁 Dataset Management
</h1>

        <p
          style={{
            margin: 0,
            color: "#666"
          }}
        >
          Upload all required datasets.
          After uploading crop production data,
          train the prediction model and view
          the results.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px"
        }}
      >
        <button
          onClick={loadDatasetSummary}
          style={{
            background: "#455a64",
            color: "white",
            border: "none",
            padding: "11px 18px",
            borderRadius: "7px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          🔄 Refresh
        </button>

        <button
          onClick={goBack}
          style={{
            background: "#1976d2",
            color: "white",
            border: "none",
            padding: "11px 18px",
            borderRadius: "7px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          ← Back
        </button>
      </div>
    </div>

    {message && (
      <div
        style={{
          padding: "15px 20px",
          borderRadius: "8px",
          marginBottom: "20px",
          background:
            messageType === "success"
              ? "#e8f5e9"
              : "#ffebee",
          color:
            messageType === "success"
              ? "#2e7d32"
              : "#c62828",
          fontWeight: "bold"
        }}
      >
        {message}
      </div>
    )}

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(330px, 1fr))",
        gap: "20px"
      }}
    >
      {DATASETS.map(dataset => {
        const records =
          getRecordCount(dataset.key);

        const selectedFile =
          selectedFiles[dataset.key];

        const isUploading =
          uploading === dataset.key;

        const completed =
          records > 0;

        return (
          <div
            key={dataset.key}
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow:
                "0 3px 12px rgba(0,0,0,0.08)",
              border:
                completed
                  ? "2px solid #4caf50"
                  : "1px solid #e0e0e0"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center"
              }}
            >
              <div
                style={{
                  fontSize: "42px"
                }}
              >
                {dataset.icon}
              </div>

              {completed && (
                <div
                  style={{
                    background: "#e8f5e9",
                    color: "#2e7d32",
                    padding: "7px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}
                >
                  ✓ COMPLETED
                </div>
              )}
            </div>

            <h2>
              {dataset.title}
            </h2>

            <p
              style={{
                color: "#666",
                lineHeight: 1.5
              }}
            >
              {dataset.description}
            </p>

            <strong>
              Required Columns
            </strong>

            <div
              style={{
                background: "#f7f9fc",
                padding: "12px",
                borderRadius: "7px",
                marginTop: "10px",
                marginBottom: "15px"
              }}
            >
              {dataset.columns.map(
                column => (
                  <div key={column}>
                    ✓ {column}
                  </div>
                )
              )}
            </div>

            <div
              style={{
                background:
                  completed
                    ? "#e8f5e9"
                    : "#e3f2fd",
                color:
                  completed
                    ? "#2e7d32"
                    : "#1565c0",
                padding: "12px",
                borderRadius: "7px",
                marginBottom: "15px",
                fontWeight: "bold"
              }}
            >
              {completed
                ? `✓ Upload Completed (${records.toLocaleString("en-IN")} records)`
                : `Records Uploaded: ${
                    loading
                      ? "..."
                      : records.toLocaleString(
                          "en-IN"
                        )
                  }`
              }
            </div>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={event =>
                handleFileChange(
                  dataset.key,
                  event.target.files?.[0]
                )
              }
              style={{
                width: "100%",
                marginBottom: "12px"
              }}
            />

            {selectedFile && (
              <div
                style={{
                  fontSize: "13px",
                  color: "#555",
                  marginBottom: "12px"
                }}
              >
                Selected: {selectedFile.name}
              </div>
            )}

            <button
              onClick={() =>
                uploadDataset(
                  dataset.key
                )
              }
              disabled={
                !selectedFile ||
                isUploading
              }
              style={{
                width: "100%",
                background:
                  !selectedFile ||
                  isUploading
                    ? "#bdbdbd"
                    : "#1976d2",
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: "7px",
                cursor:
                  !selectedFile ||
                  isUploading
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "bold"
              }}
            >
              {isUploading
                ? "Uploading..."
                : completed
                  ? "Upload New Dataset"
                  : `Upload ${dataset.title}`
              }
            </button>
          </div>
        );
      })}
    </div>

    <div
      style={{
        background: "white",
        padding: "30px",
        borderRadius: "12px",
        marginTop: "25px",
        boxShadow:
          "0 3px 12px rgba(0,0,0,0.08)",
        border: "2px solid #4caf50"
      }}
    >
      <h2>
        🤖 Train Crop Production Model
      </h2>

      <p>
        Upload the Crop Production Dataset
        first. After successful upload,
        click the button below to train the
        machine learning model.
      </p>

      <div
        style={{
          background: "#f1f8e9",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}
      >
        <strong>
          Crop Production Records Available:
        </strong>
        {" "}
        {getRecordCount(
          "crop_production"
        ).toLocaleString("en-IN")}
      </div>

      <button
        onClick={trainCropModel}
        disabled={
          training ||
          getRecordCount(
            "crop_production"
          ) < 10
        }
        style={{
          background:
            training ||
            getRecordCount(
              "crop_production"
            ) < 10
              ? "#bdbdbd"
              : "#2e7d32",
          color: "white",
          border: "none",
          padding: "14px 25px",
          borderRadius: "7px",
          cursor:
            training
              ? "not-allowed"
              : "pointer",
          fontWeight: "bold",
          fontSize: "16px"
        }}
      >
        {training
          ? "🤖 Training Model..."
          : "🤖 Train Crop Production Model"
        }
      </button>

      {getRecordCount(
        "crop_production"
      ) < 10 && (
        <p
          style={{
            color: "#c62828",
            marginTop: "15px"
          }}
        >
          At least 10 crop production
          records are required for training.
        </p>
      )}

      {trainingResult && (
        <div
          style={{
            marginTop: "25px",
            padding: "20px",
            background: "#e8f5e9",
            borderRadius: "8px",
            border:
              "1px solid #4caf50"
          }}
        >
          <h3>
            ✓ Model Training Completed
          </h3>

          <p>
            <strong>
              Records Used:
            </strong>
            {" "}
            {trainingResult.records_used}
          </p>

          <p>
            <strong>
              Model:
            </strong>
            {" "}
            {trainingResult.model}
          </p>

          <p>
            <strong>
              Mean Absolute Error:
            </strong>
            {" "}
            {trainingResult.mean_absolute_error}
          </p>

          <p>
            <strong>
              R² Score:
            </strong>
            {" "}
            {trainingResult.r2_score}
          </p>
        </div>
      )}
    </div>
  </div>
</div>

);
}

export default AdminDatasetManagement;