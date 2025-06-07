import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Image,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import SideBar, { openWidth, closeWidth } from "../components/SideBar";
import {
  BirthDeathLocationPoint,
  CorrelationDataPoint,
  LocationTrendData,
  SizeDistributionDataPoint,
  SizeDistributionOverTimeData,
  TimeSeriesDataPoint,
} from "../types/stats";
import {
  getActiveIcebergCountOverTime,
  getIcebergBirthDeathTrends,
  getIcebergBirthDeathData,
  getIcebergCorrelationData,
  // getPassageDensity,
  getSizeDistribution,
  getSizeDistributionOverTime,
} from "../services/stats";
import * as echarts from "echarts/core";
import EChartWrapper, { ECOption } from "../components/charts/EChartWrapper";
// import GeoMap from local folder
import worldGeoJson from "../assets/map/world.json";
import antarcticaGeoJson from "../assets/map/antarctica.json";
import type { FeatureCollection } from "geojson";

// combine world and antarctica map
const combinedGeoJson: FeatureCollection = {
  type: "FeatureCollection",
  // Take all features from your world map and add the features from the Antarctica map
  features: [
    ...(worldGeoJson as any).features,
    ...(antarcticaGeoJson as FeatureCollection).features,
  ],
};
echarts.registerMap("world", combinedGeoJson as any);
echarts.registerMap("antarctica", antarcticaGeoJson as any);

