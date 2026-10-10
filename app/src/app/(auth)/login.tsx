import AuthLayout from "@/feature/auth/AuthLayout";
import AuthLink from "@/feature/auth/AuthLink";
import LoginForm from "@/feature/auth/Login/LoginForm";

export default function LoginScreen() {
  return (
    <AuthLayout subtitle="Log in to continue">
      <LoginForm />
      <AuthLink prompt="New here?" label="Create an account" href="/register" />
    </AuthLayout>
  );
}
