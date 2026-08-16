import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useLanguage } from './i18n/LanguageProvider';

interface Props {
  visible: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

export default function PricingScreen({ visible, onClose, onGetStarted }: Props) {
  const { t } = useLanguage();
  const plans = [
    {
      key: 'free',
      name: t.pricing.freeName,
      price: '$0',
      period: '',
      desc: t.pricing.freeDesc,
      features: t.pricing.freeFeatures,
      cta: t.pricing.freeCta,
      highlight: false,
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '$4.99',
      period: t.pricing.perMonth,
      desc: t.pricing.proDesc,
      features: t.pricing.proFeatures,
      cta: t.pricing.proCta,
      highlight: true,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t.pricing.title}</Text>
          <Text style={styles.subtitle}>{t.pricing.betaNote}</Text>

          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 12 }}>
            {plans.map((plan) => (
              <View key={plan.key} style={[styles.card, plan.highlight && styles.cardHighlight]}>
                {plan.highlight && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t.pricing.mostPopular}</Text>
                  </View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDesc}>{plan.desc}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.period}>{plan.period}</Text>
                </View>
                <View style={styles.featureList}>
                  {plan.features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Text style={styles.featureCheck}>✓</Text>
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.ctaButton, plan.highlight && styles.ctaButtonHighlight]}
                  onPress={onGetStarted}
                >
                  <Text style={[styles.ctaText, plan.highlight && styles.ctaTextHighlight]}>{plan.cta}</Text>
                </TouchableOpacity>
              </View>
            ))}
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
  period: { fontSize: 13, color: '#777', fontWeight: '600' },
  featureList: { marginTop: 12, gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  featureCheck: { color: '#16a34a', fontWeight: '800', fontSize: 13 },
  featureText: { fontSize: 13, color: '#333', flex: 1 },
  ctaButton: { marginTop: 16, backgroundColor: '#e5e7eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ctaButtonHighlight: { backgroundColor: '#2563eb' },
  ctaText: { fontWeight: '700', color: '#333', fontSize: 14 },
  ctaTextHighlight: { color: '#fff' },
  closeButton: { paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  closeText: { color: '#999', fontWeight: '600', fontSize: 13 },
});
