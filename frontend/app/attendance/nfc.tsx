import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI } from '@/lib/api';
import { useRouter } from 'expo-router';
import { CreditCard, CheckCircle, XCircle, QrCode } from 'lucide-react-native';

export default function NFCAttendanceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const simulateNFCScan = async () => {
    setScanning(true);
    setStatus('idle');

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (!user) {
        throw new Error('المستخدم غير مسجل دخول');
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0];

      
      const response = await attendanceAPI.create({
        date: today,
        check_in_time: now,
        nfc_card_id: `NFC_${Date.now()}`,
        status: 'present',
      });

      if (response.success) {
        setStatus('success');
        Alert.alert('تم الحضور', 'تم تسجيل حضورك بنجاح', [
          { text: 'حسناً', onPress: () => router.back() },
        ]);
      } else {
        throw new Error(response.message || 'فشل تسجيل الحضور');
      }
    } catch (error: any) {
      console.error('Error recording attendance:', error);
      setStatus('error');
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء تسجيل الحضور');
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تسجيل الحضور بـ NFC</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.nfcIcon}>
          {status === 'idle' && <CreditCard size={80} color="#1e40af" />}
          {status === 'success' && <CheckCircle size={80} color="#10b981" />}
          {status === 'error' && <XCircle size={80} color="#ef4444" />}
        </View>

        <Text style={styles.title}>
          {scanning
            ? 'جارٍ المسح...'
            : status === 'success'
            ? 'تم التسجيل بنجاح'
            : status === 'error'
            ? 'فشل التسجيل'
            : 'اقترب من قارئ NFC'}
        </Text>

        <Text style={styles.description}>
          {scanning
            ? 'يرجى الانتظار'
            : status === 'idle'
            ? 'ضع بطاقتك الجامعية بالقرب من القارئ لتسجيل حضورك'
            : ''}
        </Text>

        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
          onPress={simulateNFCScan}
          disabled={scanning}
        >
          <Text style={styles.scanButtonText}>
            {scanning ? 'جارٍ المسح...' : 'محاكاة مسح NFC'}
          </Text>
        </TouchableOpacity>

        <View style={styles.alternativeButtons}>
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => router.push('/attendance/barcode')}
          >
            <QrCode size={20} color="#7c3aed" style={{ marginLeft: 8 }} />
            <Text style={styles.alternativeText}>
              مسح الباركود
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => router.push('/attendance/face-recognition')}
          >
            <Text style={styles.alternativeText}>
              التعرف على الوجه
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  nfcIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  alternativeButtons: {
    marginTop: 24,
    gap: 12,
    width: '100%',
    alignItems: 'center',
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    minWidth: 200,
    justifyContent: 'center',
  },
  alternativeText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
});
