import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { View } from "react-native";

import { useLogin } from "@/hooks/use-login";
import { loginSchema, type LoginValues } from "@/schemas/login";

import FormError from "@/components/forms/FormError";
import FormInput from "@/components/forms/FormInput";
import SubmitButton from "@/components/forms/SubmitButton";

/**
 * Never reads `formState`, so react-hook-form doesn't re-render this component
 * on typing or validation; each FormInput subscribes to its own field. It
 * re-renders only as the login mutation changes state.
 */
export default function LoginForm() {
  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });
  const { mutate, isPending, error } = useLogin();

  const submit = handleSubmit((values) => mutate(values));

  return (
    <View className="w-full max-w-sm gap-4">
      <FormInput
        control={control}
        name="identifier"
        label="Email or username"
        placeholder="you@example.com"
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
      />
      <FormInput
        control={control}
        name="password"
        label="Password"
        placeholder="Password"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <FormError message={error?.message} />
      <SubmitButton
        label={isPending ? "Signing in..." : "Log in"}
        disabled={isPending}
        onPress={submit}
      />
    </View>
  );
}
