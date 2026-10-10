import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SubmitButton from "@/components/forms/SubmitButton";
import { useAuth } from "@/feature/auth/AuthProvider";

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-8 px-6">
        <View className="items-center gap-1">
          <Text className="text-3xl font-bold text-black">
            Welcome, {user?.username}
          </Text>
          <Text className="text-base text-gray-500">{user?.email}</Text>
        </View>

        <View className="w-full max-w-sm">
          <SubmitButton label="Log out" disabled={false} onPress={signOut} />
        </View>
      </View>
    </SafeAreaView>
  );
}
