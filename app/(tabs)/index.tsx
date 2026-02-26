import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">Home</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardIcon}>
            <Ionicons name="rocket-outline" size={32} color={colors.accent} />
          </View>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Welcome to Your App
          </ThemedText>
          <ThemedText style={styles.cardDescription}>
            This is a starter template with Expo, Supabase, and a dark/light theme system.
            Edit this screen in app/(tabs)/index.tsx.
          </ThemedText>
        </View>

        {/* Quick Start Section */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Quick Start
        </ThemedText>

        <QuickStartItem
          icon="key-outline"
          title="Set up environment variables"
          description="Copy .env.example to .env.local and add your Supabase keys"
          colors={colors}
        />
        <QuickStartItem
          icon="server-outline"
          title="Run database migrations"
          description="supabase db push to create your tables"
          colors={colors}
        />
        <QuickStartItem
          icon="cloud-outline"
          title="Deploy your AI proxy"
          description="supabase functions deploy ai-proxy"
          colors={colors}
        />
        <QuickStartItem
          icon="color-palette-outline"
          title="Customize your theme"
          description="Edit constants/Colors.ts to match your brand"
          colors={colors}
        />

        {/* Stats Example */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Stats
        </ThemedText>
        <View style={styles.statsRow}>
          <StatCard label="Users" value="0" color={colors.accent} colors={colors} />
          <StatCard label="AI Calls" value="0" color="#10B981" colors={colors} />
          <StatCard label="Images" value="0" color="#F59E0B" colors={colors} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

function QuickStartItem({ icon, title, description, colors }: {
  icon: string;
  title: string;
  description: string;
  colors: typeof Colors.light;
}) {
  return (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={[styles.listIcon, { backgroundColor: colors.accent + '15' }]}>
        <Ionicons name={icon as any} size={20} color={colors.accent} />
      </View>
      <View style={styles.listContent}>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText style={{ color: colors.icon, fontSize: 14, marginTop: 2 }}>
          {description}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.tabIconDefault} />
    </TouchableOpacity>
  );
}

function StatCard({ label, value, color, colors }: {
  label: string;
  value: string;
  color: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: colors.icon }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
});
