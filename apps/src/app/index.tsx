import Login from "@/feature/Auth/Login/Login";
import Maps from "@/feature/Maps/Map";
import { View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 bg-white">
      {/* <Login /> */}
      {/* <Test /> */}
      <Maps />
    </View>
  );
}
