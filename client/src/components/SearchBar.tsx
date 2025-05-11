import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { SearchCriteria } from "../types/iceberg";

interface SearchBarProps {
  onSearch: (criteria: SearchCriteria) => void;
  isLoading: boolean;
}

const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
  const [minLon, setMinLon] = useState<string>("");
  const [maxLon, setMaxLon] = useState<string>("");
  const [minLat, setMinLat] = useState<string>("");
  const [maxLat, setMaxLat] = useState<string>("");
  const [minArea, setMinArea] = useState<string>("");
  const [maxArea, setMaxArea] = useState<string>("");
  const toast = useToast();

  const handleSearchClick = () => {
    if (
      (minLon && isNaN(parseFloat(minLon))) ||
      (maxLon && isNaN(parseFloat(maxLon))) ||
      (minLat && isNaN(parseFloat(minLat))) ||
      (maxLat && isNaN(parseFloat(maxLat)))
    ) {
      toast({
        title: "Invalid coordinates.",
        description: "Longitude/Latitude must be numbers.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (
      (minArea && isNaN(parseFloat(minArea))) ||
      (maxArea && isNaN(parseFloat(maxArea)))
    ) {
      toast({
        title: "Invalid area.",
        description: "Area must be a number.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const criteria: SearchCriteria = {
      minLon: minLon ? parseFloat(minLon) : undefined,
      maxLon: maxLon ? parseFloat(maxLon) : undefined,
      minLat: minLat ? parseFloat(minLat) : undefined,
      maxLat: maxLat ? parseFloat(maxLat) : undefined,
      minArea: minArea ? parseFloat(minArea) : undefined,
      maxArea: maxArea ? parseFloat(maxArea) : undefined,
    };
    onSearch(criteria);
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" shadow="md" bg="white">
      <Heading size="md" mb={4}>
        Search Icebergs
      </Heading>
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
        gap={4}
        alignItems="flex-end"
      >
        <GridItem>
          <FormControl>
            <FormLabel fontSize="sm">Longitude Range (°)</FormLabel>
            <Grid templateColumns="repeat(2, 1fr)" gap={2}>
              <NumberInput
                size="sm"
                value={minLon}
                onChange={(valueString) => setMinLon(valueString)}
              >
                <NumberInputField placeholder="Min Longitude" />
              </NumberInput>
              <NumberInput
                size="sm"
                value={maxLon}
                onChange={(valueString) => setMaxLon(valueString)}
              >
                <NumberInputField placeholder="Max Longitude" />
              </NumberInput>
            </Grid>
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl>
            <FormLabel fontSize="sm">Latitude Range (°)</FormLabel>
            <Grid templateColumns="repeat(2, 1fr)" gap={2}>
              <NumberInput
                size="sm"
                value={minLat}
                onChange={(valueString) => setMinLat(valueString)}
              >
                <NumberInputField placeholder="Min Latitude" />
              </NumberInput>
              <NumberInput
                size="sm"
                value={maxLat}
                onChange={(valueString) => setMaxLat(valueString)}
              >
                <NumberInputField placeholder="Max Latitude" />
              </NumberInput>
            </Grid>
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl>
            <FormLabel fontSize="sm">Area Range (km²)</FormLabel>
            <Grid templateColumns="repeat(2, 1fr)" gap={2}>
              <NumberInput
                size="sm"
                value={minArea}
                onChange={(valueString) => setMinArea(valueString)}
                min={0}
              >
                <NumberInputField placeholder="Min Area" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <NumberInput
                size="sm"
                value={maxArea}
                onChange={(valueString) => setMaxArea(valueString)}
                min={0}
              >
                <NumberInputField placeholder="Max Area" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Grid>
          </FormControl>
        </GridItem>

        <GridItem colSpan={{ base: 1, md: 3 }}>
          <Button
            colorScheme="teal"
            onClick={handleSearchClick}
            isLoading={isLoading}
            loadingText="Searching..."
            width="full"
            mt={2}
          >
            Search
          </Button>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default SearchBar;
