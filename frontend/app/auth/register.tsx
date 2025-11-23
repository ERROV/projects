import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserPlus, Fingerprint } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import api from '@/lib/api';

interface Department {
  _id: string;
  name: string;
  code: string;
}

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    student_number: '',
    phone: '',
    department_id: '',
    department: '',
    year_level: '1',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const { signUp } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  /**
   * تحميل البيانات الأولية
   */
  useEffect(() => {
    checkBiometricAvailability();
    loadDepartments();
  }, []);

  /**
   * تحميل قائمة الأقسام من API
   */
  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await api.departments.getAll();
      if (response.success && response.data) {
        setDepartments(response.data);
      } else {
        setError('فشل تحميل قائمة الأقسام');
      }
    } catch (err: any) {
      console.error('Error loading departments:', err);
      setError('فشل تحميل قائمة الأقسام');
    } finally {
      setLoadingDepartments(false);
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

  const handleRegister = async () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.full_name ||
      !formData.student_number ||
      !formData.department_id
    ) {
      setError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(language === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // إذا كان المستخدم يريد تفعيل البصمة الحيوية، نتحقق منها أولاً
      let shouldEnableBiometric = enableBiometric;
      if (enableBiometric && biometricAvailable) {
        try {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: Platform.OS === 'ios' 
              ? (biometricType === 'Face ID' ? 'تفعيل Face ID' : 'تفعيل Touch ID')
              : 'تفعيل بصمة الإصبع',
            cancelLabel: 'إلغاء',
            disableDeviceFallback: false,
            fallbackLabel: 'تخطي',
          });

          if (!result.success) {
            // إذا فشل التحقق، نعطل تفعيل البصمة الحيوية
            shouldEnableBiometric = false;
            if (result.error !== 'user_cancel') {
              Alert.alert(
                language === 'ar' ? 'تنبيه' : 'Warning',
                language === 'ar' 
                  ? 'فشل التحقق من البصمة الحيوية. سيتم إنشاء الحساب بدون تفعيل البصمة.'
                  : 'Biometric verification failed. Account will be created without biometric enabled.',
                [{ text: t('common.confirm') }]
              );
            }
          }
        } catch (biometricError) {
          console.error('Biometric verification error:', biometricError);
          shouldEnableBiometric = false;
        }
      }

      // التأكد من وجود department_id و department
      if (!formData.department_id || !formData.department) {
        setError(language === 'ar' ? 'يرجى اختيار قسم صحيح' : 'Please select a valid department');
        setLoading(false);
        return;
      }

      await signUp(formData.email, formData.password, {
        full_name: formData.full_name,
        student_number: formData.student_number,
        phone: formData.phone || undefined,
        department_id: formData.department_id,
        department: formData.department,
        year_level: parseInt(formData.year_level),
      }, shouldEnableBiometric);
      
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || (language === 'ar' ? 'خطأ في التسجيل' : 'Registration error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <UserPlus size={50} color="#1e40af" />
          <Text style={styles.title}>
            {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'ar' ? 'انضم إلى مكتبة كلية الحكمة' : 'Join Al Hikma University Library'}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.fullName')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.studentNumber')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.student_number}
              onChangeText={(text) => setFormData({ ...formData, student_number: text })}
              placeholder={language === 'ar' ? 'مثال: 2024001' : 'Example: 2024001'}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.email')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="student@alhikmah.edu"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.phone')}</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              placeholder="+964 xxx xxx xxxx"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.department')} *</Text>
            {loadingDepartments ? (
              <View style={styles.pickerContainer}>
                <Text style={styles.loadingText}>
                  {language === 'ar' ? 'جاري تحميل الأقسام...' : 'Loading departments...'}
                </Text>
              </View>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.department_id}
                  onValueChange={(itemValue, itemIndex) => {
                    const selectedDept = departments.find(d => d._id === itemValue);
                    setFormData({
                      ...formData,
                      department_id: itemValue as string,
                      department: selectedDept?.name || '',
                    });
                  }}
                  style={styles.picker}
                  dropdownIconColor="#64748b"
                >
                  <Picker.Item label={t('auth.selectDepartment')} value="" color="#9ca3af" />
                  {departments.map((dept) => (
                    <Picker.Item
                      key={dept._id}
                      label={dept.name}
                      value={dept._id}
                      color="#1e293b"
                    />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.yearLevel')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.year_level}
              onChangeText={(text) => setFormData({ ...formData, year_level: text })}
              keyboardType="number-pad"
              placeholder="1-4"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.password')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              placeholder={language === 'ar' ? '6 أحرف على الأقل' : 'At least 6 characters'}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.confirmPassword')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry
              placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* خيار تفعيل البصمة الحيوية */}
          {biometricAvailable && (
            <View style={styles.biometricContainer}>
              <View style={styles.biometricRow}>
                <Fingerprint size={20} color="#10b981" />
                <View style={styles.biometricTextContainer}>
                  <Text style={styles.biometricLabel}>
                    {language === 'ar' ? `تفعيل ${biometricType}` : `Enable ${biometricType}`}
                  </Text>
                  <Text style={styles.biometricDescription}>
                    {language === 'ar' 
                      ? `استخدم ${biometricType} لتسجيل الدخول بسهولة`
                      : `Use ${biometricType} to login easily`}
                  </Text>
                </View>
                <Switch
                  value={enableBiometric}
                  onValueChange={setEnableBiometric}
                  trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                  thumbColor={enableBiometric ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading 
                ? (language === 'ar' ? 'جارٍ التسجيل...' : 'Registering...')
                : (language === 'ar' ? 'إنشاء الحساب' : 'Create Account')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>
              {t('auth.haveAccount')} <Text style={styles.linkTextBold}>{t('auth.signIn')}</Text>
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
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#1e40af',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#64748b',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#1e40af',
    fontWeight: '600',
  },
  biometricContainer: {
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  biometricTextContainer: {
    flex: 1,
  },
  biometricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'right',
  },
  biometricDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#1e293b',
  },
  loadingText: {
    padding: 12,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
  },
});
