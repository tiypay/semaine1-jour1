import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAnonymousAuth } from './src/hooks/useAnonymousAuth';
import { MapScreen } from './src/screens/MapScreen';

export default function App() {
  const { user, initializing, error } = useAnonymousAuth();

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Connexion impossible : {error}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <MapScreen uid={user.uid} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center', color: '#D7263D' },
});
