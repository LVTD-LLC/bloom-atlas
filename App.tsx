import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BloomEvent, BloomMonth, bloomEvents, monthOrder } from './src/data/blooms';

type Tab = 'map' | 'calendar' | 'saved';

const worldMapWidth = 320;
const worldMapHeight = 180;

function markerPosition(event: BloomEvent) {
  return {
    left: ((event.longitude + 180) / 360) * worldMapWidth,
    top: ((90 - event.latitude) / 180) * worldMapHeight,
  };
}

function monthMatches(event: BloomEvent, month: BloomMonth | 'All') {
  return month === 'All' || event.bestMonths.includes(month);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [selectedMonth, setSelectedMonth] = useState<BloomMonth | 'All'>('All');
  const [selectedEventId, setSelectedEventId] = useState(bloomEvents[0].id);
  const selectedEvent = bloomEvents.find((event) => event.id === selectedEventId) ?? bloomEvents[0];

  const filteredEvents = useMemo(
    () => bloomEvents.filter((event) => monthMatches(event, selectedMonth)),
    [selectedMonth],
  );

  const countriesCount = new Set(bloomEvents.map((event) => event.country)).size;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Bloom Atlas</Text>
            <Text style={styles.title}>Find the world’s best bloom trips</Text>
          </View>
          <Text style={styles.logo}>🌸</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="places" value={String(bloomEvents.length)} />
          <StatCard label="countries" value={String(countriesCount)} />
          <StatCard label="months" value="12" />
        </View>

        <View style={styles.tabs}>
          <TabButton label="Map" active={activeTab === 'map'} onPress={() => setActiveTab('map')} />
          <TabButton label="Calendar" active={activeTab === 'calendar'} onPress={() => setActiveTab('calendar')} />
          <TabButton label="Saved" active={activeTab === 'saved'} onPress={() => setActiveTab('saved')} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {activeTab === 'map' ? (
            <MapTab
              events={filteredEvents}
              selectedEvent={selectedEvent}
              selectedMonth={selectedMonth}
              onSelectEvent={setSelectedEventId}
              onSelectMonth={setSelectedMonth}
            />
          ) : null}

          {activeTab === 'calendar' ? (
            <CalendarTab
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              onSelectEvent={(id) => {
                setSelectedEventId(id);
                setActiveTab('map');
              }}
            />
          ) : null}

          {activeTab === 'saved' ? <SavedTab /> : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function MapTab({
  events,
  selectedEvent,
  selectedMonth,
  onSelectEvent,
  onSelectMonth,
}: {
  events: BloomEvent[];
  selectedEvent: BloomEvent;
  selectedMonth: BloomMonth | 'All';
  onSelectEvent: (id: string) => void;
  onSelectMonth: (month: BloomMonth | 'All') => void;
}) {
  return (
    <View>
      <MonthFilter selectedMonth={selectedMonth} onSelectMonth={onSelectMonth} />

      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.sectionTitle}>Bloom map</Text>
          <Text style={styles.mutedText}>{events.length} matching places</Text>
        </View>
        <View style={styles.mapCanvas}>
          <View style={[styles.continent, styles.americas]} />
          <View style={[styles.continent, styles.europeAfrica]} />
          <View style={[styles.continent, styles.asia]} />
          <View style={[styles.continent, styles.australia]} />
          {events.map((event) => {
            const position = markerPosition(event);
            const selected = event.id === selectedEvent.id;
            return (
              <Pressable
                key={event.id}
                accessibilityRole="button"
                accessibilityLabel={`${event.commonName} in ${event.locationName}`}
                onPress={() => onSelectEvent(event.id)}
                style={[
                  styles.mapMarker,
                  { left: position.left - 12, top: position.top - 12 },
                  selected ? styles.mapMarkerSelected : null,
                ]}
              >
                <Text style={styles.mapMarkerText}>{event.imageEmoji}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <BloomDetail event={selectedEvent} />

      <Text style={styles.sectionTitle}>Explore blooms</Text>
      {events.map((event) => (
        <BloomRow
          key={event.id}
          event={event}
          selected={event.id === selectedEvent.id}
          onPress={() => onSelectEvent(event.id)}
        />
      ))}
    </View>
  );
}

function CalendarTab({
  selectedMonth,
  onSelectMonth,
  onSelectEvent,
}: {
  selectedMonth: BloomMonth | 'All';
  onSelectMonth: (month: BloomMonth | 'All') => void;
  onSelectEvent: (id: string) => void;
}) {
  return (
    <View>
      <MonthFilter selectedMonth={selectedMonth} onSelectMonth={onSelectMonth} />
      {monthOrder.map((month) => {
        const monthEvents = bloomEvents.filter((event) => event.bestMonths.includes(month));
        return (
          <View key={month} style={styles.monthSection}>
            <Text style={styles.sectionTitle}>{month}</Text>
            {monthEvents.length === 0 ? (
              <Text style={styles.mutedText}>No seed blooms yet.</Text>
            ) : (
              monthEvents.map((event) => <BloomRow key={`${month}-${event.id}`} event={event} onPress={() => onSelectEvent(event.id)} />)
            )}
          </View>
        );
      })}
    </View>
  );
}

function SavedTab() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🧭</Text>
      <Text style={styles.sectionTitle}>Trip planning comes next</Text>
      <Text style={styles.mutedText}>
        Saved blooms, alerts, and route planning are intentionally out of v0.1. This tab is here to shape the product direction.
      </Text>
    </View>
  );
}

function MonthFilter({
  selectedMonth,
  onSelectMonth,
}: {
  selectedMonth: BloomMonth | 'All';
  onSelectMonth: (month: BloomMonth | 'All') => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroller}>
      {(['All', ...monthOrder] as Array<BloomMonth | 'All'>).map((month) => (
        <Pressable
          key={month}
          onPress={() => onSelectMonth(month)}
          style={[styles.monthPill, selectedMonth === month ? styles.monthPillActive : null]}
        >
          <Text style={[styles.monthPillText, selectedMonth === month ? styles.monthPillTextActive : null]}>{month}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function BloomDetail({ event }: { event: BloomEvent }) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailEmoji}>{event.imageEmoji}</Text>
        <View style={styles.detailTitleWrap}>
          <Text style={styles.detailTitle}>{event.commonName}</Text>
          <Text style={styles.mutedText}>{event.locationName}</Text>
        </View>
      </View>
      <Text style={styles.detailSeason}>{event.seasonLabel}</Text>
      <Text style={styles.bodyText}>{event.description}</Text>
      <Text style={styles.noteText}>Travel note: {event.travelNote}</Text>
      <Text style={styles.sourceText}>{event.sourceNote}</Text>
    </View>
  );
}

function BloomRow({ event, selected, onPress }: { event: BloomEvent; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.bloomRow, selected ? styles.bloomRowSelected : null]}>
      <Text style={styles.rowEmoji}>{event.imageEmoji}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{event.commonName} · {event.country}</Text>
        <Text style={styles.rowSubtitle}>{event.locationName}</Text>
        <Text style={styles.rowSeason}>{event.seasonLabel}</Text>
      </View>
    </Pressable>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active ? styles.tabButtonActive : null]}>
      <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const colors = {
  background: '#FFF8F3',
  card: '#FFFFFF',
  ink: '#2B2118',
  muted: '#7E6F64',
  border: '#EADDD1',
  blush: '#F9D9DF',
  petal: '#E65E82',
  leaf: '#4E8E67',
  sky: '#DDF0FF',
  amber: '#F4A261',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appShell: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  eyebrow: {
    color: colors.leaf,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 34,
    maxWidth: 280,
  },
  logo: {
    fontSize: 42,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  statValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tabs: {
    backgroundColor: '#F4E9DF',
    borderRadius: 18,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 4,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    paddingVertical: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.card,
  },
  tabText: {
    color: colors.muted,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.ink,
  },
  content: {
    paddingBottom: 36,
  },
  monthScroller: {
    gap: 8,
    paddingBottom: 14,
  },
  monthPill: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  monthPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  monthPillText: {
    color: colors.muted,
    fontWeight: '700',
  },
  monthPillTextActive: {
    color: colors.card,
  },
  mapCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  mapHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
  },
  mutedText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  mapCanvas: {
    alignSelf: 'center',
    backgroundColor: colors.sky,
    borderRadius: 22,
    height: worldMapHeight,
    overflow: 'hidden',
    position: 'relative',
    width: worldMapWidth,
  },
  continent: {
    backgroundColor: '#BBD8AA',
    opacity: 0.8,
    position: 'absolute',
  },
  americas: {
    borderRadius: 50,
    height: 118,
    left: 28,
    top: 30,
    transform: [{ rotate: '-18deg' }],
    width: 70,
  },
  europeAfrica: {
    borderRadius: 48,
    height: 126,
    left: 142,
    top: 24,
    transform: [{ rotate: '8deg' }],
    width: 58,
  },
  asia: {
    borderRadius: 60,
    height: 98,
    left: 190,
    top: 22,
    transform: [{ rotate: '-8deg' }],
    width: 98,
  },
  australia: {
    borderRadius: 28,
    height: 28,
    left: 244,
    top: 126,
    transform: [{ rotate: '10deg' }],
    width: 48,
  },
  mapMarker: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.petal,
    borderRadius: 999,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    width: 28,
  },
  mapMarkerSelected: {
    backgroundColor: colors.blush,
    transform: [{ scale: 1.15 }],
  },
  mapMarkerText: {
    fontSize: 14,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
  },
  detailHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  detailEmoji: {
    fontSize: 36,
  },
  detailTitleWrap: {
    flex: 1,
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
  },
  detailSeason: {
    color: colors.petal,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  bodyText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  noteText: {
    color: colors.leaf,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 8,
  },
  sourceText: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bloomRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    padding: 12,
  },
  bloomRowSelected: {
    borderColor: colors.petal,
    borderWidth: 2,
  },
  rowEmoji: {
    fontSize: 26,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  rowSeason: {
    color: colors.petal,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  monthSection: {
    marginBottom: 18,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 26,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
});
