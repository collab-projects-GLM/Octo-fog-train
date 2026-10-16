import { View } from "react-native";
import { Controller } from "react-hook-form";
import { LoaderCircle } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { RegisterProp, RegisterPayload, RegisterSchema } from "./register.utils";
import { useAuthForm } from "../use-auth-form";

const REGISTER_FIELDS = ["username", "email", "password"] as const;

export default function RegisterShell({ registerAction, defaultParams }: RegisterProp) {
  const { control, errors, submit, isPending, isLocked } =
    useAuthForm<RegisterPayload>({
      schema: RegisterSchema,
      defaultValues: defaultParams,
      fields: REGISTER_FIELDS,
      action: registerAction,
    });

  return (
    <View className="w-full gap-1">
      {/* Username */}
      <View className="gap-2">
        <Label>Username</Label>

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              className={cn(errors.username && "border-error")}
              placeholder="Choose a username"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              aria-invalid={!!errors.username}
              accessibilityLabel="Username"
            />
          )}
        />

        <FieldError message={errors.username?.message} />
      </View>

      {/* Email */}
      <View className="gap-2">
        <Label>Email</Label>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              className={cn(errors.email && "border-error")}
              placeholder="you@example.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              aria-invalid={!!errors.email}
              accessibilityLabel="Email address"
            />
          )}
        />

        <FieldError message={errors.email?.message} />
      </View>

      {/* Password */}
      <View className="gap-2">
        <Label>Password</Label>

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              className={cn(errors.password && "border-error")}
              placeholder="At least 8 characters"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              accessibilityLabel="Password"
            />
          )}
        />

        <FieldError message={errors.password?.message} />
      </View>

      <FieldError message={errors.root?.server?.message} lines={2} />

      {/* Submit */}
      <Button onPress={submit} disabled={isLocked}>
        {isPending ? (
          <Icon as={LoaderCircle} className="animate-spin" />
        ) : (
          <Text>Create account</Text>
        )}
      </Button>
    </View>
  );
}
