import axios from "axios";
import { SearchCriteria } from "../types/iceberg";
import { LatLngBounds } from "leaflet";

const BACKEND_URL = "http://localhost:8080/iceberg_api";

// fetch icebergs base on search criteria
export const searchIcebergsByCriteria = async (criteria: SearchCriteria) => {
  // filter out unused criteria
  const validCriteria = Object.fromEntries(
    Object.entries(criteria).filter(
      (entry) => entry[1] !== undefined && entry[1] !== null
    )
  );
  return axios.get(`${BACKEND_URL}/search_icebergs`, {
    params: validCriteria,
  });
};

export const getIcebergById = async (icebergId: string) => {
  return axios.get(`${BACKEND_URL}/iceberg/${icebergId}`);
};

export const getIcebergByLocationBounds = async (bounds: LatLngBounds) => {
  if (!bounds) {
    return Promise.reject(new Error("Bounds should not be empty."));
  }
  return axios.get(`${BACKEND_URL}/iceberg/locations_in_bounds`, {
    params: {
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLon: bounds.getWest(),
      maxLon: bounds.getEast(),
    },
  });
};
