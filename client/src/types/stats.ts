// data point for size distribution
export type SizeDistributionDataPoint = {
  name: string; // Bin label (size)
  value: number; // Count of icebergs in this bin
};

// data points for active counts over time
export type TimeSeriesDataPoint = {
  time: string; // YYYY-MM"
  value: number; // Count for that time period
};

export type CorrelationDataPoint = {
  id: string;
  area: number;
  rotationalVelocity: number | null;
};

export type BirthDeathLocationPoint = {
  id: string;
  type: "birth" | "death";
  longitude: number;
  latitude: number;
  name?: string;
  record_time: string;
};

export type IcebergTimeSeriesPoint = {
  record_time: string; // ISO Date string
  rotational_velocity: number | null;
  area: number | null; // Area at this specific time, if available
};

export type SizeDistributionOverTimeData = {
  time_periods: string[];
  bin_labels: string[];
  series_data: Array<{
    name: string;
    type: "bar";
    stack: string;
    data: number[];
  }>;
};
