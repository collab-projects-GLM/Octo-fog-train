import { PortalHost } from "@rn-primitives/portal";
import { View } from "react-native";

export default function _MainSectionLayout(children: React.ReactNode) {
  return (
    <View>
      <PortalHost />
    </View>
  );
}
