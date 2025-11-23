import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI } from '@/lib/api';
import { useRouter } from 'expo-router';
import { QrCode, CheckCircle, XCircle, Camera } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function BarcodeAttendanceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [facing, setFacing] = useState<'back'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [scannedBarcodes, setScannedBarcodes] = useState<Set<string>>(new Set());

  const handleBarcodeScan = async (barcode: string) => {
    
    if (!barcode || scanning || scannedBarcodes.has(barcode)) {
      return;
    }

    
    setScannedBarcodes(prev => new Set(prev).add(barcode));
    setScanning(true);
    setStatus('idle');

    try {
      if (!user) {
        throw new Error('المستخدم غير مسجل دخول');
      }

      console.log('Scanning barcode:', barcode);
      console.log('User:', user);
      
      const response = await attendanceAPI.barcodeAttendance(barcode);

      console.log('Barcode attendance response:', response);

      if (response.success) {
        setStatus('success');
        
        setShowCamera(false);
        Alert.alert('تم الحضور', response.message || 'تم تسجيل حضورك بنجاح عن طريق الباركود', [
          { text: 'حسناً', onPress: () => router.back() },
        ]);
      } else {
        throw new Error(response.message || 'فشل تسجيل الحضور');
      }
    } catch (error: any) {
      console.error('Error recording attendance:', error);
      setStatus('error');
      
      
      setScannedBarcodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(barcode);
        return newSet;
      });

      
      setShowCamera(false);

      const errorMessage = error.message || 'حدث خطأ أثناء تسجيل الحضور';
      Alert.alert('خطأ', errorMessage, [
        { text: 'حسناً', onPress: () => setStatus('idle') },
      ]);
    } finally {
      setScanning(false);
    }
  };

  const handleManualInput = () => {
    if (!barcodeInput.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال الباركود');
      return;
    }
    handleBarcodeScan(barcodeInput.trim());
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    
    if (!scanning && data && data.trim()) {
      handleBarcodeScan(data.trim());
    }
  };

  useEffect(() => {
    if (showCamera && !permission?.granted) {
      requestPermission();
    }
  }, [showCamera, permission]);

  if (showCamera) {
    if (!permission) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>جاري طلب صلاحية الكاميرا...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>يجب السماح بالوصول إلى الكاميرا</Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={requestPermission}
          >
            <Text style={styles.scanButtonText}>طلب الصلاحية</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.alternativeText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'codabar'],
          }}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerText}>
              ضع الباركود داخل الإطار
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowCamera(false);
                setStatus('idle');
                setScannedBarcodes(new Set()); 
              }}
            >
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تسجيل الحضور بالباركود</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.barcodeIcon}>
          {status === 'idle' && <QrCode size={80} color="#1e40af" />}
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
            : 'مسح الباركود'}
        </Text>

        <Text style={styles.description}>
          {scanning
            ? 'يرجى الانتظار'
            : status === 'idle'
            ? 'امسح الباركود الموجود في القاعة لتسجيل حضورك'
            : ''}
        </Text>

        {}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="أدخل الباركود يدوياً"
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.submitButton, scanning && styles.submitButtonDisabled]}
            onPress={handleManualInput}
            disabled={scanning}
          >
            <Text style={styles.submitButtonText}>تسجيل</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>أو</Text>

        <TouchableOpacity
          style={[styles.scanButton, (scanning || showCamera) && styles.scanButtonDisabled]}
          onPress={() => {
            setShowCamera(true);
            setStatus('idle');
            setScannedBarcodes(new Set()); 
          }}
          disabled={scanning || showCamera}
        >
          <Camera size={24} color="#ffffff" style={{ marginLeft: 8 }} />
          <Text style={styles.scanButtonText}>
            {showCamera ? 'الكاميرا مفتوحة' : 'مسح بالكاميرا'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.alternativeButton}
          onPress={() => router.push('/attendance/nfc')}
        >
          <Text style={styles.alternativeText}>
            استخدم NFC بدلاً من ذلك
          </Text>
        </TouchableOpacity>
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
  barcodeIcon: {
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
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  orText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
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
  alternativeButton: {
    marginTop: 16,
  },
  alternativeText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#10b981',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

