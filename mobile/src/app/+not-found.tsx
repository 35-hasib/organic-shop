import { router } from "expo-router";
import { EmptyState, Screen } from "../components/ui";

export default function NotFoundScreen() {
  return (
    <Screen>
      <EmptyState
        title="Page not found"
        text="The page you are looking for does not exist."
        action="Back to shop"
        onAction={() => router.replace("/(tabs)/shop")}
        icon="compass-outline"
      />
    </Screen>
  );
}
