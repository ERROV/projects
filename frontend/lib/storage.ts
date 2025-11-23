/**
 * إدارة التخزين المحلي باستخدام AsyncStorage
 * لحفظ بيانات المستخدم والبصمة الحيوية
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// مفاتيح التخزين
const STORAGE_KEYS = {
  LAST_EMAIL: '@alhikma:last_email',
  BIOMETRIC_ENABLED: '@alhikma:biometric_enabled',
  BIOMETRIC_CREDENTIAL_ID: '@alhikma:biometric_credential_id',
};

/**
 * حفظ آخر بريد إلكتروني مستخدم
 */
export const saveLastEmail = async (email: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
  } catch (error) {
    console.error('Error saving last email:', error);
  }
};

/**
 * الحصول على آخر بريد إلكتروني مستخدم
 */
export const getLastEmail = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_EMAIL);
  } catch (error) {
    console.error('Error getting last email:', error);
    return null;
  }
};

/**
 * حفظ حالة تفعيل البصمة الحيوية
 */
export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, JSON.stringify(enabled));
  } catch (error) {
    console.error('Error saving biometric enabled:', error);
  }
};

/**
 * الحصول على حالة تفعيل البصمة الحيوية
 */
export const getBiometricEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.error('Error getting biometric enabled:', error);
    return false;
  }
};

/**
 * حفظ معرف البصمة الحيوية
 */
export const saveBiometricCredentialId = async (credentialId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL_ID, credentialId);
  } catch (error) {
    console.error('Error saving biometric credential ID:', error);
  }
};

/**
 * الحصول على معرف البصمة الحيوية
 */
export const getBiometricCredentialId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL_ID);
  } catch (error) {
    console.error('Error getting biometric credential ID:', error);
    return null;
  }
};

/**
 * حذف جميع بيانات البصمة الحيوية
 */
export const clearBiometricData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.BIOMETRIC_ENABLED,
      STORAGE_KEYS.BIOMETRIC_CREDENTIAL_ID,
    ]);
  } catch (error) {
    console.error('Error clearing biometric data:', error);
  }
};

/**
 * حذف جميع البيانات المحلية
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.LAST_EMAIL,
      STORAGE_KEYS.BIOMETRIC_ENABLED,
      STORAGE_KEYS.BIOMETRIC_CREDENTIAL_ID,
    ]);
  } catch (error) {
    console.error('Error clearing all storage:', error);
  }
};

