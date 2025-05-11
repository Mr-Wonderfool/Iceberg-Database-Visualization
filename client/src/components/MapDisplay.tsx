import { LatLngExpression } from "leaflet";
import { IcebergData } from "../types/iceberg";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";

interface MapDisplayProps {
  icebergs: IcebergData[];
  mapCenter?: LatLngExpression;
  zoomLevel?: number;
}

const MapDisplay = ({
  icebergs,
  mapCenter = [60, -50],
  zoomLevel = 4,
}: MapDisplayProps) => {
  return (
    <MapContainer
      center={mapCenter}
      zoom={zoomLevel}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {icebergs.map((iceberg) => {
        const currTrajLen = iceberg.trajectory.length;
        if (currTrajLen === 0) {
          return null;
        }
        const positions: LatLngExpression[] = iceberg.trajectory.map((p) => [
          p.latitude,
          p.longitude,
        ]);
        const currentPoint = iceberg.trajectory[currTrajLen - 1];

        return (
          <>
            <Polyline
              pathOptions={{ color: "blue", weight: 5 }}
              positions={positions}
            />
            {currentPoint && (
              <Marker
                position={[currentPoint.latitude, currentPoint.longitude]}
                key={iceberg.id}
              >
                <Popup>
                  Iceberg ID: {iceberg.id} <br />
                  Area: {iceberg.area.toFixed(2)} km² <br />
                  Latest Latitude: {currentPoint.latitude.toFixed(2)} <br />
                  Latest Longitude: {currentPoint.longitude.toFixed(2)} <br />
                  Observed at: {currentPoint.record_time} <br />
                </Popup>
              </Marker>
            )}
          </>
        );
      })}
    </MapContainer>
  );
};

export default MapDisplay;
