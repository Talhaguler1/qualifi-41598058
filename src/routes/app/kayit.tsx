import { createFileRoute } from "@tanstack/react-router";
import { SignupPage } from "@/components/app/signup-page";
import { demoHead } from "@/components/demo/head";

export const Route = createFileRoute("/app/kayit")({
  head: () => demoHead("Ücretsiz hesap aç", "QualiFi'de ücretsiz hesap açın; belgelerinizi hesap açıldıktan sonra yükleyin."),
  component: SignupPage,
});
