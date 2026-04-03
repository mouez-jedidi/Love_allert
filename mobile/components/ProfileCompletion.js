import { View, Text, StyleSheet } from 'react-native';

const calculateCompletion = (user) => {
  const fields = [
    { key: 'photo', weight: 20 },
    { key: 'region', weight: 10 },
    { key: 'civilStatus', weight: 5 },
    { key: 'religion', weight: 5 },
    { key: 'objective', weight: 10 },
    { key: 'bio', weight: 10 },
    { key: 'height', weight: 5 },
    { key: 'educationLevel', weight: 5 },
    { key: 'languages', weight: 5 },
  ];

  const interestsScore = user?.interests?.length >= 3 ? 15 : (user?.interests?.length * 5);
  const studyOrWork = (user?.isStudent || user?.isWorking) ? 10 : 0;

  let score = interestsScore + studyOrWork;
  fields.forEach(f => {
    const val = user?.[f.key];
    if (val && (Array.isArray(val) ? val.length > 0 : true)) {
      score += f.weight;
    }
  });

  return Math.min(score, 100);
};

export default function ProfileCompletion({ user }) {
  const percent = calculateCompletion(user);

  const getColor = () => {
    if (percent >= 80) return '#22c55e';
    if (percent >= 50) return '#eab308';
    return '#FF3366';
  };

  const getLabel = () => {
    if (percent >= 80) return 'Excellent profil 🌟';
    if (percent >= 50) return 'Bon profil 👍';
    return 'Complétez votre profil';
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{getLabel()}</Text>
        <Text style={[styles.percent, { color: getColor() }]}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: getColor() }]} />
      </View>
      {percent < 100 && (
        <Text style={styles.hint}>
          {percent < 50 ? '💡 Ajoutez vos intérêts et votre bio' :
           percent < 80 ? '💡 Ajoutez plus de détails' :
           '💡 Presque parfait !'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  percent: { fontSize: 18, fontWeight: '800' },
  track: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3, marginBottom: 8,
  },
  fill: { height: '100%', borderRadius: 3 },
  hint: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
});