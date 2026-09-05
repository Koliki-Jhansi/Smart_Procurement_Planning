import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
});

// Automatically attach admin mobile number
api.interceptors.request.use(
  (config) => {
    const savedUser = localStorage.getItem(
      "smart_procurement_user"
    );

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);

        if (user?.mobile_number) {
          config.headers["X-Admin-Mobile"] =
            user.mobile_number;
        }

      } catch (error) {
        console.error(
          "Error reading logged-in user:",
          error
        );
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;