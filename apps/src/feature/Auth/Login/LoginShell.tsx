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
import { LoginProp, LoginPayload, LoginSchema } from "./login.utils";
import { useAuthForm } from "../use-auth-form";

const LOGIN_FIELDS = ["username", "password"] as const;

export default function LoginShell({ loginAction, defaultParams }: LoginProp) {
  const { control, errors, submit, isPending, isLocked } =
    useAuthForm<LoginPayload>({
      schema: LoginSchema,
      defaultValues: defaultParams,
      fields: LOGIN_FIELDS,
      action: loginAction,
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
              placeholder="Enter your username"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              aria-invalid={!!errors.username}
              accessibilityLabel="Username"
            />
          )}
        />

        <FieldError message={errors.username?.message} />
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
              placeholder="Enter your password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
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
          <Text>Sign in</Text>
        )}
      </Button>
    </View>
  );
}
