import { useEffect, useState } from "react";
import { IcebergDetails } from "../types/types";
import axios from "axios";
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Input,
  Text,
  useColorModeValue,
  VStack,
  Grid,
  GridItem,
  Heading,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tag,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Avatar,
} from "@chakra-ui/react";
import SideBar, { closeWidth, openWidth } from "../components/SideBar";
import {
  FaCommentAlt,
  FaMapMarkerAlt,
  FaRegAddressCard,
  FaTrash,
} from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { IcebergTimeSeriesPoint } from "../types/stats";
import { getIcebergTimeSeriesData } from "../services/stats";
import EChartWrapper, { ECOption } from "../components/charts/EChartWrapper";

const IcebergDetail = () => {
  const BACKEND_URL = "http://localhost:8080";
  const location = useLocation();
  const { iceberg_id, user_name, is_superuser, is_logged_in } =
    location.state || {};
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [icebergDetails, setIcebergDetails] = useState<IcebergDetails>({
    area: 0.0,
    mask: "NO_DATA",
    comments: [],
    newComment: "",
    trajectoryImage: "",
  });

  // for trajectory visualization
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeSeriesData, setTimeSeriesData] = useState<
    IcebergTimeSeriesPoint[]
  >([]);

  const chartBackgroundColor = useColorModeValue(
    "rgba(255,255,255,0.8)",
    "rgba(26,32,44,0.8)"
  );
  const textColor = useColorModeValue("#333", "#ccc");
  const axisLineColor = useColorModeValue("#666", "#777");
  const renderBackground = useColorModeValue("white", "gray.700");
  const commentColor = new Array([
    useColorModeValue("gray.50", "gray.600"),
    useColorModeValue("gray.500", "gray.300"),
    useColorModeValue("gray.700", "gray.100"),
    useColorModeValue("gray.500", "gray.400"),
  ]);

  useEffect(() => {
    // loading detail visualization
    if (!iceberg_id) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await getIcebergTimeSeriesData(iceberg_id);
        setTimeSeriesData(response.data.time_series);
      } catch (err) {
        console.error(`Error fetching data for iceberg ${iceberg_id}: ${err}`);
        setTimeSeriesData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    axios
      .get(`${BACKEND_URL}/iceberg_info/basic/${iceberg_id}`)
      .then((response) => {
        const { area, mask } = response.data;
        setIcebergDetails((prevData) => ({
          ...prevData,
          area: area,
          mask: mask,
        }));
      })
      .catch((error) => console.error("Error fetching data:", error));
    // fetching existing comments
    axios
      .get(`${BACKEND_URL}/iceberg_comments/${iceberg_id}`)
      .then((response) => {
        setIcebergDetails((prevData) => ({
          ...prevData,
          comments: response.data,
        }));
      })
      .catch((error) => console.error(`Error fetching comments: ${error}`));
  }, [iceberg_id]);

  const handleCommentSubmit = () => {
    const curr_time = new Date();
    axios
      .post(`${BACKEND_URL}/iceberg/comments`, {
        iceberg_id: iceberg_id,
        suggestion: icebergDetails.newComment,
        user_name: user_name,
        suggestion_time: curr_time.toISOString(),
      })
      .then((response) => {
        setIcebergDetails((prevData) => ({
          ...prevData,
          comments: [
            ...icebergDetails.comments,
            {
              comment_id: response.data.comment_id,
              suggestion: icebergDetails.newComment,
              user_name: user_name,
              suggestion_time: curr_time.toISOString(),
            },
          ],
          newComment: "",
        }));
      })
      .catch((error) => console.error("Error submitting comment:", error));
  };

  const handleCommentDeletion = (comment_id: number) => {
    axios
      .delete(`${BACKEND_URL}/iceberg/comments/${comment_id}`)
      .then(() => {
        setIcebergDetails((prevData) => ({
          ...prevData,
          comments: prevData.comments.filter(
            (comment) => comment.comment_id !== comment_id
          ),
        }));
      })
      .catch((error) => {
        console.error("Error deleting comment: ", error);
      });
  };

  const setNewComment = (newComment: string) => {
    setIcebergDetails((prevData) => ({
      ...prevData,
      newComment: newComment,
    }));
  };

  // * rotational velocity
  const rotationalVelocityOption: ECOption = {
    backgroundColor: chartBackgroundColor,
    title: {
      text: `Rotational Velocity`,
      subtext: `Iceberg ${iceberg_id}`,
      left: "center",
      textStyle: { color: textColor },
      subtextStyle: { color: textColor },
    },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) =>
        value !== null ? (value as number).toFixed(2) + " deg/hr" : "N/A",
    },
    xAxis: {
      type: "time",
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: axisLineColor } },
    },
    yAxis: {
      type: "value",
      name: "deg/hr",
      scale: true,
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: axisLineColor } },
      splitLine: { lineStyle: { color: useColorModeValue("#eee", "#444") } },
    },
    series: [
      {
        name: "Rot. Vel.",
        type: "line",
        data: timeSeriesData.map((d) => [d.record_time, d.rotational_velocity]),
        smooth: true,
        showSymbol: false,
        connectNulls: true,
      },
    ],
    toolbox: {
      feature: { saveAsImage: {}, dataZoom: {}, restore: {} },
      iconStyle: { borderColor: textColor },
      right: 20,
    },
    dataZoom: [{ type: "inside" }, { show: true, type: "slider", bottom: 10 }],
  };
  // * area change graph
  const areaChangeOption: ECOption = {
    backgroundColor: chartBackgroundColor,
    title: {
      text: `Area Change`,
      subtext: `Iceberg ${iceberg_id}`,
      left: "center",
      textStyle: { color: textColor },
      subtextStyle: { color: textColor },
    },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) =>
        value !== null ? (value as number).toFixed(2) + " km²" : "N/A",
    },
    xAxis: {
      type: "time",
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: axisLineColor } },
    },
    yAxis: {
      type: "value",
      name: "km²",
      scale: true,
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: axisLineColor } },
      splitLine: { lineStyle: { color: useColorModeValue("#eee", "#444") } },
    },
    series: [
      {
        name: "Area",
        type: "line",
        data: timeSeriesData.map((d) => [d.record_time, d.area]),
        smooth: true,
        showSymbol: false,
        connectNulls: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: "#3ba272" },
      },
    ],
    toolbox: {
      feature: { saveAsImage: {}, dataZoom: {}, restore: {} },
      iconStyle: { borderColor: textColor },
      right: 20,
    },
    dataZoom: [{ type: "inside" }, { show: true, type: "slider", bottom: 10 }],
  };

  return (
    <Flex height="100vh" width="100vw" overflow="hidden">
      <SideBar
        username={user_name}
        is_superuser={is_superuser}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={() => setSidebarOpen(false)}
        state={{
          user_name: user_name,
          is_superuser: is_superuser,
          is_logged_in: is_logged_in,
        }}
      />
      <Box // Main content area
        ml={sidebarOpen ? openWidth : closeWidth}
        flexGrow={1}
        p={{ base: 4, md: 6 }}
        overflowY="auto"
        bg={useColorModeValue("gray.50", "gray.800")}
      >
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          <Heading
            as="h1"
            size="xl"
            textAlign="center"
            color={useColorModeValue("blue.700", "blue.300")}
            mb={4}
          >
            Iceberg Detail: {iceberg_id}
          </Heading>

          {/* Charts Section */}
          {timeSeriesData && timeSeriesData.length > 0 ? (
            <Grid
              templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}
              gap={{ base: 4, md: 6 }}
            >
              <GridItem bg={renderBackground} p={4} rounded="lg" boxShadow="md">
                <EChartWrapper
                  option={rotationalVelocityOption}
                  style={{ height: "350px", width: "100%" }}
                  isLoading={isLoading}
                />
              </GridItem>
              <GridItem bg={renderBackground} p={4} rounded="lg" boxShadow="md">
                <EChartWrapper
                  option={areaChangeOption}
                  style={{ height: "350px", width: "100%" }}
                  isLoading={isLoading}
                />
              </GridItem>
            </Grid>
          ) : (
            <Text p={5} textAlign="center" color="gray.500">
              No time-series data available for charts.
            </Text>
          )}

          <Divider
            my={4}
            borderColor={useColorModeValue("gray.300", "gray.600")}
          />

          {/* Combined Info and Comments Section */}
          <Grid
            templateColumns={{ base: "1fr", md: "1.5fr 2fr" }}
            gap={{ base: 4, md: 6 }}
            alignItems="start"
          >
            <GridItem>
              <Box
                bg={useColorModeValue("white", "gray.700")}
                p={{ base: 4, md: 6 }}
                rounded="lg"
                boxShadow="md"
                width="full"
              >
                <Heading
                  as="h2"
                  size="lg"
                  color={useColorModeValue("blue.700", "blue.300")}
                  mb={6}
                  borderBottomWidth="2px"
                  borderColor={useColorModeValue("gray.200", "gray.600")}
                  pb={2}
                >
                  <Icon as={FaRegAddressCard} mr={3} verticalAlign="middle" />
                  Iceberg Snapshot
                </Heading>
                <VStack spacing={5} align="stretch">
                  <Stat>
                    <StatLabel
                      display="flex"
                      alignItems="center"
                      color={useColorModeValue("gray.600", "gray.400")}
                    >
                      <Icon as={FaMapMarkerAlt} mr={2} color="blue.500" />
                      Area
                    </StatLabel>

                    <StatNumber fontSize="2xl" color={textColor}>
                      {icebergDetails.area > 0
                        ? icebergDetails.area.toLocaleString()
                        : "Unobserved"}{" "}
                      km²
                    </StatNumber>
                    <StatHelpText>
                      Last updated: {new Date().toLocaleDateString()}
                    </StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel
                      display="flex"
                      alignItems="center"
                      color={useColorModeValue("gray.600", "gray.400")}
                    >
                      <Icon as={FaRegAddressCard} mr={2} color="green.500" />
                      Sea Ice / Mask Condition
                    </StatLabel>
                    <StatNumber fontSize="xl">
                      <Tag
                        size="lg"
                        colorScheme={
                          icebergDetails.mask === "NO_DATA" ? "gray" : "teal"
                        }
                        variant="solid"
                      >
                        {icebergDetails.mask || "N/A"}
                      </Tag>
                    </StatNumber>
                  </Stat>
                </VStack>
              </Box>
            </GridItem>

            {/* Comments Section */}
            <GridItem>
              <Box
                bg={useColorModeValue("white", "gray.700")}
                p={{ base: 4, md: 6 }}
                rounded="lg"
                boxShadow="md"
                width="full"
              >
                <Heading
                  as="h2"
                  size="lg"
                  color={useColorModeValue("blue.700", "blue.300")}
                  mb={6}
                  borderBottomWidth="2px"
                  borderColor={useColorModeValue("gray.200", "gray.600")}
                  pb={2}
                >
                  <Icon as={FaCommentAlt} mr={3} verticalAlign="middle" />
                  Discussion & Notes
                </Heading>
                <Box maxHeight="350px" overflowY="auto" mb={6} pr={2}>
                  {icebergDetails.comments &&
                  icebergDetails.comments.length > 0 ? (
                    icebergDetails.comments
                      .slice()
                      .reverse()
                      .map(
                        (
                          comment // Show newest first
                        ) => (
                          <Card
                            key={comment.comment_id}
                            mb={4}
                            variant="outline"
                            bg={commentColor[0]}
                          >
                            <CardHeader pb={2}>
                              <Flex justify="space-between" align="center">
                                <Flex align="center">
                                  <Avatar
                                    name={comment.user_name}
                                    size="sm"
                                    mr={3}
                                  />
                                  <Text
                                    fontSize="md"
                                    fontWeight="bold"
                                    color={textColor}
                                  >
                                    {comment.user_name}
                                  </Text>
                                </Flex>
                                <Text fontSize="xs" color={commentColor[1]}>
                                  {new Date(
                                    comment.suggestion_time
                                  ).toLocaleString()}
                                </Text>
                              </Flex>
                            </CardHeader>
                            <CardBody pt={0} pb={2}>
                              <Text fontSize="sm" color={commentColor[2]}>
                                {comment.suggestion}
                              </Text>
                            </CardBody>
                            {is_superuser && (
                              <CardFooter pt={1} justifyContent="flex-end">
                                <IconButton
                                  size="sm"
                                  variant="ghost"
                                  icon={<FaTrash />}
                                  colorScheme="red"
                                  aria-label="Delete comment"
                                  onClick={() =>
                                    handleCommentDeletion(comment.comment_id)
                                  }
                                />
                              </CardFooter>
                            )}
                          </Card>
                        )
                      )
                  ) : (
                    <Text color={commentColor[3]} fontStyle="italic">
                      No comments yet.
                    </Text>
                  )}
                </Box>

                <VStack
                  spacing={3}
                  as="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (icebergDetails.newComment.trim()) handleCommentSubmit();
                  }}
                >
                  <Input
                    placeholder="Add a new note or comment..."
                    value={icebergDetails.newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    size="md"
                    bg={useColorModeValue("white", "gray.800")}
                  />
                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    isDisabled={!icebergDetails.newComment.trim()}
                    leftIcon={<Icon as={FaCommentAlt} />}
                  >
                    Submit Note
                  </Button>
                </VStack>
              </Box>
            </GridItem>
          </Grid>
        </VStack>
      </Box>
    </Flex>
  );
};

export default IcebergDetail;
