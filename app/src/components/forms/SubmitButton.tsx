import { Pressable, Text } from "react-native";

type SubmitButtonProps = {
  label: string;
  disabled: boolean;
  onPress: () => void;
};

/** Stateless button; the parent decides when it is disabled. */
export default function SubmitButton({
  label,
  disabled,
  onPress,
}: SubmitButtonProps) {
  return (
    <Pressable
      className={`items-center rounded-lg py-3 ${disabled ? "bg-gray-300" : "bg-black active:opacity-80"}`}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text className="text-base font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
