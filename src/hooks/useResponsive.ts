import { useWindowDimensions } from "react-native";

export interface ResponsiveInfo {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isSmallPhone: boolean;
  isLargePhone: boolean;
  isTablet: boolean;
  contentWidth: number;
  horizontalPadding: number;
  columnCount: number;
  headerHeight: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isPortrait = height >= width;
  const isLandscape = !isPortrait;

  const minDim = Math.min(width, height);
  const isSmallPhone = minDim < 360;
  const isTablet = minDim >= 600;
  const isLargePhone = !isSmallPhone && !isTablet;

  const horizontalPadding = isLandscape ? 24 : isSmallPhone ? 12 : 16;
  const contentWidth = Math.max(280, width - horizontalPadding * 2);

  let columnCount = 1;
  if (isLandscape) {
    columnCount = isTablet ? 4 : 3;
  } else {
    columnCount = isTablet ? 3 : 2;
  }

  const headerHeight = isLandscape ? 48 : 60;

  return {
    width,
    height,
    isPortrait,
    isLandscape,
    isSmallPhone,
    isLargePhone,
    isTablet,
    contentWidth,
    horizontalPadding,
    columnCount,
    headerHeight,
  };
}
