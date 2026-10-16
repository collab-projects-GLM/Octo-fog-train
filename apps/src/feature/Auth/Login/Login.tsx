import { View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SECURE_KEYS } from "@/lib/secure-store";
import { LoginDefaults, LoginPayload, LoginResponse } from "./login.utils";
import LoginShell from "./LoginShell";
import { useLogin } from "./use-login";

async function onLoginSuccess(data: LoginResponse) {
  const { access, refresh } = data;

  console.log("Login response:", JSON.stringify(data, null, 2));
  console.log("access:", access);
  console.log("refresh:", refresh);

  await Promise.all([
    SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, access),
    SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, refresh),
  ]);
}

export default function Login() {
  const { mutateAsync } = useLogin({ onSuccess: onLoginSuccess });

  async function onLogin(payload: LoginPayload) {
    await mutateAsync(payload);
  }

  return (
    <View>
      <LoginShell loginAction={onLogin} defaultParams={LoginDefaults} />
    </View>
  );
}
