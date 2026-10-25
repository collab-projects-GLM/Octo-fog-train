import {
  Building,
  LocateFixed,
  Map as MapIcon,
  Mountain,
  type LucideIcon,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

type MapControlsProps = {
  /** True while the camera is locked on the user. */
  following: boolean;
  /** True for the tilted 3D view, false for top-down. */
  tilted: boolean;
  /** True when the 3D terrain is on. */
  terrain: boolean;
  /** True when the 3D buildings are on. */
  buildings: boolean;
  /** True for the zoomed-out everyday map, false for the close-up avatar view. */
  normalMap: boolean;
  onRecenter: () => void;
  onToggleTilt: () => void;
  onToggleTerrain: () => void;
  onToggleBuildings: () => void;
  onToggleNormalMap: () => void;
};

type ControlProps = {
  /** White (the app's "on" look) when active. */
  active: boolean;
  label: string;
  onPress: () => void;
  children: ReactNode;
};

function Control({ active, label, onPress, children }: ControlProps) {
  return (
    <Button
      size="icon"
      variant={active ? "default" : "secondary"}
      className="h-12 w-12 rounded-full"
      accessibilityLabel={label}
      onPress={onPress}
    >
      {children}
    </Button>
  );
}

function ControlIcon({ as }: { as: LucideIcon }) {
  return <Icon as={as} size={22} />;
}

/**
 * @abstract Floating controls for the map: recenter on the user, flip between the tilted 3D view
 * and a top-down one, switch between the close-up avatar view and an everyday zoomed-out map,
 * and turn the 3D terrain and 3D buildings on or off. Position them inside a container that
 * already stops above the system navigation bar (see SimpleMap).
 * @returns JSX
 */
export default function MapControls({
  following,
  tilted,
  terrain,
  buildings,
  normalMap,
  onRecenter,
  onToggleTilt,
  onToggleTerrain,
  onToggleBuildings,
  onToggleNormalMap,
}: MapControlsProps) {
  return (
    <View pointerEvents="box-none" className="absolute bottom-4 right-4 gap-3">
      <Control
        active={normalMap}
        label={normalMap ? "Switch to the close-up avatar view" : "Switch to the normal map"}
        onPress={onToggleNormalMap}
      >
        <ControlIcon as={MapIcon} />
      </Control>
      <Control
        active={terrain}
        label={terrain ? "Turn 3D terrain off" : "Turn 3D terrain on"}
        onPress={onToggleTerrain}
      >
        <ControlIcon as={Mountain} />
      </Control>
      <Control
        active={buildings}
        label={buildings ? "Turn 3D buildings off" : "Turn 3D buildings on"}
        onPress={onToggleBuildings}
      >
        <ControlIcon as={Building} />
      </Control>
      <Control
        active={tilted}
        label={tilted ? "Switch to top-down view" : "Switch to 3D view"}
        onPress={onToggleTilt}
      >
        <Text className="text-xs font-semibold">{tilted ? "3D" : "2D"}</Text>
      </Control>
      <Control active={following} label="Center on my location" onPress={onRecenter}>
        <ControlIcon as={LocateFixed} />
      </Control>
    </View>
  );
}
