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
    if (percent >= 80) return '#88c9a0';      // muted green (copper complementary)
    if (percent >= 50) return '#D9A066';      // copper/gold
    return 'rgba(217,160,102,0.6)';           // lighter copper
  };

  const getLabel = () => {
    if (percent >= 80) return 'Excellent profil';
    if (percent >= 50) return 'Bon profil';
    return 'Complétez votre profil';
  };

  const getHint = () => {
    if (percent < 50) return 'Ajoutez vos intérêts et votre bio';
    if (percent < 80) return 'Ajoutez plus de détails';
    return 'Presque parfait !';
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
        <Text style={styles.hint}>{getHint()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  percent: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  hint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});