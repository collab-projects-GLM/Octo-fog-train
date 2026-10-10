import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthLayoutProps = {
  subtitle: string;
  children: ReactNode;
};

/** Shared frame for the login and register screens. */
export default function AuthLayout({ subtitle, children }: AuthLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center gap-8 px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center gap-1">
            <Text className="text-3xl font-bold text-black">Octo Travel</Text>
            <Text className="text-base text-gray-500">{subtitle}</Text>
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
