import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/app/login-page";
import { demoHead } from "@/components/demo/head";

export const Route = createFileRoute("/app/giris")({
  head: () => demoHead("Giriş", "QualiFi hesabınıza giriş yapın."),
  component: LoginPage,
});
