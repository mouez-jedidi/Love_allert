import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';

export default function TermsScreen({ navigation, route }) {
  const { onAccept } = route.params || {};

  const handleAccept = () => {
    if (onAccept) onAccept();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Conditions d'utilisation</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        <Text style={styles.lastUpdate}>Dernière mise à jour : Mars 2026</Text>

        {[
          {
            title: '1. Acceptation des conditions',
            text: 'En utilisant Love Alert, vous acceptez les présentes conditions d\'utilisation. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser l\'application.',
          },
          {
            title: '2. Éligibilité',
            text: 'Vous devez avoir au moins 18 ans pour utiliser Love Alert. En créant un compte, vous confirmez que vous avez l\'âge requis.',
          },
          {
            title: '3. Géolocalisation',
            text: 'Love Alert utilise votre position GPS pour détecter les utilisateurs compatibles à proximité. Votre position exacte n\'est jamais partagée avec d\'autres utilisateurs. Seule une distance approximative est affichée.',
          },
          {
            title: '4. Authenticité du profil',
            text: 'Vous devez utiliser votre vraie identité et une photo récente prise via la caméra de l\'application. Les faux profils sont strictement interdits et entraîneront la suppression immédiate du compte.',
          },
          {
            title: '5. Confidentialité',
            text: 'Vos données personnelles sont protégées conformément à notre politique de confidentialité. Nous ne vendons jamais vos données à des tiers.',
          },
          {
            title: '6. Comportement des utilisateurs',
            text: 'Tout comportement inapproprié, harcèlement ou contenu offensant est strictement interdit. Les utilisateurs peuvent signaler tout comportement abusif.',
          },
          {
            title: '7. Système de confiance',
            text: 'Le système de jauge de confiance est conçu pour encourager des interactions authentiques. Toute tentative de manipulation du système est interdite.',
          },
          {
            title: '8. Suppression de compte',
            text: 'Vous pouvez supprimer votre compte à tout moment. Toutes vos données seront supprimées définitivement dans un délai de 30 jours.',
          },
          {
            title: '9. Modifications',
            text: 'Love Alert se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront notifiés de tout changement majeur.',
          },
          {
            title: '10. Contact',
            text: 'Pour toute question concernant ces conditions, contactez-nous à : support@lovealert.app',
          },
        ].map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionText}>{section.text}</Text>
          </View>
        ))}

      </ScrollView>

      {/* Accept button */}
      {onAccept && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
            <Text style={styles.acceptBtnText}>✓ J'accepte les conditions</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { color: 'rgba(255,255,255,0.4)', fontSize: 14, width: 60 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },

  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },

  lastUpdate: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12, marginBottom: 24,
    textAlign: 'center',
  },

  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    color: '#FF3366', fontSize: 14,
    fontWeight: '700', marginBottom: 8,
  },
  sectionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13, lineHeight: 20,
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  acceptBtn: {
    backgroundColor: '#FF3366',
    padding: 16, borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
  },
  acceptBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});