import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌿 WildDex</Text>
      <Text style={styles.subtitle}>
        A worldwide nature encyclopedia — coming soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4FBF5",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#4B5D4F",
    textAlign: "center",
  },
});
