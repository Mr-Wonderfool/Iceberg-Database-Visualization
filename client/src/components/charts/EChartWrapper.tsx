import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  HeatmapChart,
  GraphChart,
  SankeyChart,
  FunnelChart,
  GaugeChart,
  TreeChart,
  TreemapChart,
  SunburstChart,
  BoxplotChart,
  CandlestickChart,
  EffectScatterChart,
  LinesChart,
  PictorialBarChart,
  ThemeRiverChart,
  CustomChart,
} from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  TimelineComponent,
  CalendarComponent,
  GraphicComponent,
  AriaComponent,
  DatasetComponent,
  TransformComponent,
  GeoComponent
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers"; // SVGRenderer might also work
import { Box, useColorModeValue } from "@chakra-ui/react";

import type { BarSeriesOption, EffectScatterSeriesOption, HeatmapSeriesOption, LineSeriesOption, ScatterSeriesOption } from 'echarts/charts';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption,
  ToolboxComponentOption,
  DataZoomComponentOption,
} from 'echarts/components';

export type ECOption = echarts.ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | ScatterSeriesOption
  | EffectScatterSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | ToolboxComponentOption
  | DataZoomComponentOption
  | HeatmapSeriesOption
>;

// Register the necessary ECharts components
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  TimelineComponent,
  CalendarComponent,
  GraphicComponent,
  AriaComponent,
  DatasetComponent,
  TransformComponent,
  GeoComponent,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  HeatmapChart,
  GraphChart,
  SankeyChart,
  FunnelChart,
  GaugeChart,
  TreeChart,
  TreemapChart,
  SunburstChart,
  BoxplotChart,
  CandlestickChart,
  EffectScatterChart,
  LinesChart,
  PictorialBarChart,
  ThemeRiverChart,
  CustomChart,
  CanvasRenderer, // or SVGRenderer
]);

interface EChartWrapperProps {
  option: ECOption;
  style?: React.CSSProperties;
  isLoading?: boolean;
  theme?: string;
}

const EChartWrapper = ({
  option,
  style,
  isLoading,
  theme = "light",
}: EChartWrapperProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const chakraTheme = useColorModeValue("light", "dark"); // Detect Chakra UI theme

  useEffect(() => {
    if (chartRef.current) {
      // Initialize chart instance if it doesn't exist or theme changes
      if (
        !chartInstanceRef.current ||
        chartInstanceRef.current.getDom().getAttribute("data-theme") !==
          (theme || chakraTheme)
      ) {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.dispose();
        }
        chartInstanceRef.current = echarts.init(
          chartRef.current,
          theme || chakraTheme,
          { renderer: "canvas" }
        );
        chartInstanceRef.current
          .getDom()
          .setAttribute("data-theme", theme || chakraTheme);
      }

      if (isLoading) {
        chartInstanceRef.current.showLoading();
      } else {
        chartInstanceRef.current.hideLoading();
        chartInstanceRef.current.setOption(option, true);
      }
    }

    // Resize chart with window
    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [option, isLoading, theme, chakraTheme]);

  return (
    <Box
      ref={chartRef}
      style={{ width: "100%", height: "400px", ...style }}
      // default styling
      p={2}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      bg={useColorModeValue("white", "gray.800")}
      boxShadow="sm"
    />
  );
};

export default EChartWrapper;
