import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Accueil', screen: 'Home' },
  { icon: '💬', label: 'Chats', screen: 'ChatList' },
  { icon: '👤', label: 'Profil', screen: 'MyProfile' },
];

export default function BottomNav({ navigation, active }) {
  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map(item => (
        <TouchableOpacity
          key={item.label}
          style={styles.navItem}
          onPress={() => navigation.navigate(item.screen)}>
          <Text style={styles.navIcon}>{item.icon}</Text>
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
  navIcon: { fontSize: 22 },
  navLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '500',
  },
  navLabelActive: { color: '#FF3366' },
});