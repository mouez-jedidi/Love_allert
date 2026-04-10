import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Linking,
} from 'react-native';

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>À propos</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>
            LOVE<Text style={styles.logoAccent}>ALERT</Text>
          </Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>Rencontres Réelles · GPS</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>L'application</Text>
          <Text style={styles.sectionText}>
            Love Alert est une application de rencontres innovante basée sur la
            géolocalisation en temps réel. Elle connecte des personnes compatibles
            lorsqu'elles sont physiquement proches, avec un système de révélation
            progressive de l'identité et une jauge de confiance mutuelle.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonctionnalités</Text>
          {[
            'Détection GPS en temps réel',
            'Anonymat total au départ',
            'Chat sécurisé avec consentement mutuel',
            'Révélation progressive de l\'identité',
            'Jauge de confiance (90% = profil complet)',
            'Galerie privée sécurisée',
          ].map((feature, i) => (
            <Text key={i} style={styles.featureText}>— {feature}</Text>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:support@lovealert.app')}>
            <Text style={styles.contactLink}>support@lovealert.app</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Légal</Text>
          <TouchableOpacity
            style={styles.legalBtn}
            onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.legalBtnText}>Conditions d'utilisation</Text>
          </TouchableOpacity>
        </View>

        {/* Tech stack */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technologie</Text>
          <View style={styles.techGrid}>
            {[
              'React Native',
              'Node.js',
              'MongoDB',
              'Firebase',
              'Socket.io',
              'Cloudinary',
            ].map(tech => (
              <View key={tech} style={styles.techCard}>
                <Text style={styles.techName}>{tech}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.copyright}>
          © 2026 Love Alert. Tous droits réservés.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 0.5, width: 60 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },

  content: { padding: 24, paddingBottom: 40 },

  logoSection: {
    alignItems: 'center', marginBottom: 32, gap: 6,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  logoAccent: {
    fontSize: 28,
    fontWeight: '800',
    color: '#D9A066',
    letterSpacing: 8,
  },
  version: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
    letterSpacing: 0.5,
  },
  tagline: { color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 2 },

  section: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  sectionTitle: { color: '#D9A066', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  sectionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13, lineHeight: 22,
  },
  featureText: {
    color: 'rgba(255,255,255,0.5)', fontSize: 13,
    marginLeft: 8,
  },
  contactLink: {
    color: '#D9A066', fontSize: 13, fontWeight: '500',
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },
  legalBtn: {
    backgroundColor: 'rgba(217,160,102,0.08)',
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: 'rgba(217,160,102,0.2)',
    alignSelf: 'flex-start',
  },
  legalBtnText: { color: '#D9A066', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },

  techGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  techCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  techName: { color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 0.5 },

  copyright: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10, textAlign: 'center', letterSpacing: 0.5,
    marginTop: 8,
  },
});