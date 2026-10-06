// Centralized API configuration for Smart Procurement Planning
// In development, defaults to http://localhost:5001
// In production, set VITE_API_URL in environment (e.g., https://smart-procurement-planning.onrender.com)

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");

export const API_URL = `${API_BASE_URL}/api`;
export { API_BASE_URL };
export default API_BASE_URL;

