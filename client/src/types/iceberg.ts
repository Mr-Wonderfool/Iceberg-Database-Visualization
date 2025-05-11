// point in iceberg trajectory, with dms latitude and longitude
export type TrajectoryPoint = {
  latitude: number;
  longitude: number;
  record_time: string;
  is_prediction: boolean;
};

export type IcebergData = {
  id: string;
  area: number;
  mask?: string;
  trajectory: TrajectoryPoint[];
};

// criteria for searching icebergs
export type SearchCriteria = {
  minLon?: number;
  maxLon?: number;
  minLat?: number;
  maxLat?: number;
  minArea?: number;
  maxArea?: number;
};
