import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Accueil', screen: 'Home' },
  { icon: '💬', label: 'Chats', screen: 'ChatList' },
  { icon: '👤', label: 'Profil', screen: 'MyProfile' },
];

export default function BottomNav({ navigation, active }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnread();
  }, []);

  const loadUnread = async () => {
    try {
      const count = await AsyncStorage.getItem('unreadMessages');
      setUnreadCount(parseInt(count || '0'));
    } catch { }
  };

  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map(item => (
        <TouchableOpacity
          key={item.label}
          style={styles.navItem}
          onPress={() => navigation.navigate(item.screen)}>
          <View style={styles.iconWrap}>
            <Text style={styles.navIcon}>{item.icon}</Text>
            {item.screen === 'ChatList' && unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.navLabel,
            active === item.screen && styles.navLabelActive,
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 70, flexDirection: 'row',
    backgroundColor: 'rgba(13,10,18,0.97)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'space-around',
    paddingBottom: 8,
  },
  navItem: { alignItems: 'center', gap: 3 },
  iconWrap: { position: 'relative' },
  navIcon: { fontSize: 22 },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#FF3366',
    borderRadius: 10, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: 'rgba(13,10,18,0.97)',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  navLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '500',
  },
  navLabelActive: { color: '#FF3366' },
});