import { ActivityIndicator, Text, View } from "react-native";

export type VrmStatus =
  | { kind: "loading"; label: string }
  | { kind: "ready" }
  | { kind: "error"; message: string };

/** Loading / error text drawn over the avatar view. Draws nothing once the model is ready. */
export default function VrmStatusOverlay({ status }: { status: VrmStatus }) {
  if (status.kind === "ready") return null;
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center gap-3 p-6"
    >
      {status.kind === "loading" ? (
        <>
          <ActivityIndicator />
          <Text className="text-center">{status.label}</Text>
        </>
      ) : (
        <Text className="text-center text-red-600">{status.message}</Text>
      )}
    </View>
  );
}
