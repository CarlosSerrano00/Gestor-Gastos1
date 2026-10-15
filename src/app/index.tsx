import { AddExpenseModal } from '@/components/AddExpenseModal';
import { ExpenseItem } from '@/components/ExpenseItem';
import { MonthlyHeader } from '@/components/MonthlyHeader';
import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/ExpenseContext';
import { Expense } from '@/types/expense';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Pantalla principal: total del mes, lista de gastos y el boton + para agregar
export default function HomeScreen() {
  const { deleteExpense, expenses, isLoading } = useExpenses();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [sortByAmount, setSortByAmount] = useState(false);
  const sortedExpenses = sortByAmount
    ? [...expenses].sort((first, second) => second.amount - first.amount)
    : [...expenses].sort((first, second) => second.date.getTime() - first.date.getTime());

  const confirmDelete = (expense: Expense) => {
    Alert.alert('Eliminar gasto', '¿Quieres eliminar este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(expense.id);
          } catch (error) {
            console.error('Error al eliminar el gasto', error);
            Alert.alert('Error', 'No se pudo eliminar el gasto. Intenta de nuevo.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FFF5F9', '#FFE8F0', '#FFF9FC']}
        style={styles.gradient}
      >
        {/* Circulos de color detras: dan algo que desenfocar a las tarjetas */}
        <View pointerEvents="none" style={[styles.orb, styles.orbPink]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbOrange]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbPurple]} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.appTitle}>Gastos Poliestudiante</Text>

            <MonthlyHeader />

            <View style={styles.sortControl}>
              <TouchableOpacity
                style={[styles.sortOption, !sortByAmount && styles.sortOptionActive]}
                onPress={() => setSortByAmount(false)}
                accessibilityRole="button"
                accessibilityState={{ selected: !sortByAmount }}
              >
                <Text style={[styles.sortText, !sortByAmount && styles.sortTextActive]}>Recientes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortOption, sortByAmount && styles.sortOptionActive]}
                onPress={() => setSortByAmount(true)}
                accessibilityRole="button"
                accessibilityState={{ selected: sortByAmount }}
              >
                <Text style={[styles.sortText, sortByAmount && styles.sortTextActive]}>Mayor monto</Text>
              </TouchableOpacity>
            </View>

            {/* Mientras se leen los datos guardados se muestra un indicador;
                sin esto se veria un instante el mensaje de "no hay gastos" */}
            {isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={LiquidGlassColors.primary} />
              </View>
            ) : sortedExpenses.length === 0 ? (
              /* Si no hay gastos este mes mostramos un mensaje en vez de la lista */
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💸</Text>
                <Text style={styles.emptyTitle}>No hay gastos registrados</Text>
                <Text style={styles.emptyText}>
                  Presiona el botón + para agregar tu primer gasto
                </Text>
              </View>
            ) : (
              <FlatList
                data={sortedExpenses}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <ExpenseItem
                    expense={item}
                    index={index}
                    onEdit={(selectedExpense) => {
                      setEditingExpense(selectedExpense);
                      setModalVisible(true);
                    }}
                    onDelete={confirmDelete}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* Boton + de la esquina */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              setEditingExpense(null);
              setModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Text style={styles.fabIcon}>+</Text>
            </LinearGradient>
          </TouchableOpacity>

          <AddExpenseModal
            key={editingExpense?.id ?? 'new-expense'}
            visible={modalVisible}
            expense={editingExpense}
            onClose={() => {
              setModalVisible(false);
              setEditingExpense(null);
            }}
          />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPink: {
    width: 220,
    height: 220,
    top: 60,
    left: -60,
    backgroundColor: 'rgba(255, 107, 157, 0.55)',
  },
  orbOrange: {
    width: 180,
    height: 180,
    top: 260,
    right: -50,
    backgroundColor: 'rgba(255, 159, 94, 0.5)',
  },
  orbPurple: {
    width: 200,
    height: 200,
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(168, 120, 220, 0.4)',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  sortControl: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginBottom: Spacing.two,
    padding: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
  },
  sortOption: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
  },
  sortOptionActive: {
    backgroundColor: LiquidGlassColors.primary,
  },
  sortText: {
    color: LiquidGlassColors.glassTextSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  sortTextActive: {
    color: LiquidGlassColors.glassTextLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: LiquidGlassColors.glassTextSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.four,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: LiquidGlassColors.shadowDark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: LiquidGlassColors.glassTextLight,
    fontWeight: '300',
  },
});