const DashBoard = () => {
  // * current size distribution plot
  const [isLoadingSize, setIsLoadingSize] = useState<boolean>(true);
  const [sizeDistributionData, setSizeDistributionData] = useState<
    SizeDistributionDataPoint[]
  >([]);
  // * active counts plot
  const [isLoadingActiveCount, setIsLoadingActiveCount] =
    useState<boolean>(true);
  const [activeCountData, setActiveCountData] = useState<TimeSeriesDataPoint[]>(
    []
  );
  // * correlation between rotational velocity and area
  const [isLoadingCorrelation, setIsLoadingCorrelation] =
    useState<boolean>(true);
  const [correlationData, setCorrelationData] = useState<
    CorrelationDataPoint[]
  >([]);
  // * birth and last observation place for icebergs
  const [isLoadingBirthDeath, setIsLoadingBirthDeath] = useState<boolean>(true);
  const [birthDeathData, setBirthDeathData] = useState<
    BirthDeathLocationPoint[]
  >([]);
  // * birth and death positions grouped by year (line plot for average location)
  const [locationTrendData, setLocationTrendData] =
    useState<LocationTrendData | null>(null);
  const [isLoadingTrends, setIsLoadingTrends] = useState<boolean>(true);

  // * size distribution over time to provide climate insight
  const [isLoadingSizeTime, setIsLoadingSizeTime] = useState<boolean>(true);
  const [sizeDistributionTimeData, setSizeDistributionTimeData] =
    useState<SizeDistributionOverTimeData | null>(null);

  // // * passage density
  // const [densityData, setDensityData] = useState<[number, number, number][]>(
  //   []
  // );
  // const [isLoadingDensity, setIsLoadingDensity] = useState<boolean>(true);

  // auxiliary
  const location = useLocation();
  // user-related info for sidebar display
  const {
    user_name: userName,
    is_logged_in: isLoggedIn,
    is_superuser: isSuperUser,
  } = location.state || {};
  // sidebar display
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // background configurations for visualization
  const chartBackgroundColor = useColorModeValue(
    "rgba(255,255,255,0.8)",
    "rgba(26,32,44,0.8)"
  ); // white, gray.800
  const textColor = useColorModeValue("#333", "#ccc");
  const axisLineColor = useColorModeValue("#666", "#777");

  useEffect(() => {
    const fetchData = async () => {
      // * size distribution plot
      try {
        setIsLoadingSize(true);
        const sizeResponse = await getSizeDistribution();
        setSizeDistributionData(sizeResponse.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSize(false);
      }

      // * active counts over time
      try {
        setIsLoadingActiveCount(true);
        const activeCountResponse = await getActiveIcebergCountOverTime();
        setActiveCountData(activeCountResponse.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingActiveCount(false);
      }

      // * correlation between rot_vel and area
      try {
        setIsLoadingCorrelation(true);
        const corrResponse = await getIcebergCorrelationData();
        setCorrelationData(corrResponse.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingCorrelation(false);
      }

      // * birth and melt patterns
      try {
        setIsLoadingBirthDeath(true);
        const birthResponse = await getIcebergBirthDeathData();
        setBirthDeathData(birthResponse.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingBirthDeath(false);
      }

      // * birth positions aggregated by year
      try {
        setIsLoadingTrends(true);
        const birthTrendResponse = await getIcebergBirthDeathTrends();
        setLocationTrendData(birthTrendResponse.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingTrends(false);
      }

      // * size distribution over time
      try {
        setIsLoadingSizeTime(true);
        const sizeOverTimeResponse = await getSizeDistributionOverTime();
        setSizeDistributionTimeData(sizeOverTimeResponse.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSizeTime(false);
      }

      // // * passage density
      // try {
      //   setIsLoadingDensity(true);
      //   const passageDensity = await getPassageDensity();
      //   setDensityData(passageDensity.data);
      // } catch (err) {
      //   console.log(err);
      // } finally {
      //   setIsLoadingDensity(false);
      // }
    };
    fetchData();
  }, []);

  // * size distribution plot
  const sizeDistributionOption: ECOption = {
    backgroundColor: chartBackgroundColor,
    title: {
      text: "Iceberg Size Distribution",
      left: "center",
      textStyle: { color: textColor },
      bottom: 0,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: {
      left: "8%",
      right: "8%",
      bottom: "25%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: sizeDistributionData.map((item) => item.name),
      axisLabel: {
        rotate: 30,
        color: textColor,
      },
      axisLine: { lineStyle: { color: axisLineColor } },
    },
    yAxis: {
      type: "value",
      name: "Number of Icebergs",
      nameTextStyle: { color: textColor, padding: [0, 0, 0, 30] },
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: axisLineColor } },
      splitLine: { lineStyle: { color: useColorModeValue("#eee", "#444") } },
      nameRotate: 90,
      nameLocation: "middle",
      nameGap: 30,
    },
    series: [
      {
        name: "Iceberg Count",
        type: "bar",
        data: sizeDistributionData.map((item) => item.value),
        itemStyle: {
          borderRadius: [5, 5, 0, 0], // Rounded top corners for bars
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#83bff6" },
            { offset: 0.5, color: "#188df0" },
            { offset: 1, color: "#188df0" },
          ]),
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#2378f7" },
              { offset: 0.7, color: "#2378f7" },
              { offset: 1, color: "#83bff6" },
            ]),
          },
        },
        animationDelay: (idx: number) => idx * 10,
      },
    ],
    toolbox: {
      feature: {
        saveAsImage: {
          title: "Save",
          backgroundColor: useColorModeValue("#fff", "#333"),
        },
        dataZoom: { title: { zoom: "Zoom", back: "Reset Zoom" } },
        magicType: {
          type: ["line", "bar"],
          title: { line: "Line", bar: "Bar" },
        },
        restore: { title: "Restore" },
      },
      iconStyle: { borderColor: textColor },
    },
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      { show: true, type: "slider", start: 0, end: 100, bottom: "15%" },
    ],
    animationEasing: "elasticOut",
    animationDelayUpdate: (idx: number) => idx * 5,
  };

  // * active counts over time plot
  const activeCountOption: ECOption = {
    backgroundColor: chartBackgroundColor,
    title: {
      text: "Monthly Active Icebergs",
      left: "center",
      bottom: 0,
      textStyle: { color: textColor },
    },
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const param = Array.isArray(params) ? params[0] : params;
        return `Date: ${param.name}<br />Active Icebergs: ${param.value}`;
      },
    },
    grid: {
      left: "8%",
      right: "8%",
      bottom: "25%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: activeCountData.map((item) => item.time),
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: axisLineColor } },
    },
    yAxis: {
      type: "value",
      name: "Number of Active Icebergs",
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: axisLineColor } },
      splitLine: { lineStyle: { color: useColorModeValue("#eee", "#444") } },
      nameRotate: 90,
      nameLocation: "middle",
      nameGap: 30,
    },
    series: [
      {
        name: "Active Icebergs",
        type: "line",
        data: activeCountData.map((item) => item.value),
        smooth: 0.3,
        symbol: "circle",
        symbolSize: 8,
        itemStyle: { color: "#5470c6" },
        lineStyle: { width: 3 },
        areaStyle: {
          // Fancy gradient fill under the line
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: "rgba(84, 112, 198, 0.5)",
            },
            {
              offset: 1,
              color: "rgba(84, 112, 198, 0)",
            },
          ]),
        },
        emphasis: {
          focus: "series",
          itemStyle: {
            borderWidth: 2,
            borderColor: "#fff",
          },
        },
      },
    ],
    toolbox: {
      feature: {
        saveAsImage: {
          title: "Save",
          backgroundColor: useColorModeValue("#fff", "#333"),
        },
        dataZoom: { title: { zoom: "Zoom", back: "Reset Zoom" } },
        magicType: {
          type: ["line", "bar", "stack"],
          title: { line: "Line", bar: "Bar", stack: "Stack" },
        },
        restore: { title: "Restore" },
      },
      iconStyle: { borderColor: textColor },
    },
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      { show: true, type: "slider", start: 0, end: 100, bottom: "15%" },
    ],
  };

  // * correlation plot for rot_vel and area
  const correlationPlotOption: ECOption = {
    backgroundColor: chartBackgroundColor,
    title: {
      text: "Iceberg Area vs. Rotational Velocity",
      left: "center",
      bottom: 0,
      textStyle: { color: textColor },
    },
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        return `ID: ${params.data[2]}<br/>Area: ${
          params.data[0]
        } km²<br/>Rot. Vel.: ${
          params.data[1] !== null
            ? params.data[1].toFixed(2) + " deg/day"
            : "N/A"
        }`;
      },
    },
    grid: {
      left: "8%",
      right: "8%",
      bottom: "25%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: "Area (km²)",
      nameLocation: "middle",
      nameGap: 30,
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: axisLineColor } },
      splitLine: { lineStyle: { color: useColorModeValue("#eee", "#444") } },
    },
    yAxis: {
      type: "value",
      name: "Rotational Velocity (deg/hr)",
      nameRotate: 90,
      nameLocation: "middle",
      nameGap: 40,
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: axisLineColor } },
      splitLine: { lineStyle: { color: useColorModeValue("#eee", "#444") } },
    },
    series: [
      {
        name: "Icebergs",
        type: "scatter",
        symbolSize: 10,
        data: correlationData.map((item) => [
          item.area,
          item.rotationalVelocity,
          item.id,
        ]),
        itemStyle: { color: "#fc8251" },
      },
    ],
    toolbox: {
      feature: { saveAsImage: {}, dataZoom: {} },
      iconStyle: { borderColor: textColor },
      right: 20,
    },
    dataZoom: [
      { type: "inside" },
      { show: true, type: "slider", bottom: "10%" },
    ],
  };

  // * birth and melt place analysis
  const birthDeathMapOption: ECOption = {
    backgroundColor: chartBackgroundColor,
    title: {
      text: "Iceberg Birth and Melt Hotspots",
      left: "center",
      textStyle: { color: textColor },
    },
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        return `${params.marker} ${params.name}<br/>Lon: ${
          params.value[0] ? params.value[0].toFixed(2) : "N/A"
        }, Lat: ${
          params.value[1] ? params.value[1].toFixed(2) : "N/A"
        }<br/>Time: ${new Date(params.data.record_time).toLocaleDateString()}`;
      },
    },
    geo: {
      map: "world",
      roam: true,
      itemStyle: {
        areaColor: useColorModeValue("#e0e0e0", "#323c48"),
        borderColor: useColorModeValue("#ccc", "#444"),
      },
      emphasis: {
        itemStyle: { areaColor: useColorModeValue("#d4d4d4", "#2a333d") },
      },
      label: { show: false },
      center: [-45, -60],
      zoom: 2.5,
    },
    legend: {
      data: ["Birth Locations", "Melt Locations"],
      orient: "vertical",
      left: "left",
      top: "bottom",
      textStyle: { color: textColor },
    },
    series: [
      {
        name: "Birth Locations",
        type: "scatter",
        coordinateSystem: "geo",
        data: birthDeathData
          .filter((p) => p.type === "birth")
          .map((p) => ({
            name: p.name,
            value: [p.longitude, p.latitude, 1],
            record_time: p.record_time,
          })),
        symbolSize: 10,
        itemStyle: { color: "#4ade80" },
        // rippleEffect: { brushType: "stroke" },
      },
      {
        name: "Melt Locations",
        type: "scatter",
        coordinateSystem: "geo",
        data: birthDeathData
          .filter((p) => p.type === "death")
          .map((p) => ({
            name: p.name,
            value: [p.longitude, p.latitude, 1],
            record_time: p.record_time,
          })),
        symbolSize: 10,
        itemStyle: { color: "#f87171" },
        // rippleEffect: { brushType: "stroke" },
      },
    ],
    toolbox: {
      feature: { saveAsImage: {}, restore: {} },
      iconStyle: { borderColor: textColor },
      right: 20,
      bottom: 0,
    },
  };

  // * birth and melt places grouped by year
  // --- Chart 1: Latitude Trends ---
  const latitudeTrendOption: ECOption = {
    backgroundColor: chartBackgroundColor,
    title: {
      text: "Average Latitude of Iceberg Origins & Endpoints",
      left: "center",
      textStyle: { color: textColor },
    },
    tooltip: { trigger: "axis" },
    legend: {
      data: [
        "Birth Latitude", 
        "Last Seen Latitude", 
        "Birth Trend", 
        "Last Seen Trend"
      ],
      bottom: '2%',
      textStyle: { color: textColor },
    },
    grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: locationTrendData?.years || [],
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: "value",
      name: "Latitude (°)",
      axisLabel: { formatter: '{value}° S', color: textColor },
      inverse: true,
      nameLocation: "start",
      max: -50,
    },
    series: [
      {
        name: "Birth Latitude",
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        data: locationTrendData?.birth_locations.latitudes || [],
        itemStyle: { color: "#4ade80" },
      },
      {
        name: "Last Seen Latitude",
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        data: locationTrendData?.death_locations.latitudes || [],
        itemStyle: { color: "#f87171" },
      },
      // --- NEW: Trend Lines ---
      {
        name: "Birth Trend",
        type: "line",
        showSymbol: false, // No symbols for trend lines
        data: locationTrendData?.birth_locations.latitudes_trend || [],
        lineStyle: {
            color: "#4ade80", // Same color as data
            width: 2,
            type: 'dashed', // Dashed line style
            opacity: 0.8,
        },
        emphasis: { disabled: true }, // Disable hover effects on the trend line
      },
      {
        name: "Last Seen Trend",
        type: "line",
        showSymbol: false,
        data: locationTrendData?.death_locations.latitudes_trend || [],
        lineStyle: {
            color: "#f87171",
            width: 2,
            type: 'dashed',
            opacity: 0.8,
        },
        emphasis: { disabled: true },
      }
    ],
    dataZoom: [{ type: 'inside' }, { show: true, type: 'slider', bottom: '10%' }],
    toolbox: {
      feature: { saveAsImage: {}, restore: {} },
      iconStyle: { borderColor: textColor },
      right: 20,
      top: 20,
    },
  };

  // --- Chart 2: Longitude Trends ---
  const longitudeTrendOption: ECOption = {
    backgroundColor: chartBackgroundColor,
    title: {
      text: "Average Longitude of Iceberg Origins & Endpoints",
      left: "center",
      textStyle: { color: textColor },
    },
    tooltip: { trigger: "axis" },
    legend: {
      data: [
        "Birth Longitude",
        "Last Seen Longitude",
        "Birth Trend",
        "Last Seen Trend"
      ],
      bottom: '2%',
      textStyle: { color: textColor },
    },
    grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: locationTrendData?.years || [],
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: "value",
      name: "Longitude (°)",
      axisLabel: { formatter: '{value}°', color: textColor },
    },
    series: [
      {
        name: "Birth Longitude",
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        data: locationTrendData?.birth_locations.longitudes || [],
        itemStyle: { color: "#4ade80" },
      },
      {
        name: "Last Seen Longitude",
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        data: locationTrendData?.death_locations.longitudes || [],
        itemStyle: { color: "#f87171" },
      },
      // --- NEW: Trend Lines ---
      {
        name: "Birth Trend",
        type: "line",
        showSymbol: false,
        data: locationTrendData?.birth_locations.longitudes_trend || [],
        lineStyle: {
            color: "#4ade80",
            width: 2,
            type: 'dashed',
            opacity: 0.8,
        },
        emphasis: { disabled: true },
      },
      {
        name: "Last Seen Trend",
        type: "line",
        showSymbol: false,
        data: locationTrendData?.death_locations.longitudes_trend || [],
        lineStyle: {
            color: "#f87171",
            width: 2,
            type: 'dashed',
            opacity: 0.8,
        },
        emphasis: { disabled: true },
      }
    ],
    dataZoom: [{ type: 'inside' }, { show: true, type: 'slider', bottom: '10%' }],
    toolbox: {
      feature: { saveAsImage: {}, restore: {} },
      iconStyle: { borderColor: textColor },
      right: 20,
      top: 20,
    },
  };

  // * size distribution over time to reflect climate changes
  const sizeDistributionOverTimeOption: ECOption = {
    backgroundColor: chartBackgroundColor,
    title: {
      text: "Iceberg Size Distribution Over Time (2005-2015)",
      left: "center",
      textStyle: { color: textColor },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        let tooltipHtml = `${params[0].name}<br/>`; // Year
        let total = 0;
        params.forEach((item: any) => {
          tooltipHtml += `${item.marker} ${
            item.seriesName
          }: ${item.value.toLocaleString()}<br/>`;
          if (typeof item.value === "number") {
            total += item.value;
          }
        });
        tooltipHtml += `<strong>Total: ${total.toLocaleString()}</strong>`;
        return tooltipHtml;
      },
    },
    legend: {
      data: sizeDistributionTimeData?.bin_labels || [],
      bottom: "7%",
      textStyle: { color: textColor },
      type: "scroll",
    },
    grid: {
      left: "3%",
      right: "7%",
      bottom: "15%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: sizeDistributionTimeData?.time_periods || [],
      axisLabel: {
        // rotate: 30,
        color: textColor,
      },
      axisLine: { lineStyle: { color: axisLineColor } },
    },
    yAxis: {
      type: "value",
      name: "Number of Iceberg Observations",
      nameTextStyle: { color: textColor, padding: [0, 0, 10, 0] },
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: axisLineColor }, show: true },
      splitLine: { lineStyle: { color: useColorModeValue("#eee", "#444") } },
      nameRotate: 90,
      nameGap: 30,
      nameLocation: "middle",
    },
    series: sizeDistributionTimeData?.series_data || [],
    toolbox: {
      feature: {
        saveAsImage: { backgroundColor: useColorModeValue("#fff", "#333") },
        dataZoom: { yAxisIndex: false }, // Zoom X-axis by default
        magicType: { type: ["line", "bar", "stack"] }, // Added 'stack'
        restore: {},
      },
      orient: "vertical",
      right: 10,
      top: "center",
      iconStyle: { borderColor: textColor },
    },
    dataZoom: [
      { type: "inside", start: 0, end: 100, xAxisIndex: [0] },
      {
        show: true,
        type: "slider",
        start: 0,
        end: 100,
        xAxisIndex: [0],
        bottom: "2%",
        height: 20,
      },
    ],
  };

  // // * passage density plot
  // const aggregateDensityOption: ECOption = {
  //   backgroundColor: chartBackgroundColor,
  //   title: {
  //     text: "Aggregate Iceberg Passage Density",
  //     subtext: "Highlighting common counterclockwise coastal drift",
  //     left: "center",
  //     textStyle: { color: textColor },
  //     subtextStyle: { color: textColor },
  //   },
  //   tooltip: {
  //     trigger: "item",
  //     formatter: (params: any) => {
  //       if (!params.value) return "";
  //       return `Avg. Location: (${params.value[0].toFixed(
  //         2
  //       )}, ${params.value[1].toFixed(2)})<br/>
  //             Iceberg Passages: ${params.value[2]}`;
  //     },
  //   },
  //   visualMap: {
  //     min: 0,
  //     // Calculate max dynamically from your data for best color mapping
  //     max: Math.max(...densityData.map((item) => item[2]), 1),
  //     calculable: true,
  //     realtime: false,
  //     inRange: {
  //       // Color scheme from low to high density
  //       color: [
  //         "#313695",
  //         "#4575b4",
  //         "#74add1",
  //         "#abd9e9",
  //         "#e0f3f8",
  //         "#ffffbf",
  //         "#fee090",
  //         "#fdae61",
  //         "#f46d43",
  //         "#d73027",
  //         "#a50026",
  //       ],
  //     },
  //     textStyle: { color: textColor },
  //     left: "left",
  //     top: "bottom",
  //   },
  //   geo: {
  //     map: "antarctica", // Assumes you have registered 'world' GeoJSON
  //     roam: true,
  //     silent: false, // Allows tooltips on the heatmap points
  //     layoutCenter: ["50%", "50%"],
  //     layoutSize: "120%",
  //     zoom: 3,
  //     itemStyle: {
  //       areaColor: useColorModeValue("#a6c845", "#56692d"), // A more "icy" or "land" color
  //       borderColor: useColorModeValue("#777", "#aaa"),
  //       borderWidth: 0.5,
  //     },
  //     emphasis: {
  //       label: { show: false },
  //       itemStyle: { areaColor: useColorModeValue("#c1e177", "#6c8038") },
  //     },
  //   },
  //   series: [
  //     {
  //       name: "Iceberg Passage Density",
  //       type: "heatmap",
  //       coordinateSystem: "geo",
  //       data: densityData, // Data from the backend API
  //       pointSize: 5,
  //       blurSize: 6,
  //     },
  //   ],
  // };

  return (
    <>
      <Flex height="100vh" width="100vw" overflow="hidden">
        <SideBar
          username={userName}
          is_superuser={isSuperUser}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={() => setSidebarOpen(false)}
          state={{
            user_name: userName,
            is_superuser: isSuperUser,
            is_logged_in: isLoggedIn,
          }}
        />
        <Box
          ml={sidebarOpen ? openWidth : closeWidth}
          flexGrow={1}
          p={6}
          overflowY="auto"
          bg={useColorModeValue("gray.50", "gray.900")}
        >
          <VStack spacing={8} align="stretch">
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={6}
            >
              <GridItem>
                <EChartWrapper
                  option={sizeDistributionOverTimeOption}
                  isLoading={isLoadingSizeTime}
                  style={{ height: "450px" }}
                />
              </GridItem>

              <GridItem>
                <EChartWrapper
                  option={activeCountOption}
                  isLoading={isLoadingActiveCount}
                  style={{ height: "450px" }}
                />
              </GridItem>
              <GridItem>
                <EChartWrapper
                  option={correlationPlotOption}
                  isLoading={isLoadingCorrelation}
                  style={{ height: "450px" }}
                />
              </GridItem>
              <GridItem>
                <EChartWrapper
                  option={birthDeathMapOption}
                  isLoading={isLoadingBirthDeath}
                  style={{ height: "450px" }}
                />
              </GridItem>
              <GridItem>
                <EChartWrapper
                  option={sizeDistributionOption}
                  isLoading={isLoadingSize}
                  style={{ height: "450px" }}
                />
              </GridItem>
              <GridItem>
                <EChartWrapper
                  option={latitudeTrendOption}
                  isLoading={isLoadingTrends}
                  style={{ height: "450px" }}
                />
              </GridItem>
              <GridItem>
                <EChartWrapper
                  option={longitudeTrendOption}
                  isLoading={isLoadingTrends}
                  style={{ height: "450px" }}
                />
              </GridItem>
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Box
                  p={4}
                  bg={useColorModeValue("white", "gray.700")}
                  rounded="lg"
                  boxShadow="md"
                >
                  <Heading as="h3" size="md" textAlign="center" mb={4}>
                    Aggregate Iceberg Passage Density
                  </Heading>
                  <Text
                    textAlign="center"
                    fontSize="sm"
                    color="gray.500"
                    mb={4}
                  >
                    Common counterclockwise coastal drift of icebergs.
                  </Text>
                  <Image
                    src={
                      "http://localhost:8080/stats/aggregate_density_map.png"
                    }
                    alt="Map showing the density of iceberg passages around Antarctica"
                    fallback={<Spinner size="xl" />}
                  />
                </Box>
              </GridItem>
            </Grid>
          </VStack>
        </Box>
      </Flex>
    </>
  );
};

export default DashBoard;
