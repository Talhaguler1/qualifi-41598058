import { createFileRoute } from "@tanstack/react-router";
import { landingRoute } from "@/components/site/route";

export const Route = createFileRoute("/finans-ekipleri")(landingRoute("tr", "finance"));
