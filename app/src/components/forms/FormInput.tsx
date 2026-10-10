import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import FormError from "./FormError";

type FormInputProps<T extends FieldValues> = Omit<
  TextInputProps,
  "value" | "onChangeText" | "onBlur"
> & {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

/**
 * Labelled input bound to a react-hook-form field. Controller subscribes to
 * just this field, so typing or an error here re-renders only this component.
 */
export default function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View className="gap-1">
          <Text className="text-sm font-medium text-gray-700">{label}</Text>
          <TextInput
            className={`rounded-lg border px-3 py-3 text-base text-black ${error ? "border-red-500" : "border-gray-300"}`}
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={label}
            {...inputProps}
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
          />
          <FormError message={error?.message} />
        </View>
      )}
    />
  );
}
