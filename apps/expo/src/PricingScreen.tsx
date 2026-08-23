import { Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { WEB_BASE_URL } from './config';
import { useLanguage } from './i18n/LanguageProvider';
import { t as fmt } from './i18n/dictionaries';

interface Props {
  visible: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

// Sample pricing — keep in sync with backend/app/pricing.py TOKEN_PACKAGES.
const TOKEN_PACKAGES = [
  { id: 'small', tokens: 100, priceUsd: 2.99 },
  { id: 'medium', tokens: 500, priceUsd: 9.99 },
  { id: 'large', tokens: 1500, priceUsd: 19.99 },
];
const TIER1_TOKEN_COST = 10;

export default function PricingScreen({ visible, onClose, onGetStarted }: Props) {
  const { t } = useLanguage();

  function handleBuy(packageId: string) {
    // No in-app purchase flow yet — buying happens on the website, same as
    // the account/history dashboard does today.
    Linking.openURL(`${WEB_BASE_URL}/dashboard?buy=${packageId}`);
    onGetStarted();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t.pricing.title}</Text>
          <Text style={styles.subtitle}>{t.pricing.tokenIntro}</Text>

          <View style={styles.freeBanner}>
            <Text style={styles.freeBannerText}>{t.pricing.tier0FreeNote}</Text>
          </View>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 12 }}>
            {TOKEN_PACKAGES.map((pkg) => {
              const highlight = pkg.id === 'medium';
              return (
                <View key={pkg.id} style={[styles.card, highlight && styles.cardHighlight]}>
                  {highlight && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t.pricing.mostPopular}</Text>
                    </View>
                  )}
                  <Text style={styles.planName}>{fmt(t.pricing.tokensLabelTemplate, { n: pkg.tokens })}</Text>
                  <Text style={styles.planDesc}>
                    {fmt(t.pricing.analysesEquivalentTemplate, { n: Math.floor(pkg.tokens / TIER1_TOKEN_COST) })}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>${pkg.priceUsd}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.ctaButton, highlight && styles.ctaButtonHighlight]}
                    onPress={() => handleBuy(pkg.id)}
                  >
                    <Text style={[styles.ctaText, highlight && styles.ctaTextHighlight]}>{t.pricing.buyButton}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>{t.history.closeButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,17,21,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 28,
    gap: 6,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 13, color: '#777' },
  freeBanner: {
    marginTop: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  freeBannerText: { fontSize: 12.5, color: '#15803d', fontWeight: '600', lineHeight: 18 },
  card: {
    borderWidth: 1,
    borderColor: '#eef0f4',
    backgroundColor: '#f7f8fb',
    borderRadius: 18,
    padding: 18,
  },
  cardHighlight: { borderColor: '#2563eb', backgroundColor: '#eef2ff' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  badgeText: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
  planName: { fontSize: 17, fontWeight: '800', color: '#111' },
  planDesc: { fontSize: 12.5, color: '#777', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 12 },
  price: { fontSize: 28, fontWeight: '800', color: '#111' },
  ctaButton: { marginTop: 16, backgroundColor: '#e5e7eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ctaButtonHighlight: { backgroundColor: '#2563eb' },
  ctaText: { fontWeight: '700', color: '#333', fontSize: 14 },
  ctaTextHighlight: { color: '#fff' },
  closeButton: { paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  closeText: { color: '#999', fontWeight: '600', fontSize: 13 },
});
