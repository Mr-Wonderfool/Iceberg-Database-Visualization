import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L, { LatLngExpression, Map } from "leaflet";
import "leaflet.heat";
import { IcebergData, HeatmapPoint } from "../types/iceberg";

interface MapDisplayProps {
  icebergs: IcebergData[];
  mapCenter?: LatLngExpression;
  zoomLevel?: number;
  heatmapData?: HeatmapPoint[] | null;
  onMapReady?: (map: Map) => void; // Callback to pass map instance to parent
  onViewChange?: (bounds: L.LatLngBounds, zoom: number) => void;
}

const HeatmapLegend = () => {
  const gradient = {
    0.6: "rgba(255, 81, 89, 0.85)",
    0.8: "rgba(255, 0, 0, 0.9)",
    1.0: "rgba(200, 0, 0, 1.0)",
  };

  // Create a linear gradient string for CSS background
  const gradientStops = Object.entries(gradient)
    .map(([stop, color]) => ({ stop: parseFloat(stop), color }))
    .sort((a, b) => a.stop - b.stop)
    .map((item) => `${item.color} ${item.stop * 100}%`)
    .join(", ");
  const legendBackground = `linear-gradient(to top, ${gradientStops})`;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "40px",
        right: "10px",
        padding: "10px",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderRadius: "5px",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        zIndex: 1000, // Ensure it's above the map
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
      }}
    >
      <span>High</span>
      <div
        style={{
          width: "20px",
          height: "150px", // Height of the color bar
          background: legendBackground,
          marginBottom: "5px",
          border: "1px solid #ccc",
        }}
      />
      <span>Low</span>
      <div style={{ marginTop: "5px", fontWeight: "bold" }}>Density</div>
    </div>
  );
};

const HeatmapLayerComponent: React.FC<{ heatmapData: HeatmapPoint[] }> = ({
  heatmapData,
}) => {
  const map = useMap();
  // heat layer instance
  const heatLayerRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    if (!heatmapData || heatmapData.length === 0) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }
    const typedHeatmapData: L.HeatLatLngTuple[] = heatmapData.map((p) => [
      p[0],
      p[1],
      p[2],
    ]);

    if (heatLayerRef.current) {
      // If layer exists, update its data
      heatLayerRef.current.setLatLngs(typedHeatmapData);
      // explicitly re-render
      heatLayerRef.current.redraw();
    } else {
      // Create new heatmap layer
      heatLayerRef.current = L.heatLayer(typedHeatmapData, {
        radius: 25,
        blur: 5,
        maxZoom: 18,
        max: 1.0,
        gradient: {
          0.6: "rgba(255, 81, 89, 0.85)",
          0.8: "rgba(255, 0, 0, 0.9)",
          1.0: "rgba(200, 0, 0, 1.0)",
        },
      }).addTo(map);
    }

    // Cleanup function to remove layer when component unmounts
    return () => {
      if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, heatmapData]);

  // only meant to create a map layer, should not render JSX
  return null;
};

// Component to listen to map move/zoom events
const MapEvents: React.FC<{
  onViewChange?: (bounds: L.LatLngBounds, zoom: number) => void;
}> = ({ onViewChange }) => {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      if (onViewChange) {
        onViewChange(map.getBounds(), map.getZoom());
      }
    };
    map.on("moveend", handler);
    map.on("zoomend", handler);
    return () => {
      map.off("moveend", handler);
      map.off("zoomend", handler);
    };
  }, [map, onViewChange]);
  return null;
};

const MapDisplay = ({
  icebergs,
  mapCenter = [-65, -50],
  zoomLevel = 4,
  heatmapData = null,
  onMapReady,
  onViewChange,
}: MapDisplayProps) => {
  const [mapInstance, setMapInstance] = useState<Map | null>(null);

  const mapRef = useCallback(
    (node: Map | null) => {
      if (node !== null) {
        setMapInstance(node);
        if (onMapReady) {
          onMapReady(node);
        }
        // Initial view report
        if (onViewChange) {
          onViewChange(node.getBounds(), node.getZoom());
        }
      }
    },
    [onMapReady, onViewChange]
  );

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onViewChange={onViewChange} />
        {/* Render trajectories if not showing heatmap or if they should coexist */}
        {(!heatmapData || heatmapData.length === 0) &&
          icebergs.map((iceberg) => {
            const currLen = iceberg.trajectory.length;
            if (currLen === 0) return null;
            const positions: LatLngExpression[] = iceberg.trajectory.map(
              (p) => [p.latitude, p.longitude]
            );
            const currPoint = iceberg.trajectory[currLen - 1];
            return (
              <React.Fragment key={iceberg.id}>
                <Polyline
                  pathOptions={{ color: "blue", weight: 5 }} // Kept your styling
                  positions={positions}
                />
                {currPoint && (
                  <Marker position={[currPoint.latitude, currPoint.longitude]}>
                    <Popup>
                      <b>Iceberg ID: {iceberg.id}</b> <br />
                      Area: {iceberg.area?.toFixed(2)} km² <br />
                      Latest Latitude: {currPoint.latitude.toFixed(2)} <br />
                      Latest Longitude: {currPoint.longitude.toFixed(2)} <br />
                      Time: {new Date(currPoint.record_time).toLocaleString()}
                    </Popup>
                  </Marker>
                )}
              </React.Fragment>
            );
          })}
        {mapInstance && heatmapData && heatmapData.length > 0 && (
          <HeatmapLayerComponent heatmapData={heatmapData} />
        )}
      </MapContainer>
      {heatmapData && heatmapData.length > 0 && <HeatmapLegend />}
    </div>
  );
};

export default MapDisplay;
