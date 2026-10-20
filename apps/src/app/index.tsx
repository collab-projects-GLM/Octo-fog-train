import Login from "@/feature/Auth/Login/Login";
import Maps from "@/feature/Maps/Map";
import { View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      {/* <Login /> */}
      <Maps />
    </View>
  );
}
