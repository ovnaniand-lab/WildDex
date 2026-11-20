import * as ImagePicker from 'expo-image-picker';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [recoveredPhoto, setRecoveredPhoto] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function recoverPhoto() {
      try {
        const result = await ImagePicker.getPendingResultAsync();

        if (
          mounted &&
          result &&
          'assets' in result &&
          !result.canceled &&
          result.assets?.[0]?.uri
        ) {
          setRecoveredPhoto(result.assets[0].uri);
        }
      } catch (error) {
        console.warn('WildDex: Camera recovery failed', error);
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    void recoverPhoto();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#356B45" />
      </View>
    );
  }

  if (recoveredPhoto) {
    return (
      <Redirect
        href={{
          pathname: '/(tabs)/identify',
          params: { recoveredPhoto },
        }}
      />
    );
  }

  return <Redirect href="/(tabs)/home" />;
}