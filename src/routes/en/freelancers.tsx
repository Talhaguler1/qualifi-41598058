import { createFileRoute } from "@tanstack/react-router";
import { landingRoute } from "@/components/site/route";

export const Route = createFileRoute("/en/freelancers")(landingRoute("en", "freelancer"));
