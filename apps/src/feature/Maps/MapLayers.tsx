import { RasterDemSource, StyleImport, Terrain } from "@rnmapbox/maps";
import { useMemo } from "react";
import {
  TERRAIN_SOURCE_ID,
  TERRAIN_SOURCE_URL,
} from "./map-config";
import type { MapTheme } from "./map-theme";

/** The Standard style's 3D layers, all on or all off. */
function layers3d(show3d: boolean) {
  return {
    show3dObjects: show3d,
    show3dBuildings: show3d,
    show3dFacades: show3d,
    show3dLandmarks: show3d,
    show3dTrees: show3d,
  };
}

// Module-level so the map components get the same objects every render and skip the work.
const LAYERS_3D = layers3d(true);
const LAYERS_FLAT = layers3d(false);
/** 1 is the real relief, 0 is flat ground. */
const TERRAIN_ON = { exaggeration: 1 };
const TERRAIN_OFF = { exaggeration: 0 };

type MapLayersProps = {
  /** The basemap's light preset and colors. */
  theme: MapTheme;
  /** Extruded buildings, landmarks and trees. */
  buildings: boolean;
  /** 3D terrain. */
  terrain: boolean;
};

/**
 * @abstract The map's style layers: the Standard basemap with its theme and 3D toggled, and the
 * terrain. Render it inside a MapView.
 * @returns JSX
 */
export default function MapLayers({ theme, buildings, terrain }: MapLayersProps) {
  const basemap = useMemo(
    () => ({ ...theme, ...(buildings ? LAYERS_3D : LAYERS_FLAT) }),
    [theme, buildings],
  );

  return (
    <>
      <StyleImport id="basemap" existing config={basemap} />
      <RasterDemSource
        id={TERRAIN_SOURCE_ID}
        url={TERRAIN_SOURCE_URL}
        tileSize={514}
        maxZoomLevel={14}
      />
      <Terrain
        sourceID={TERRAIN_SOURCE_ID}
        style={terrain ? TERRAIN_ON : TERRAIN_OFF}
      />
    </>
  );
}
