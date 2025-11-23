import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { DollarSign, Calendar, AlertCircle, CheckCircle, CreditCard } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import NotificationIcon from '@/components/NotificationIcon';

/**
 * واجهة بيانات الدفعة
 */
interface Payment {
  _id: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  semester: string;
  type?: string;
}

/**
 * واجهة الإحصائيات
 */
interface PaymentStats {
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  overdueAmount: number;
  paidInstallments: number;
  totalInstallments: number;
}

/**
 * واجهة معلومات القسم
 */
interface DepartmentInfo {
  name: string;
  code: string;
  tuition_fee: number;
}

/**
 * صفحة المنظومة المالية
 * تعرض الدفعات والإحصائيات المالية
 */
export default function TuitionScreen() {
  const { t, language } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
    overdueAmount: 0,
    paidInstallments: 0,
    totalInstallments: 0,
  });
  const [department, setDepartment] = useState<DepartmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * تحميل الدفعات من API
   */
  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await api.payments.getAll();
      
      if (response.success) {
        // استخراج البيانات والإحصائيات
        const paymentsData = (response as any).data || [];
        const statsData = (response as any).stats || {
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
          overdueAmount: 0,
          paidInstallments: 0,
          totalInstallments: 0,
        };
        const departmentData = (response as any).department || null;

        setPayments(paymentsData);
        setStats(statsData);
        setDepartment(departmentData);
      } else {
        setPayments([]);
      }
    } catch (error: any) {
      console.error('Error loading payments:', error);
      Alert.alert(t('common.error'), error.message || t('tuition.loadError'));
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * تحميل البيانات عند بدء الصفحة
   */
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  /**
   * إعادة تحميل البيانات (pull to refresh)
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  /**
   * الحصول على لون الحالة
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'partial':
        return '#f59e0b';
      case 'overdue':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  /**
   * الحصول على نص الحالة
   */
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'paid':
        return t('tuition.paidStatus');
      case 'partial':
        return t('tuition.partial');
      case 'overdue':
        return t('tuition.overdue');
      default:
        return t('tuition.pending');
    }
  };

  /**
   * الحصول على أيقونة الحالة
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} color="#10b981" />;
      case 'overdue':
        return <AlertCircle size={16} color="#dc2626" />;
      default:
        return <Calendar size={16} color="#6b7280" />;
    }
  };

  /**
   * التحقق من تأخر الدفعة
   */
  const isOverdue = (dueDate: string): boolean => {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  /**
   * معالجة الدفع
   */
  const handlePayment = (payment: Payment) => {
    Alert.alert(
      language === 'ar' ? 'دفع القسط' : 'Payment',
      language === 'ar' 
        ? `هل تريد دفع المبلغ المتبقي للفصل ${payment.semester}؟\nالمبلغ: ${formatCurrency(payment.remaining_amount)}`
        : `Do you want to pay the remaining amount for ${payment.semester}?\nAmount: ${formatCurrency(payment.remaining_amount)}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: language === 'ar' ? 'تأكيد الدفع' : 'Confirm Payment',
          style: 'default',
          onPress: () => {
            Alert.alert(
              language === 'ar' ? 'تم الدفع' : 'Payment Successful',
              language === 'ar' ? 'تم تسجيل عملية الدفع بنجاح' : 'Payment recorded successfully'
            );
            // هنا يمكن إضافة منطق الدفع الفعلي
          },
        },
      ]
    );
  };

  /**
   * تنسيق المبلغ كعملة
   */
  const formatCurrency = (amount: number): string => {
    if (language === 'ar') {
      return amount.toLocaleString('ar-IQ') + ' دينار';
    } else {
      return amount.toLocaleString('en-US') + ' IQD';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('tuition.title')}</Text>
          <NotificationIcon />
        </View>

        {/* معلومات القسم */}
        {department && (
          <View style={styles.departmentCard}>
            <View style={styles.departmentHeader}>
              <Text style={styles.departmentName}>{department.name}</Text>
              {department.code && (
                <Text style={styles.departmentCode}>{department.code}</Text>
              )}
            </View>
            <View style={styles.departmentInfo}>
              <Text style={styles.departmentLabel}>
                {language === 'ar' ? 'القسط السنوي:' : 'Annual Fee:'}
              </Text>
              <Text style={styles.departmentValue}>
                {formatCurrency(department.tuition_fee)}
              </Text>
            </View>
            <View style={styles.departmentInfo}>
              <Text style={styles.departmentLabel}>
                {language === 'ar' ? 'عدد الدفعات:' : 'Number of Installments:'}
              </Text>
              <Text style={styles.departmentValue}>
                {language === 'ar' 
                  ? `${stats.totalInstallments} دفعة (${stats.paidInstallments} مدفوعة)`
                  : `${stats.totalInstallments} installments (${stats.paidInstallments} paid)`}
              </Text>
            </View>
          </View>
        )}

        {/* البطاقة الإحصائية */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('tuition.totalAmount')}</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(stats.totalAmount)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('tuition.paid')}</Text>
              <Text style={[styles.summaryValue, styles.paidValue]}>
                {formatCurrency(stats.totalPaid)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('tuition.remaining')}</Text>
              <Text style={[styles.summaryValue, styles.remainingValue]}>
                {formatCurrency(stats.totalRemaining)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('tuition.overdue')}</Text>
              <Text style={[styles.summaryValue, styles.overdueValue]}>
                {formatCurrency(stats.overdueAmount)}
              </Text>
            </View>
          </View>

          {/* شريط التقدم */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>
                {language === 'ar' ? 'نسبة السداد: ' : 'Payment Rate: '}
                {stats.totalAmount > 0 ? Math.round((stats.totalPaid / stats.totalAmount) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${stats.totalAmount > 0 ? (stats.totalPaid / stats.totalAmount) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* تنبيه المتأخرات */}
        {stats.overdueAmount > 0 && (
          <View style={styles.overdueAlert}>
            <AlertCircle size={20} color="#dc2626" />
            <Text style={styles.overdueText}>
              {language === 'ar' 
                ? `لديك مبالغ متأخرة بقيمة ${formatCurrency(stats.overdueAmount)}`
                : `You have overdue amounts of ${formatCurrency(stats.overdueAmount)}`}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && payments.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('common.loading')}</Text>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('tuition.noPayments')}</Text>
          </View>
        ) : (
          payments.map((payment) => {
            const isOverduePayment = isOverdue(payment.due_date) && payment.status !== 'paid';
            
            return (
              <View 
                key={payment._id} 
                style={[
                  styles.paymentCard,
                  isOverduePayment && styles.overdueCard
                ]}
              >
                <View style={styles.paymentHeader}>
                  <View style={styles.semesterInfo}>
                    <View style={styles.installmentHeader}>
                      <Text style={styles.semester}>
                        {payment.semester}
                        {payment.installment_number && (
                          <Text style={styles.installmentNumber}>
                            {language === 'ar' 
                              ? ` - الدفعة ${payment.installment_number}`
                              : ` - Installment ${payment.installment_number}`}
                          </Text>
                        )}
                      </Text>
                    </View>
                    {payment.type && (
                      <Text style={styles.paymentType}>{payment.type}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(payment.status) + '20' },
                    ]}
                  >
                    {getStatusIcon(payment.status)}
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(payment.status) },
                      ]}
                    >
                      {getStatusText(payment.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentDetails}>
                  <View style={styles.amountRow}>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>{t('tuition.totalFee')}</Text>
                      <Text style={styles.amountValue}>
                        {formatCurrency(payment.amount)}
                      </Text>
                    </View>
                    
                    {payment.paid_amount > 0 && (
                      <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>{t('tuition.paid')}</Text>
                        <Text style={[styles.amountValue, styles.paidText]}>
                          {formatCurrency(payment.paid_amount)}
                        </Text>
                      </View>
                    )}

                    {payment.remaining_amount > 0 && (
                      <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>{t('tuition.remaining')}</Text>
                        <Text style={[styles.amountValue, styles.remainingText]}>
                          {formatCurrency(payment.remaining_amount)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <View style={styles.dateItem}>
                    <Calendar size={16} color="#64748b" />
                    <Text style={styles.dateLabel}>
                      {language === 'ar' ? 'استحقاق: ' : 'Due: '}
                      {new Date(payment.due_date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}
                    </Text>
                    {isOverduePayment && (
                      <AlertCircle size={14} color="#dc2626" />
                    )}
                  </View>

                  {payment.payment_date && (
                    <View style={styles.dateItem}>
                      <CheckCircle size={16} color="#10b981" />
                      <Text style={styles.dateLabel}>
                        {language === 'ar' ? 'دفع: ' : 'Paid: '}
                        {new Date(payment.payment_date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}
                      </Text>
                    </View>
                  )}
                </View>

                {payment.remaining_amount > 0 && (
                  <TouchableOpacity 
                    style={[
                      styles.payButton,
                      isOverduePayment && styles.overdueButton
                    ]}
                    onPress={() => handlePayment(payment)}
                  >
                    <CreditCard size={18} color="#ffffff" />
                    <Text style={styles.payButtonText}>
                      {isOverduePayment 
                        ? (language === 'ar' ? 'سداد المتأخرات' : 'Pay Overdue')
                        : t('tuition.payNow')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  paidValue: {
    color: '#10b981',
  },
  remainingValue: {
    color: '#f59e0b',
  },
  overdueValue: {
    color: '#dc2626',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  overdueText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  overdueCard: {
    borderWidth: 2,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  semesterInfo: {
    flex: 1,
  },
  semester: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 4,
  },
  paymentType: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  paidText: {
    color: '#10b981',
  },
  remainingText: {
    color: '#ef4444',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  overdueButton: {
    backgroundColor: '#dc2626',
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  departmentCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  departmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e40af',
    flex: 1,
    textAlign: 'right',
  },
  departmentCode: {
    fontSize: 14,
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '600',
  },
  departmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  departmentLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  departmentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
  },
  installmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  installmentNumber: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
});
