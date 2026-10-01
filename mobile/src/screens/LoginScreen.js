import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';
import SaleizLogo from '../components/SaleizLogo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('marco.waiter@saleiz.com');
  const [password, setPassword] = useState('waiter123');
  const [error, setError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both staff email and password');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        showToast({ message: `Welcome back, ${res.user?.name || 'Staff'}! Shift is active.`, type: 'success' });
      } else {
        setError(res.error || 'Invalid email or password');
        showToast({
          message: res.error || 'Invalid credentials. Please verify your staff login.',
          type: 'error',
        });
      }
    } catch (err) {
      setError(err.message || 'Connection error. Please check backend.');
      showToast({
        message: err.message || 'Network error connecting to backend.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Banner */}
        <View style={styles.brandHeader}>
          <SaleizLogo size={56} showText={true} />
          <Text style={styles.welcomeTitle}>Staff Operations</Text>
          <Text style={styles.welcomeSub}>
            Sign in to start your restaurant dining shift
          </Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.formCard}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Staff Email</Text>
            <View style={styles.inputRow}>
              <Mail size={18} color={colors.onSurfaceVariant} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="waiter@saleiz.com"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color={colors.onSurfaceVariant} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.onSurfaceVariant}
                secureTextEntry
              />
            </View>
          </View>

          {/* Quick Staff Hint */}
          <View style={styles.hintRow}>
            <ShieldCheck size={14} color={colors.readyGreen} />
            <Text style={styles.hintText}>
              Pre-filled with staff demo credentials
            </Text>
          </View>

          {/* Submit CTA */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleLogin}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Start Shift & Enter</Text>
                <ArrowRight size={18} color={colors.onPrimary} strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Saleiz Restaurant POS System • Handheld Operations
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontWeight: '800',
    marginTop: 16,
  },
  welcomeSub: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
    ...layout.shadows.md,
  },
  errorBox: {
    backgroundColor: colors.errorContainer,
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: colors.onErrorContainer,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    ...typography.captionSm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
    ...layout.shadows.md,
  },
  submitBtnText: {
    ...typography.titleSm,
    color: colors.onPrimary,
    fontWeight: '800',
  },
  footerNote: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 24,
  },
});
