import { Text } from "react-native";

export default function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Text className="text-sm text-red-600" accessibilityRole="alert">
      {message}
    </Text>
  );
}
