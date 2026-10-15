import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { CATEGORY_ICONS, Expense } from '@/types/expense';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';

interface ExpenseItemProps {
  expense: Expense;
  index: number; // sirve para que cada fila entre un poquito despues de la anterior
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

// Una fila de la lista de gastos
export const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, index, onEdit, onDelete }) => {
  // Queda algo como "15 oct"
  const formattedDate = new Date(expense.date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });

  // Queda algo como "$15.50"
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(expense.amount);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.container}
    >
      <GlassCard>
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Text style={styles.icon}>{CATEGORY_ICONS[expense.category]}</Text>
              </LinearGradient>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.category}>{expense.category}</Text>
              {expense.description && (
                <Text style={styles.description} numberOfLines={1}>
                  {expense.description}
                </Text>
              )}
              {expense.invoiceUri && (
                <View style={styles.invoiceLabel}>
                  <Image source={{ uri: expense.invoiceUri }} style={styles.invoiceThumbnail} />
                  <Text style={styles.invoiceText}>Comprobante adjunto</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.rightSection}>
            <Text style={styles.amount}>{formattedAmount}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => onEdit(expense)}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel="Editar gasto"
              >
                <Text style={styles.actionIcon}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(expense)}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel="Eliminar gasto"
              >
                <Text style={styles.deleteIcon}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.two,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: Spacing.two,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: LiquidGlassColors.glassTextSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LiquidGlassColors.primary,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: LiquidGlassColors.glassTextSecondary,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.one,
    gap: Spacing.one,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  actionIcon: {
    color: LiquidGlassColors.glassText,
    fontSize: 19,
  },
  deleteIcon: {
    color: LiquidGlassColors.secondary,
    fontSize: 24,
    lineHeight: 26,
  },
  invoiceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
    gap: Spacing.one,
  },
  invoiceThumbnail: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  invoiceText: {
    color: LiquidGlassColors.glassTextSecondary,
    fontSize: 11,
  },
});
