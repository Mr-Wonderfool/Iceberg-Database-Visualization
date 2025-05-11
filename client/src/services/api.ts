import axios from "axios";
import { SearchCriteria } from "../types/iceberg";

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
  return axios.get(`${BACKEND_URL}/iceberg/${icebergId}`)
}