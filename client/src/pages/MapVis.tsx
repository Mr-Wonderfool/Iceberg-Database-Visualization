import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Flex,
  Spinner,
  Text,
  useToast,
  VStack,
  Heading,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { LatLngExpression, Map as LeafletMapInstance } from "leaflet";
import { useLocation } from "react-router-dom";
import { FaMapMarkedAlt, FaTimesCircle, FaBroom } from "react-icons/fa";
import SideBar, { openWidth, closeWidth } from "../components/SideBar";
import MapDisplay from "../components/MapDisplay";
import { IcebergData } from "../types/iceberg";
import { getIcebergById, getIcebergByLocationBounds } from "../services/api";
import { LocationState } from "../types/types";
import { HeatmapPoint } from "../types/iceberg";

const MapVis = () => {
  const [displayedIcebergs, setDisplayedIcebergs] = useState<IcebergData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([-65, -50]);
  const [mapZoom, setMapZoom] = useState<number>(3); // Start more zoomed out
  const [pageError, setPageError] = useState<string | null>(null);

  const [isSingleIcebergView, setIsSingleIcebergView] =
    useState<boolean>(true);
  const [focusedIcebergId, setFocusedIcebergId] = useState<string | null>(null);

  const toast = useToast();
  const location = useLocation();

  // user-related info for sidebar display
  const userName = location.state.user_name;
  const isSuperUser = (location.state as LocationState)?.is_superuser;
  // sidebar display
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mapRef = useRef<LeafletMapInstance | null>(null);

  // Function to reset view to heatmap mode (or initial state)
  const switchToHeatmapMode = useCallback(() => {
    setIsSingleIcebergView(false);
    setFocusedIcebergId(null);
    setDisplayedIcebergs([]); // Clear individual trajectories
    // setHeatmapData(null); // Optionally clear heatmap when switching modes, or let user clear it
    setMapCenter([-65, -50]);
    setMapZoom(3);
    setPageError(null);
  }, []);

  const focusOnIceberg = useCallback(
    (iceberg: IcebergData) => {
      setHeatmapData(null); // Clear heatmap when focusing on an iceberg
      const currTrajLen = iceberg.trajectory.length;
      if (currTrajLen > 0) {
        const currPoint = iceberg.trajectory[currTrajLen - 1];
        setMapCenter([currPoint.latitude, currPoint.longitude]);
        setMapZoom(7);
      } else {
        toast({
          title: "No Trajectory Data",
          description: `Iceberg ${iceberg.id} has no trajectory points to display.`,
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        setMapCenter([-65, -50]);
        setMapZoom(5);
      }
      setDisplayedIcebergs([iceberg]);
      setIsSingleIcebergView(true);
      setFocusedIcebergId(iceberg.id);
    },
    [toast]
  );

  useEffect(() => {
    const locationState = location.state as LocationState | null;
    const idFromState = locationState?.iceberg_id;

    // if not single iceberg view, change to heatmap mode
    if (idFromState && isSingleIcebergView) {
      if (idFromState === focusedIcebergId) {
        return;
      }

      setIsLoading(true);
      setPageError(null);
      getIcebergById(idFromState)
        .then((response) => {
          focusOnIceberg(response.data);
        })
        .catch((error) => {
          console.error(`Error fetching iceberg ${idFromState}:`, error);
          const errorMsg =
            error.response?.data?.error ||
            error.message ||
            `Failed to load iceberg ${idFromState}.`;
          toast({
            title: "Error Loading Iceberg",
            description: errorMsg,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setPageError(errorMsg);
          switchToHeatmapMode();
        })
        .finally(() => setIsLoading(false));
    } else {
      if (isSingleIcebergView) {
        switchToHeatmapMode();
      }
    }
  }, [
    location.state,
    focusOnIceberg,
    switchToHeatmapMode,
    focusedIcebergId,
    isSingleIcebergView,
    toast,
  ]);

  const handleGenerateHeatmap = async () => {
    if (!mapRef.current) {
      toast({
        title: "Map not ready",
        description: "Please wait for the map to load.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setIsLoading(true);
    setPageError(null);
    // Ensure not in single iceberg view when generating heatmap
    if (isSingleIcebergView) {
      switchToHeatmapMode();
    }
    setDisplayedIcebergs([]); // Clear any individual trajectories

    try {
      const bounds = mapRef.current.getBounds();
      const response = await getIcebergByLocationBounds(bounds);
      setHeatmapData(response.data);
      if (response.data.length === 0) {
        toast({
          title: "No Data for Heatmap",
          description:
            "No iceberg locations found in the current map view for the last 3 months.",
          status: "info",
          duration: 4000,
        });
      } else {
        toast({
          title: "Heatmap Generated",
          description: `${response.data.length} data points shown.`,
          status: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      const errorMsg =
        (error as Error).message || "Failed to generate heatmap.";
      toast({
        title: "Heatmap Error",
        description: errorMsg,
        status: "error",
        duration: 5000,
      });
      setHeatmapData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    // Clears both heatmap and single iceberg view
    switchToHeatmapMode();
    setHeatmapData(null); // Explicitly clear heatmap
    setDisplayedIcebergs([]); // Clear any individual trajectories
    toast({
      title: "Map Cleared",
      description: "Display reset.",
      status: "info",
      duration: 2000,
    });
  };

  return (
    <Flex height="100vh" width="100vw" overflow="hidden">
      <SideBar
        username={userName}
        is_superuser={isSuperUser}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={() => setSidebarOpen(false)}
      />

      <Flex
        direction="column"
        flexGrow={1}
        height="100vh"
        width="100%"
        ml={sidebarOpen ? openWidth : closeWidth}
        transition="margin-left 0.3s ease-in-out"
        overflowX="hidden"
        position="relative"
      >
        <Box
          p={4}
          flexShrink={0}
          bg="gray.50"
          _dark={{ bg: "gray.700" }}
          shadow="sm"
        >
          <VStack spacing={3} align="stretch">
            <Heading
              size="medium"
              textAlign="center"
              color="teal.500"
              _dark={{ color: "teal.300" }}
            >
              Iceberg Map Visualization
            </Heading>
            {!isSingleIcebergView && (
              <Button
                onClick={handleGenerateHeatmap}
                colorScheme="blue"
                isLoading={isLoading && !isSingleIcebergView} // Only show loading for heatmap generation
                leftIcon={<FaMapMarkedAlt />}
              >
                Generate Heatmap for Current View
              </Button>
            )}
            {heatmapData && heatmapData.length > 0 && !isSingleIcebergView && (
              <Button
                onClick={handleClearData}
                variant="outline"
                colorScheme="orange"
                size="sm"
                leftIcon={<FaBroom />}
              >
                Clear Heatmap
              </Button>
            )}
          </VStack>
        </Box>

        {pageError && (
          <Flex justify="center" p={2} bg="red.100">
            <Text color="red.600" fontSize="sm">
              {pageError}
            </Text>
          </Flex>
        )}

        <Box flexGrow={1} position="relative" m={0} p={0}>
          {" "}
          {/* Map container takes full remaining space */}
          {isLoading && (
            <Spinner
              size="xl"
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              zIndex="20"
            />
          )}
          <MapDisplay
            icebergs={displayedIcebergs}
            mapCenter={mapCenter}
            zoomLevel={mapZoom}
            heatmapData={heatmapData}
            onMapReady={(mapInstance) => {
              mapRef.current = mapInstance;
            }}
          />
          {/* Button to clear single iceberg view */}
          {isSingleIcebergView && (
            <IconButton
              aria-label="Clear focused iceberg"
              icon={<FaTimesCircle />}
              onClick={handleClearData}
              colorScheme="red"
              size="lg"
              isRound
              position="absolute"
              bottom="2rem"
              right="2rem"
              zIndex="1000"
              boxShadow="lg"
            />
          )}
        </Box>
      </Flex>
    </Flex>
  );
};

export default MapVis;
