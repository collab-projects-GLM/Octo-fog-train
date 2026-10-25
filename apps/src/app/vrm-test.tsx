import { AVATAR_MODEL } from "@/feature/Avatar/avatar-model";
import VrmView from "@/feature/Avatar/VrmView";
import { View } from "react-native";

export default function VrmTestScreen() {
  return (
    <View className="flex-1 bg-white">
      <VrmView model={AVATAR_MODEL} />
    </View>
  );
}
