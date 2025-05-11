import { IcebergInfo } from "../types/types";
import {
  Box,
  Button,
  Flex,
  Icon,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FaRegClock, FaMapMarkerAlt } from "react-icons/fa";

interface IcebergInfoProps {
  icebergs: IcebergInfo[];
  handleCardClick: (iceberg_id: string) => void;
}
// display set of icebergs
const IcebergInfoTable = ({ icebergs, handleCardClick }: IcebergInfoProps) => {
  const displayDirection = useBreakpointValue<"row" | "column">({
    base: "column",
    md: "row",
  });
  return icebergs.map((iceberg) => (
    <Box
      key={iceberg.iceberg_id + iceberg.recent_observation}
      mb={4}
      p={5}
      borderRadius="md"
      shadow="lg"
      cursor="pointer"
      _hover={{
        shadow: "xl",
        transform: "scale(1.02)",
        transition: "all 0.2s",
      }}
      onClick={() => handleCardClick(iceberg.iceberg_id)}
    >
      <Flex align="center" mb={3} justify="space-between">
        <Flex align="center" direction="row">
          <Text fontSize="xl" fontWeight="bold" mr={2} mt={3}>
            {iceberg.iceberg_id}
          </Text>
          <Icon as={FaRegClock} color="gray.500" />
        </Flex>
        <Text fontSize="sm" color="gray.600">
          {iceberg.recent_observation}
        </Text>
      </Flex>
      <Flex mb={3} direction={displayDirection}>
        <Flex align="center" mr={6}>
          <Icon as={FaMapMarkerAlt} color="blue.500" mr={2} />
          <Text fontSize="md" color="gray.700" mt={3}>
            Longitude: {iceberg.dms_longitude}
          </Text>
        </Flex>
        <Flex align="center">
          <Icon as={FaMapMarkerAlt} color="blue.500" mr={2} />
          <Text fontSize="md" color="gray.700" mt={3}>
            Latitude: {iceberg.dms_latitude}
          </Text>
        </Flex>
      </Flex>
      <Button colorScheme="blue" size="sm" onClick={() => handleCardClick(iceberg.iceberg_id)}>
        View Details
      </Button>
    </Box>
  ));
};

export default IcebergInfoTable;
