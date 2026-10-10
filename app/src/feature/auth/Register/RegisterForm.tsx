import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { View } from "react-native";

import { ApiError } from "@/api/client";
import { useRegister } from "@/hooks/use-register";
import { registerSchema, type RegisterValues } from "@/schemas/register";

import FormError from "@/components/forms/FormError";
import FormInput from "@/components/forms/FormInput";
import SubmitButton from "@/components/forms/SubmitButton";

const FIELDS = ["username", "email", "password"] as const;

/**
 * Like LoginForm, never reads `formState`. Server-side validation errors (a
 * taken username, a common password) are attached to their field with
 * `setError`; anything else shows in the form-level message.
 */
export default function RegisterForm() {
  const { control, handleSubmit, setError } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });
  const { mutate, isPending, error } = useRegister();

  const submit = handleSubmit((values) =>
    mutate(values, {
      onError: (err) => {
        if (!(err instanceof ApiError)) return;

        for (const field of FIELDS) {
          const message = err.fieldErrors[field];
          if (message) setError(field, { message });
        }
      },
    }),
  );

  // Field errors are already shown on their inputs; don't repeat them here.
  const showFormError =
    !(error instanceof ApiError) ||
    FIELDS.every((field) => !error.fieldErrors[field]);

  return (
    <View className="w-full max-w-sm gap-4">
      <FormInput
        control={control}
        name="username"
        label="Username"
        placeholder="traveller"
        autoComplete="username-new"
        textContentType="username"
        returnKeyType="next"
      />
      <FormInput
        control={control}
        name="email"
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <FormInput
        control={control}
        name="password"
        label="Password"
        placeholder="At least 8 characters"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
      />
      <FormInput
        control={control}
        name="confirmPassword"
        label="Confirm password"
        placeholder="Repeat your password"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <FormError message={showFormError ? error?.message : undefined} />
      <SubmitButton
        label={isPending ? "Creating account..." : "Create account"}
        disabled={isPending}
        onPress={submit}
      />
    </View>
  );
}
