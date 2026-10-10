import AuthLayout from "@/feature/auth/AuthLayout";
import AuthLink from "@/feature/auth/AuthLink";
import RegisterForm from "@/feature/auth/Register/RegisterForm";

export default function RegisterScreen() {
  return (
    <AuthLayout subtitle="Create your account">
      <RegisterForm />
      <AuthLink prompt="Already have an account?" label="Log in" href="/login" />
    </AuthLayout>
  );
}
