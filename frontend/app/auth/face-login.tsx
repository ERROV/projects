import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Camera, X, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';


export default function FaceLoginScreen() {
  const router = useRouter();
  const { faceLogin } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  
  const handleFaceRecognition = async () => {
    if (processing || !isCameraReady || !cameraRef.current) return;

    setProcessing(true);

    try {
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo) {
        throw new Error('فشل التقاط الصورة');
      }

      
      await faceLogin({
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'face.jpg',
      });

      
      Alert.alert(
        'تم التعرف على الوجه',
        'مرحباً بعودتك! تم تسجيل الدخول بنجاح',
        [
          {
            text: 'متابعة',
            onPress: () => {
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Face recognition error:', error);
      Alert.alert(
        'فشل التعرف',
        error.message || 'لم يتم التعرف على وجهك. يرجى المحاولة مرة أخرى أو استخدام البريد الإلكتروني وكلمة المرور',
        [
          { text: 'إلغاء', style: 'cancel', onPress: () => router.back() },
          { text: 'إعادة المحاولة', onPress: () => setProcessing(false) },
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>جارٍ التحميل...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={60} color="#64748b" />
          <Text style={styles.permissionTitle}>إذن الكاميرا مطلوب</Text>
          <Text style={styles.permissionText}>
            نحتاج إلى إذن الوصول إلى الكاميرا لتسجيل الدخول عبر التعرف على الوجه
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>منح الإذن</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <X size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تسجيل الدخول بالوجه</Text>
      </View>

      <View style={styles.cameraContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webCameraPlaceholder}>
            <Camera size={80} color="#64748b" />
            <Text style={styles.webCameraText}>
              الكاميرا غير متاحة على الويب
            </Text>
            <Text style={styles.webCameraSubtext}>
              يرجى استخدام التطبيق على الجوال للتعرف على الوجه
            </Text>
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
            onCameraReady={() => setIsCameraReady(true)}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.faceFrame} />
              <Text style={styles.cameraText}>
                {processing ? 'جارٍ التعرف على وجهك...' : 'ضع وجهك داخل الإطار'}
              </Text>
              {processing && (
                <ActivityIndicator size="large" color="#10b981" style={styles.processingIndicator} />
              )}
            </View>
          </CameraView>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.captureButton,
            (processing || !isCameraReady) && styles.captureButtonDisabled,
          ]}
          onPress={handleFaceRecognition}
          disabled={processing || !isCameraReady}
        >
          {processing ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.captureButtonText}>جارٍ المعالجة...</Text>
            </>
          ) : (
            <>
              <CheckCircle size={24} color="#ffffff" />
              <Text style={styles.captureButtonText}>تسجيل الدخول</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.alternativeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.alternativeText}>
            استخدام البريد الإلكتروني وكلمة المرور
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#000000',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    marginLeft: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'right',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  backButton: {
    marginTop: 16,
  },
  backButtonText: {
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  faceFrame: {
    width: 250,
    height: 300,
    borderWidth: 3,
    borderColor: '#10b981',
    borderRadius: 150,
    backgroundColor: 'transparent',
  },
  cameraText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 24,
    textAlign: 'center',
  },
  processingIndicator: {
    marginTop: 16,
  },
  webCameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  webCameraText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
  },
  webCameraSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  controls: {
    backgroundColor: '#000000',
    padding: 24,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 250,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonText: {
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
});

