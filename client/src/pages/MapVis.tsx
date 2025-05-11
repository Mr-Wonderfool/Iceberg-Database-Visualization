import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Spinner,
  Text,
  useToast,
  VStack,
  Heading,
  Button,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react";
import { LatLngExpression } from "leaflet";

import MapDisplay from "../components/MapDisplay";
import CriteriaSearchBar from "../components/SearchBar";
import { IcebergData, SearchCriteria } from "../types/iceberg";
import { searchIcebergsByCriteria, getIcebergById } from "../services/api";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/SideBar";
import { FaTimes } from "react-icons/fa";
import { FaBars } from "react-icons/fa6";

interface LocationState {
  iceberg_id?: string;
  user_name?: string;
  is_superuser?: boolean;
}

const SIDEBAR_WIDTH = "220px";

const MapVis = () => {
  const [displayedIcebergs, setDisplayedIcebergs] = useState<IcebergData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Default map view at North Atlantic
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([-65, -50]);
  const [mapZoom, setMapZoom] = useState<number>(4);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isSingleIcebergView, setIsSingleIcebergView] =
    useState<boolean>(false);
  const [focusedIcebergId, setFocusedIcebergId] = useState<string | null>(null);

  const toast = useToast();
  const location = useLocation();

  // user-related info for sidebar display
  const userName = (location.state as LocationState)?.user_name;
  const isSuperUser = (location.state as LocationState)?.is_superuser;
  // sidebar display
  const {
    isOpen: isSidebarOpen,
    onToggle: toggleSidebar,
    onClose: closeSidebarOnNavigate,
  } = useDisclosure({ defaultIsOpen: true });

  const switchToSearchMode = useCallback(() => {
    // switch to using search on map page (instead of waiting for id in the Home page)
    setIsSingleIcebergView(false);
    setFocusedIcebergId(null);
    setDisplayedIcebergs([]);
    setMapCenter([-65, -50]);
    setMapZoom(4);
    setPageError(null);
  }, []);

  const focusOnIceberg = useCallback(
    (iceberg: IcebergData) => {
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
        // Default map view if no trajectory
        setMapCenter([60, -50]);
        setMapZoom(5);
      }
      setDisplayedIcebergs([iceberg]);
      setIsSingleIcebergView(true);
      setFocusedIcebergId(iceberg.id);
    },
    [toast]
  );

  // Effect to load a single iceberg when passing id via location.state from Home
  useEffect(() => {
    const locationState = location.state as LocationState | null;
    const idFromState = locationState?.iceberg_id;

    if (idFromState) {
      // Prevent re-fetching if already focused on this ID from state
      // and not initiated by a new criteria search
      if (idFromState === focusedIcebergId && isSingleIcebergView) {
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
          switchToSearchMode(); // Revert to search mode on error
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // if directly navigated to "map"
      if (isSingleIcebergView) {
        switchToSearchMode();
      }
    }
  }, [
    location.state,
    focusOnIceberg,
    toast,
    switchToSearchMode,
    focusedIcebergId,
    isSingleIcebergView,
  ]);

  const handleCriteriaSearch = async (criteria: SearchCriteria) => {
    setIsLoading(true);
    setPageError(null);
    switchToSearchMode();

    try {
      const response = await searchIcebergsByCriteria(criteria);
      const data = response.data;
      setDisplayedIcebergs(data);

      if (data.length > 0 && data[0].trajectory.length > 0) {
        setMapCenter([60, -50]); // Or pan to first result: [data[0].trajectory[0].latitude, data[0].trajectory[0].longitude]
        setMapZoom(4); // Or 5 if panning to first result
      } else if (data.length === 0) {
        toast({
          title: "No Icebergs Found",
          description: "Try different search criteria.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        setMapCenter([60, -50]);
        setMapZoom(4);
      }
    } catch (error) {
      console.error("Error searching icebergs by criteria:", error);
      const errorMsg = (error as Error).message || "Search failed.";
      toast({
        title: "Search Failed",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setDisplayedIcebergs([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex height="100vh" width="100vw" overflow="hidden">
      {/* Sidebar: Conditionally rendered or styled based on isSidebarOpen */}
      <Box
        as="aside"
        width={isSidebarOpen ? SIDEBAR_WIDTH : "0"}
        bg="gray.800"
        color="white"
        transition="width 0.3s ease-in-out"
        overflow="hidden"
        height="100vh"
        position="fixed"
        left="0"
        top="0"
        zIndex="100"
      >
        {isSidebarOpen && (
          <Sidebar
            username={userName}
            is_superuser={isSuperUser}
            onNavigate={closeSidebarOnNavigate}
          />
        )}
      </Box>

      {/* Main content area */}
      <Flex
        direction="column"
        flexGrow={1}
        height="100vh"
        width="100%"
        ml={isSidebarOpen ? SIDEBAR_WIDTH : "0"}
        transition="margin-left 0.3s ease-in-out"
        overflowX="hidden"
        position="relative"
      >
        {/* Sidebar Toggle Button */}
        <IconButton
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          icon={isSidebarOpen ? <FaTimes /> : <FaBars />}
          onClick={toggleSidebar}
          position="absolute"
          top="1rem"
          // Place it relative to the main content area, considering sidebar width
          left={isSidebarOpen ? `calc(${SIDEBAR_WIDTH} + 1rem)` : "1rem"}
          zIndex="105" // Above sidebar content, below modals
          bg="teal.500"
          color="white"
          _hover={{ bg: "teal.600" }}
          transition="left 0.3s ease-in-out" // Smooth transition for button position
        />

        <Box
          p={4}
          mt="60px"
          /* Add margin top to avoid overlap with fixed toggle button */ flexShrink={
            0
          }
        >
          {!isSingleIcebergView ? (
            <CriteriaSearchBar
              onSearch={handleCriteriaSearch}
              isLoading={isLoading}
            />
          ) : (
            <VStack spacing={3} align="stretch">
              <Heading size="md" textAlign="center">
                Displaying Trajectory for Iceberg: {focusedIcebergId}
              </Heading>
              <Button
                onClick={switchToSearchMode}
                colorScheme="teal"
                variant="outline"
                size="sm"
                alignSelf="center"
              >
                Clear Selection & Search Again
              </Button>
            </VStack>
          )}
        </Box>

        {pageError && (
          <Flex justify="center" p={4}>
            <Text color="red.500" fontSize="lg">
              {pageError}
            </Text>
          </Flex>
        )}

        <Box
          flexGrow={1}
          position="relative"
          mx={4}
          mb={4} /* Add some margins for map box */
        >
          {isLoading && (
            <Flex
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              alignItems="center"
              justifyContent="center"
              bg="rgba(255,255,255,0.8)"
              zIndex="10" // Lower zIndex than sidebar toggle
            >
              <Spinner
                size="xl"
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
              />
              <Text ml={3} fontSize="lg">
                Loading Map Data...
              </Text>
            </Flex>
          )}
          <MapDisplay
            icebergs={displayedIcebergs}
            mapCenter={mapCenter}
            zoomLevel={mapZoom}
          />
        </Box>
      </Flex>
    </Flex>
  );
};

export default MapVis;
