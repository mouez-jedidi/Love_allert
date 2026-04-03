import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export default function NoInternetScreen({ onRetry }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.title}>Pas de connexion</Text>
      <Text style={styles.sub}>
        Vérifiez votre connexion internet et réessayez.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={onRetry}>
        <Text style={styles.btnText}>🔄 Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0d0a12',
    alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 16,
  },
  icon: { fontSize: 64 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  sub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14, textAlign: 'center', lineHeight: 22,
  },
  btn: {
    backgroundColor: '#FF3366',
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14, marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});