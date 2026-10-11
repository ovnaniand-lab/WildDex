/** Redirects into the tab navigator; onboarding gate lives in (onboarding). */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
