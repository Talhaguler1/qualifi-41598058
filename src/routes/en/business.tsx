import { createFileRoute } from "@tanstack/react-router";
import { landingRoute } from "@/components/site/route";

export const Route = createFileRoute("/en/business")(landingRoute("en", "business"));
