import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Camera, CheckCircle } from 'lucide-react-native';

export default function FaceRecognitionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>جارٍ التحميل...</Text>
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
            نحتاج إلى إذن الوصول إلى الكاميرا لتسجيل الحضور عبر التعرف على الوجه
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

  const simulateFaceRecognition = async () => {
    if (processing) return;

    setProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!student) {
        throw new Error('Student not found');
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student.id)
        .eq('date', today)
        .maybeSingle();

      if (existingAttendance && !existingAttendance.check_out_time) {
        const { error } = await supabase
          .from('attendance')
          .update({ check_out_time: new Date().toISOString() })
          .eq('id', existingAttendance.id);

        if (error) throw error;

        Alert.alert('تم الانصراف', 'تم تسجيل وقت الانصراف بنجاح', [
          { text: 'حسناً', onPress: () => router.back() },
        ]);
      } else {
        const { error } = await supabase.from('attendance').insert({
          student_id: student.id,
          date: today,
          check_in_time: new Date().toISOString(),
          status: 'present',
        });

        if (error) throw error;

        Alert.alert('تم الحضور', 'تم تسجيل حضورك بنجاح', [
          { text: 'حسناً', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error('Error recording attendance:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء تسجيل الحضور');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Text style={styles.headerBackButtonText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التعرف على الوجه</Text>
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
            style={styles.camera}
            facing="front"
            onCameraReady={() => setIsCameraReady(true)}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.faceFrame} />
              <Text style={styles.cameraText}>
                ضع وجهك داخل الإطار
              </Text>
            </View>
          </CameraView>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.captureButton, processing && styles.captureButtonDisabled]}
          onPress={simulateFaceRecognition}
          disabled={processing || !isCameraReady}
        >
          {processing ? (
            <Text style={styles.captureButtonText}>جارٍ المعالجة...</Text>
          ) : (
            <>
              <CheckCircle size={24} color="#ffffff" />
              <Text style={styles.captureButtonText}>تسجيل الحضور</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.alternativeButton}
          onPress={() => router.push('/attendance/nfc')}
        >
          <Text style={styles.alternativeText}>
            استخدم بطاقة NFC بدلاً من ذلك
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
  },
  headerBackButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
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
