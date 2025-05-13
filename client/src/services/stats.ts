import axios from "axios";

const BACKEND_URL = "http://localhost:8080/stats";

export const getSizeDistribution = async () => {
  return axios.get(`${BACKEND_URL}/size_distribution`);
};

export const getActiveIcebergCountOverTime = async () => {
  return axios.get(`${BACKEND_URL}/active_count_over_time`);
};

export const getIcebergCorrelationData = async () => {
  return axios.get(`${BACKEND_URL}/correlation_data`);
};

export const getIcebergBirthDeathData = async () => {
  return axios.get(`${BACKEND_URL}/birth_death_locations`);
};

export const getIcebergTimeSeriesData = async (iceberg_id: string) => {
  return axios.get(`${BACKEND_URL}/iceberg/${iceberg_id}/timeseries`);
}