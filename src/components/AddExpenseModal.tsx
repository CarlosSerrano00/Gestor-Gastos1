import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/ExpenseContext';
import { CATEGORIES, Category, CATEGORY_ICONS, Expense } from '@/types/expense';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  expense?: Expense | null;
}

// Modal que sube desde abajo para registrar un gasto.
// Para poder agregarlo hacen falta el monto y la categoria; la descripcion es opcional.
export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  expense,
}) => {
  const { addExpense, updateExpense } = useExpenses();
  // El monto es string porque asi trabaja el TextInput; se pasa a numero al guardar
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [category, setCategory] = useState<Category | null>(expense?.category ?? null);
  const [description, setDescription] = useState(expense?.description ?? '');
  const [date, setDate] = useState(expense ? new Date(expense.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [invoiceUri, setInvoiceUri] = useState<string | undefined>(expense?.invoiceUri);

  const handleSubmit = async () => {
    if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      Alert.alert('Monto obligatorio', 'Ingresa un monto válido con máximo dos decimales.');
      return;
    }
    if (!category) {
      Alert.alert('Categoría obligatoria', 'Selecciona una categoría para guardar el gasto.');
      return;
    }

    try {
      const expenseData = {
        amount: Number(amount),
        category,
        date,
        description: description.trim() || undefined,
        invoiceUri,
      };
      if (expense) {
        await updateExpense({ ...expense, ...expenseData });
      } else {
        await addExpense(expenseData);
      }
    } catch (error) {
      // Si no se pudo guardar, se avisa y el modal queda abierto con los datos
      console.error('Error al guardar el gasto', error);
      Alert.alert('Error', 'No se pudo guardar el gasto. Intenta de nuevo.');
      return;
    }
 
    // Reset form
    setAmount('');
    setCategory(null);
    setDescription('');
    setDate(new Date());
    setInvoiceUri(undefined);
    onClose();
  };

  const handleClose = () => {
    setAmount('');
    setCategory(null);
    setDescription('');
    setDate(new Date());
    setInvoiceUri(undefined);
    setShowDatePicker(false);
    onClose();
  };

  const handleAmountChange = (value: string) => {
    const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
    const [whole, ...fractionParts] = normalized.split('.');
    const fraction = fractionParts.join('').slice(0, 2);
    const integerPart = whole || (fractionParts.length ? '0' : '');
    setAmount(fractionParts.length ? `${integerPart}.${fraction}` : integerPart);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value.replace(/[^\p{L}\p{N} ]/gu, '').slice(0, 400));
  };

  const pickInvoice = async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Permite el acceso para adjuntar una foto.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
    if (!result.canceled) setInvoiceUri(result.assets[0].uri);
  };

  const chooseInvoiceSource = () => {
    Alert.alert('Adjuntar comprobante', 'Elige de dónde obtener la foto.', [
      { text: 'Galería', onPress: () => void pickInvoice('library') },
      { text: 'Cámara', onPress: () => void pickInvoice('camera') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
        keyboardVerticalOffset={0}
      >
        {/* Tocar el fondo tambien cierra el modal */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View entering={FadeIn} style={styles.backdropBlur}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View
          entering={SlideInDown.springify()}
          style={styles.modalContent}
        >
          <View style={styles.modalBackground}>
            <BlurView intensity={100} tint="light" style={styles.modalBlur}>
              <View style={styles.handleBar} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.title}>{expense ? 'Editar gasto' : 'Agregar gasto'}</Text>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Monto (USD)</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.input}
                      value={amount}
                      onChangeText={handleAmountChange}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      placeholderTextColor={LiquidGlassColors.glassTextSecondary}
                    />
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Fecha</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.dateButtonText}>
                      {date.toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.dateButtonIcon}>▦</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      maximumDate={new Date()}
                      onChange={(_, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) setDate(selectedDate);
                      }}
                    />
                  )}
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Categoría</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesScroll}
                    contentContainerStyle={styles.categoriesContent}
                  >
                    {/* La elegida se pinta con el gradiente */}
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[
                          styles.categoryButton,
                          category === cat && styles.categoryButtonActive,
                        ]}
                      >
                        {category === cat ? (
                          <LinearGradient
                            colors={[
                              LiquidGlassColors.primary,
                              LiquidGlassColors.secondary,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.categoryGradient}
                          >
                            <Text style={styles.categoryIcon}>
                              {CATEGORY_ICONS[cat]}
                            </Text>
                            <Text style={styles.categoryTextActive}>{cat}</Text>
                          </LinearGradient>
                        ) : (
                          <>
                            <Text style={styles.categoryIcon}>
                              {CATEGORY_ICONS[cat]}
                            </Text>
                            <Text style={styles.categoryText}>{cat}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Descripción (opcional)</Text>
                  <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    value={description}
                    onChangeText={handleDescriptionChange}
                    placeholder="Ej: Almuerzo, transporte a la universidad..."
                    placeholderTextColor={LiquidGlassColors.glassTextSecondary}
                    multiline
                    maxLength={400}
                  />
                  <Text style={styles.characterCount}>{description.length}/400</Text>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Factura o comprobante (opcional)</Text>
                  <View style={styles.invoiceActions}>
                    <TouchableOpacity style={styles.invoiceButton} onPress={chooseInvoiceSource}>
                      <Text style={styles.invoiceButtonText}>＋ Adjuntar foto</Text>
                    </TouchableOpacity>
                    {invoiceUri && (
                      <TouchableOpacity
                        style={styles.removeInvoiceButton}
                        onPress={() => setInvoiceUri(undefined)}
                        accessibilityLabel="Quitar comprobante"
                      >
                        <Text style={styles.removeInvoiceText}>Quitar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {invoiceUri && <Image source={{ uri: invoiceUri }} style={styles.invoicePreview} />}
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                    ]}
                    onPress={handleSubmit}
                  >
                    <LinearGradient
                      colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitGradient}
                    >
                      <Text style={styles.submitButtonText}>{expense ? 'Guardar cambios' : 'Agregar'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </BlurView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  backdropBlur: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalBackground: {
    // Bajito a proposito: si es casi opaco no se ve el blur del fondo
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  modalBlur: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    maxHeight: '100%',
  },
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: LiquidGlassColors.glassTextSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.three,
    marginTop: Spacing.two,
    opacity: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.four,
  },
  inputSection: {
    marginBottom: Spacing.four,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  dateButtonText: {
    color: LiquidGlassColors.glassText,
    fontSize: 16,
    textTransform: 'capitalize',
  },
  dateButtonIcon: {
    color: LiquidGlassColors.primary,
    fontSize: 20,
  },
  characterCount: {
    color: LiquidGlassColors.glassTextSecondary,
    fontSize: 12,
    textAlign: 'right',
    marginTop: Spacing.one,
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  invoiceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  invoiceButtonText: {
    color: LiquidGlassColors.glassText,
    fontWeight: '600',
  },
  removeInvoiceButton: {
    padding: Spacing.two,
  },
  removeInvoiceText: {
    color: LiquidGlassColors.secondary,
    fontWeight: '600',
  },
  invoicePreview: {
    width: 88,
    height: 88,
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.two,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingHorizontal: Spacing.three,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LiquidGlassColors.primary,
    marginRight: Spacing.one,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: LiquidGlassColors.glassText,
    paddingVertical: Spacing.three,
  },
  descriptionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingHorizontal: Spacing.three,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoriesScroll: {
    marginHorizontal: -Spacing.two,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    padding: Spacing.two,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryButtonActive: {
    borderColor: 'transparent',
  },
  categoryGradient: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    width: '100%',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: Spacing.one,
  },
  categoryText: {
    fontSize: 12,
    color: LiquidGlassColors.glassText,
    textAlign: 'center',
  },
  categoryTextActive: {
    fontSize: 12,
    color: LiquidGlassColors.glassTextLight,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
  },
  submitButton: {
    flex: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: LiquidGlassColors.glassTextLight,
  },
});
