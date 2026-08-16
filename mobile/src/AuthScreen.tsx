import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { login, Session, signup } from './auth';
import { useLanguage } from './i18n/LanguageProvider';

interface Props {
  visible: boolean;
  initialMode: 'signup' | 'login';
  onClose: () => void;
  onAuthed: (session: Session) => void;
}

export default function AuthScreen({ visible, initialMode, onClose, onAuthed }: Props) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) setMode(initialMode);
  }, [visible, initialMode]);

  function reset() {
    setEmail('');
    setPassword('');
    setError(null);
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const session = mode === 'signup' ? await signup(email, password) : await login(email, password);
      reset();
      onAuthed(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{mode === 'signup' ? t.auth.signupTitle : t.auth.loginTitle}</Text>
          <Text style={styles.subtitle}>{mode === 'signup' ? t.auth.signupSubtitle : t.auth.loginSubtitle}</Text>

          <View style={styles.fields}>
            <TextInput
              style={styles.input}
              placeholder={t.auth.emailPlaceholder}
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{mode === 'signup' ? t.auth.signupButton : t.auth.loginButton}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setMode(mode === 'signup' ? 'login' : 'signup');
              setError(null);
            }}
          >
            <Text style={styles.switchText}>{mode === 'signup' ? t.auth.switchToLogin : t.auth.switchToSignup}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeText}>{t.review.cancelButton}</Text>
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
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 13, color: '#777' },
  fields: { gap: 10, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f7f8fb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: { color: '#dc2626', fontSize: 12.5, marginTop: 4 },
  submitButton: {
    marginTop: 10,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  switchButton: { paddingVertical: 10, alignItems: 'center' },
  switchText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  closeButton: { paddingVertical: 6, alignItems: 'center' },
  closeText: { color: '#999', fontWeight: '600', fontSize: 13 },
});
