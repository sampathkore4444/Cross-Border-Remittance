import React, { useState, useEffect } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@constants/colors';
import { accessibleImage } from '@utils/accessibility';

const CACHE_PREFIX = '@img_cache:';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

async function getCachedUri(remoteUri: string): Promise<string | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + remoteUri);
    if (cached) {
      const { uri, expires } = JSON.parse(cached);
      if (Date.now() < expires) return uri;
    }
  } catch {}
  return null;
}

async function cacheUri(remoteUri: string, localUri: string) {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + remoteUri,
      JSON.stringify({ uri: localUri, expires: Date.now() + CACHE_DURATION })
    );
  } catch {}
}

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  placeholderColor?: string;
  accessibilityLabel: string;
}

export function CachedImage({ uri, placeholderColor = Colors.border, accessibilityLabel, style, ...rest }: CachedImageProps) {
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCachedUri(uri).then((cached) => {
      if (!mounted) return;
      if (cached) {
        setSourceUri(cached);
        setLoading(false);
      } else {
        Image.getSize(
          uri,
          (width, height) => {
            if (!mounted) return;
            setSourceUri(uri);
            setLoading(false);
            cacheUri(uri, uri);
          },
          () => {
            if (!mounted) return;
            setSourceUri(uri);
            setLoading(false);
          }
        );
      }
    });
    return () => { mounted = false; };
  }, [uri]);

  if (loading && !sourceUri) {
    return (
      <View style={[styles.placeholder, { backgroundColor: placeholderColor }, style as any]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: sourceUri || uri }}
      style={style}
      {...accessibleImage(accessibilityLabel)}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
