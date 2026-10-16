import { View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SECURE_KEYS } from "@/lib/secure-store";
import {
  RegisterDefaults,
  RegisterPayload,
  RegisterResponse,
} from "./register.utils";
import RegisterShell from "./RegisterShell";
import { useRegister } from "./use-register";

async function onRegisterSuccess(data: RegisterResponse) {
  const { username, email } = data;

  console.log("Register response:", JSON.stringify(data, null, 2));
  console.log("username:", username);
  console.log("email:", email);

  await Promise.all([
    SecureStore.setItemAsync(SECURE_KEYS.USERNAME, username),
    SecureStore.setItemAsync(SECURE_KEYS.EMAIL, email),
  ]);
}

export default function Register() {
  const { mutateAsync } = useRegister({ onSuccess: onRegisterSuccess });

  async function onRegister(payload: RegisterPayload) {
    await mutateAsync(payload);
  }

  return (
    <View>
      <RegisterShell
        registerAction={onRegister}
        defaultParams={RegisterDefaults}
      />
    </View>
  );
}
