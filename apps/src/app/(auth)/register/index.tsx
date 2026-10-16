import Register from "@/feature/Auth/Register/Register";
import { View } from "react-native";

export default function RegisterScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Register />
    </View>
  );
}
