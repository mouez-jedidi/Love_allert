import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NAV_ITEMS = [
  { label: 'Accueil', screen: 'Home', symbol: '⌂' },
  { label: 'Chats', screen: 'ChatList', symbol: '⌵' },
  { label: 'Profil', screen: 'MyProfile', symbol: '◎' },
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
            <Text style={styles.navSymbol}>{item.symbol}</Text>
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: 'row',
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  navItem: { alignItems: 'center', gap: 3 },
  iconWrap: { position: 'relative' },
  navSymbol: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '300',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#D9A066',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#050505',
  },
  badgeText: {
    color: '#050505',
    fontSize: 9,
    fontWeight: '800',
  },
  navLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: '#D9A066',
    fontWeight: '700',
  },
});