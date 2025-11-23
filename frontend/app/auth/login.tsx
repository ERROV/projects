import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getBiometricEnabled, getLastEmail } from '@/lib/storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { BookOpen, Camera, Fingerprint } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

/**
 * صفحة تسجيل الدخول
 * تتيح للمستخدم تسجيل الدخول باستخدام:
 * - البريد الإلكتروني وكلمة المرور
 * - البصمة الحيوية (Fingerprint/Face ID)
 * - التعرف على الوجه
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const router = useRouter();
  const { signIn, biometricLogin, isBiometricEnabled } = useAuth();
  const { t, language } = useLanguage();

  /**
   * التحقق من توفر البصمة الحيوية
   */
  useEffect(() => {
    checkBiometricAvailability();
    loadSavedEmail();
    checkBiometricStatus();
  }, []);

  /**
   * تحميل آخر بريد إلكتروني محفوظ
   */
  const loadSavedEmail = async () => {
    try {
      const savedEmail = await getLastEmail();
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch (error) {
      console.error('Error loading saved email:', error);
    }
  };

  /**
   * التحقق من حالة البصمة الحيوية
   */
  const checkBiometricStatus = async () => {
    try {
      const enabled = await getBiometricEnabled();
      setBiometricEnabled(enabled);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  /**
   * فحص توفر البصمة الحيوية على الجهاز
   */
  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setBiometricAvailable(false);
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setBiometricAvailable(false);
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBiometricAvailable(true);
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.error('Error checking biometric:', error);
      setBiometricAvailable(false);
    }
  };

  /**
   * معالجة تسجيل الدخول
   */
  const handleLogin = async () => {
    if (!email || !password) {
      setError(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  /**
   * معالجة تسجيل الدخول بالبصمة الحيوية
   */
  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // التحقق من وجود بريد إلكتروني محفوظ
      const savedEmail = await getLastEmail();
      if (!savedEmail) {
        setError(language === 'ar' 
          ? 'لا يوجد بريد إلكتروني محفوظ. يرجى تسجيل الدخول بالطريقة العادية أولاً'
          : 'No saved email found. Please login normally first');
        setLoading(false);
        return;
      }

      // التحقق من تفعيل البصمة الحيوية
      const enabled = await getBiometricEnabled();
      if (!enabled) {
        setError(language === 'ar' 
          ? 'البصمة الحيوية غير مفعلة. يرجى تفعيلها من الإعدادات'
          : 'Biometric authentication is not enabled. Please enable it from settings');
        setLoading(false);
        return;
      }

      // التحقق من البصمة الحيوية
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: Platform.OS === 'ios' 
          ? (biometricType === 'Face ID' 
              ? (language === 'ar' ? 'سجل الدخول باستخدام Face ID' : 'Login with Face ID')
              : (language === 'ar' ? 'سجل الدخول باستخدام Touch ID' : 'Login with Touch ID'))
          : (language === 'ar' ? 'سجل الدخول باستخدام بصمة الإصبع' : 'Login with Fingerprint'),
        cancelLabel: t('common.cancel'),
        disableDeviceFallback: false,
        fallbackLabel: language === 'ar' ? 'استخدم كلمة المرور' : 'Use Password',
      });

      if (result.success) {
        // تسجيل الدخول باستخدام البصمة الحيوية
        try {
          await biometricLogin();
          router.replace('/(tabs)');
        } catch (loginError: any) {
          setError(loginError.message || 'فشل تسجيل الدخول');
        }
      } else {
        if (result.error === 'user_cancel') {
          // لا نعرض خطأ إذا ألغى المستخدم العملية
          setError('');
        } else if (result.error === 'user_fallback') {
          // المستخدم اختار استخدام كلمة المرور
          setError('');
        } else {
          setError(language === 'ar' ? 'فشل التحقق من البصمة الحيوية' : 'Biometric authentication failed');
        }
      }
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'فشل استخدام البصمة الحيوية' : 'Failed to use biometric'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * معالجة تسجيل الدخول بالتعرف على الوجه
   */
  const handleFaceLogin = () => {
    router.push('/auth/face-login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <BookOpen size={60} color="#1e40af" />
          <Text style={styles.title}>
            {language === 'ar' ? 'مرحباً بك' : 'Welcome'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'ar' ? 'سجل الدخول للوصول إلى حسابك' : 'Sign in to access your account'}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? t('common.loading') : t('auth.login')}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>
              {language === 'ar' ? 'أو' : 'OR'}
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* البصمة الحيوية */}
          {biometricAvailable && biometricEnabled && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={loading}
            >
              <Fingerprint size={20} color="#10b981" />
              <Text style={styles.biometricText}>
                {language === 'ar' 
                  ? `تسجيل الدخول بـ ${biometricType}`
                  : `Login with ${biometricType}`}
              </Text>
            </TouchableOpacity>
          )}

          {/* التعرف على الوجه */}
          <TouchableOpacity
            style={styles.faceLoginButton}
            onPress={handleFaceLogin}
            disabled={loading}
          >
            <Camera size={20} color="#1e40af" />
            <Text style={styles.faceLoginText}>
              {language === 'ar' ? 'تسجيل الدخول بالوجه' : 'Face Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerText}>
              {t('auth.dontHaveAccount')} <Text style={styles.registerLinkText}>{t('auth.signUp')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'right',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'right',
  },
  loginButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#64748b',
    fontSize: 14,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  biometricText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  faceLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  faceLoginText: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#64748b',
  },
  registerLinkText: {
    color: '#1e40af',
    fontWeight: '600',
  },
});
