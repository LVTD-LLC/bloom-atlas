import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import { BloomEvent, BloomMonth, bloomEvents, monthOrder } from './src/data/blooms';

type Tab = 'map' | 'near' | 'calendar' | 'saved';

type UserLocation = {
  latitude: number;
  longitude: number;
};

type NearbyBloom = BloomEvent & {
  distanceKm: number;
  isInSeason: boolean;
};

function monthMatches(event: BloomEvent, month: BloomMonth | 'All') {
  return month === 'All' || event.bestMonths.includes(month);
}

function getCurrentBloomMonth(date = new Date()): BloomMonth {
  return monthOrder[date.getMonth()];
}

function distanceKmBetween(from: UserLocation, event: BloomEvent) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDelta = toRadians(event.latitude - from.latitude);
  const lonDelta = toRadians(event.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(event.latitude);

  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  }

  return `${Math.round(distanceKm).toLocaleString()} km away`;
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
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
          <TabButton label="Near me" active={activeTab === 'near'} onPress={() => setActiveTab('near')} />
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

          {activeTab === 'near' ? (
            <NearMeTab
              onSelectEvent={(id) => {
                setSelectedEventId(id);
                setActiveTab('map');
              }}
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
    </SafeAreaProvider>
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
  const [mapExpanded, setMapExpanded] = useState(false);

  return (
    <View>
      <MonthFilter selectedMonth={selectedMonth} onSelectMonth={onSelectMonth} />

      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.sectionTitle}>Bloom map</Text>
          <Pressable accessibilityRole="button" onPress={() => setMapExpanded(true)} style={styles.mapActionButton}>
            <Text style={styles.mapActionText}>Full screen</Text>
          </Pressable>
        </View>
        <BloomMap
          events={events}
          selectedEvent={selectedEvent}
          onSelectEvent={onSelectEvent}
          compact
        />
        <Text style={styles.mapCaption}>{events.length} matching places · OpenStreetMap + Leaflet</Text>
      </View>

      <FullScreenMap
        events={events}
        selectedEvent={selectedEvent}
        visible={mapExpanded}
        onClose={() => setMapExpanded(false)}
        onSelectEvent={onSelectEvent}
      />

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

function BloomMap({
  events,
  selectedEvent,
  onSelectEvent,
  compact,
}: {
  events: BloomEvent[];
  selectedEvent: BloomEvent;
  onSelectEvent: (id: string) => void;
  compact?: boolean;
}) {
  const webViewRef = useRef<WebView>(null);
  const leafletHtml = useMemo(
    () => buildLeafletHtml(events, selectedEvent.id),
    [events, selectedEvent.id],
  );

  useEffect(() => {
    webViewRef.current?.injectJavaScript(
      `window.setSelectedBloom && window.setSelectedBloom(${JSON.stringify(selectedEvent.id)}, false); true;`,
    );
  }, [selectedEvent.id]);

  function handleMapMessage(message: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(message.nativeEvent.data) as { type?: string; id?: string };
      if (payload.type === 'select' && payload.id && events.some((event) => event.id === payload.id)) {
        onSelectEvent(payload.id);
      }
    } catch {
      // Ignore non-JSON messages from the web map runtime.
    }
  }

  return (
    <View style={[styles.mapSurface, compact ? styles.mapCanvas : styles.fullMap]}>
      <WebView
        ref={webViewRef}
        androidLayerType="hardware"
        domStorageEnabled
        javaScriptEnabled
        onMessage={handleMapMessage}
        originWhitelist={['*']}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        source={{ html: leafletHtml }}
        style={styles.webMap}
      />
    </View>
  );
}

function buildLeafletHtml(events: BloomEvent[], selectedEventId: string) {
  const mapEvents = events.map((event) => ({
    id: event.id,
    commonName: event.commonName,
    locationName: event.locationName,
    country: event.country,
    seasonLabel: event.seasonLabel,
    latitude: event.latitude,
    longitude: event.longitude,
    imageEmoji: event.imageEmoji,
  }));

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body, #map {
        background: #DDF0FF;
        height: 100%;
        margin: 0;
        overflow: hidden;
        width: 100%;
      }

      body {
        color: #2B2118;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .leaflet-container {
        background: #DDF0FF;
        font: 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .leaflet-bar,
      .leaflet-control-layers,
      .leaflet-control-scale-line {
        border: 0 !important;
        box-shadow: 0 8px 24px rgba(43, 33, 24, 0.18);
      }

      .leaflet-bar a {
        color: #2B2118;
      }

      .bloom-marker {
        align-items: center;
        background: #FFFFFF;
        border: 2px solid #E65E82;
        border-radius: 999px;
        box-shadow: 0 8px 18px rgba(43, 33, 24, 0.24);
        display: flex;
        font-size: 17px;
        height: 34px;
        justify-content: center;
        line-height: 34px;
        transition: background 140ms ease, border 140ms ease, box-shadow 140ms ease;
        width: 34px;
      }

      .bloom-marker.selected {
        background: #F9D9DF;
        border-color: #2B2118;
        box-shadow: 0 10px 24px rgba(43, 33, 24, 0.34);
        z-index: 500 !important;
      }

      .bloom-popup {
        min-width: 190px;
      }

      .bloom-popup-title {
        color: #2B2118;
        font-size: 14px;
        font-weight: 800;
        margin-bottom: 3px;
      }

      .bloom-popup-location {
        color: #7E6F64;
        font-size: 12px;
        font-weight: 650;
        margin-bottom: 8px;
      }

      .bloom-popup-season {
        color: #E65E82;
        font-size: 12px;
        font-weight: 800;
      }

      .leaflet-popup-content {
        margin: 12px 14px;
      }

      .leaflet-popup-content-wrapper {
        border-radius: 14px;
        box-shadow: 0 12px 32px rgba(43, 33, 24, 0.22);
      }

      .map-empty {
        align-items: center;
        background: #FFF8F3;
        color: #7E6F64;
        display: flex;
        font-size: 14px;
        font-weight: 700;
        height: 100%;
        justify-content: center;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      const events = ${JSON.stringify(mapEvents)};
      let selectedId = ${JSON.stringify(selectedEventId)};
      const markers = {};

      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function(character) {
          return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
          }[character];
        });
      }

      function postSelection(id) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'select',
          id: id,
        }));
      }

      function markerIcon(event, selected) {
        return L.divIcon({
          className: selected ? 'bloom-marker selected' : 'bloom-marker',
          html: '<span>' + escapeHtml(event.imageEmoji) + '</span>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18],
        });
      }

      function popupHtml(event) {
        return [
          '<div class="bloom-popup">',
          '<div class="bloom-popup-title">' + escapeHtml(event.commonName) + '</div>',
          '<div class="bloom-popup-location">' + escapeHtml(event.locationName) + ', ' + escapeHtml(event.country) + '</div>',
          '<div class="bloom-popup-season">' + escapeHtml(event.seasonLabel) + '</div>',
          '</div>',
        ].join('');
      }

      function setSelectedBloom(id, notifyNative) {
        if (!markers[id]) {
          return;
        }

        selectedId = id;
        Object.keys(markers).forEach(function(markerId) {
          const marker = markers[markerId];
          marker.setIcon(markerIcon(marker.bloomEvent, markerId === selectedId));
        });

        const selectedMarker = markers[id];
        map.flyTo(selectedMarker.getLatLng(), Math.max(map.getZoom(), 4), {
          animate: true,
          duration: 0.55,
        });
        selectedMarker.openPopup();

        if (notifyNative) {
          postSelection(id);
        }
      }

      window.setSelectedBloom = setSelectedBloom;

      if (!events.length) {
        document.body.innerHTML = '<div class="map-empty">No bloom places match this filter.</div>';
      } else {
        var map = L.map('map', {
          attributionControl: true,
          worldCopyJump: true,
          zoomControl: true,
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          crossOrigin: true,
        }).addTo(map);

        L.control.scale({
          imperial: false,
          metric: true,
        }).addTo(map);

        const group = L.featureGroup().addTo(map);

        events.forEach(function(event) {
          const marker = L.marker([event.latitude, event.longitude], {
            icon: markerIcon(event, event.id === selectedId),
            keyboard: true,
            title: event.commonName + ' - ' + event.locationName,
          }).bindPopup(popupHtml(event));

          marker.bloomEvent = event;
          marker.on('click', function() {
            setSelectedBloom(event.id, true);
          });
          marker.addTo(group);
          markers[event.id] = marker;
        });

        map.fitBounds(group.getBounds().pad(0.22), {
          animate: false,
          maxZoom: events.length === 1 ? 7 : 4,
          padding: [22, 22],
        });

        setTimeout(function() {
          setSelectedBloom(selectedId, false);
        }, 250);
      }
    </script>
  </body>
</html>`;
}

function FullScreenMap({
  events,
  selectedEvent,
  visible,
  onClose,
  onSelectEvent,
}: {
  events: BloomEvent[];
  selectedEvent: BloomEvent;
  visible: boolean;
  onClose: () => void;
  onSelectEvent: (id: string) => void;
}) {
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.fullMapShell} edges={['top', 'bottom']}>
        <View style={styles.fullMapHeader}>
          <View>
            <Text style={styles.eyebrow}>Bloom map</Text>
            <Text style={styles.fullMapTitle}>{selectedEvent.locationName}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
        <BloomMap events={events} selectedEvent={selectedEvent} onSelectEvent={onSelectEvent} />
      </SafeAreaView>
    </Modal>
  );
}

function NearMeTab({ onSelectEvent }: { onSelectEvent: (id: string) => void }) {
  const currentMonth = getCurrentBloomMonth();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nearbyBlooms = useMemo<NearbyBloom[]>(() => {
    if (!location) {
      return [];
    }

    return bloomEvents
      .map((event) => ({
        ...event,
        distanceKm: distanceKmBetween(location, event),
        isInSeason: event.bestMonths.includes(currentMonth),
      }))
      .sort((left, right) => {
        if (left.isInSeason !== right.isInSeason) {
          return left.isInSeason ? -1 : 1;
        }

        return left.distanceKm - right.distanceKm;
      });
  }, [currentMonth, location]);

  const inSeasonBlooms = nearbyBlooms.filter((event) => event.isInSeason);
  const fallbackBlooms = nearbyBlooms.filter((event) => !event.isInSeason).slice(0, 5);

  async function findNearbyBlooms() {
    setLocationStatus('loading');
    setErrorMessage(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationStatus('denied');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationStatus('ready');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not read your current location.');
      setLocationStatus('error');
    }
  }

  return (
    <View>
      <View style={styles.nearHeroCard}>
        <Text style={styles.eyebrow}>Near me right now</Text>
        <Text style={styles.nearHeroTitle}>Find seasonal bloom trips closest to your current location.</Text>
        <Text style={styles.mutedText}>
          Uses your device location once, then ranks the seed catalog by distance and highlights blooms that are in season in {currentMonth}.
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={locationStatus === 'loading'}
          onPress={findNearbyBlooms}
          style={[styles.primaryButton, locationStatus === 'loading' ? styles.primaryButtonDisabled : null]}
        >
          {locationStatus === 'loading' ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <Text style={styles.primaryButtonText}>{location ? 'Refresh my location' : 'Use my location'}</Text>
          )}
        </Pressable>
      </View>

      {locationStatus === 'denied' ? (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Location permission needed</Text>
          <Text style={styles.mutedText}>
            Enable location access for Bloom Atlas in system settings, then come back and try again.
          </Text>
        </View>
      ) : null}

      {locationStatus === 'error' ? (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Could not get location</Text>
          <Text style={styles.mutedText}>{errorMessage}</Text>
        </View>
      ) : null}

      {location ? (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{inSeasonBlooms.length ? 'In season near you' : `No ${currentMonth} blooms in the seed catalog`}</Text>
          <Text style={styles.mutedText}>
            {inSeasonBlooms.length
              ? `Showing ${inSeasonBlooms.length} bloom ${inSeasonBlooms.length === 1 ? 'place' : 'places'} active this month, nearest first.`
              : 'Showing the nearest seeded bloom destinations instead, so you still have useful places to explore.'}
          </Text>
        </View>
      ) : null}

      {inSeasonBlooms.map((event) => (
        <NearbyBloomRow key={event.id} event={event} onPress={() => onSelectEvent(event.id)} />
      ))}

      {location && fallbackBlooms.length ? (
        <View style={styles.nearFallbackSection}>
          <Text style={styles.sectionTitle}>Nearest out-of-season blooms</Text>
          {fallbackBlooms.map((event) => (
            <NearbyBloomRow key={event.id} event={event} onPress={() => onSelectEvent(event.id)} />
          ))}
        </View>
      ) : null}
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

function NearbyBloomRow({ event, onPress }: { event: NearbyBloom; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.bloomRow, event.isInSeason ? styles.nearbyBloomInSeason : null]}>
      <Text style={styles.rowEmoji}>{event.imageEmoji}</Text>
      <View style={styles.rowBody}>
        <View style={styles.nearRowHeader}>
          <Text style={styles.rowTitle}>{event.commonName} · {event.country}</Text>
          <Text style={styles.distanceBadge}>{formatDistance(event.distanceKm)}</Text>
        </View>
        <Text style={styles.rowSubtitle}>{event.locationName}</Text>
        <Text style={styles.rowSeason}>{event.isInSeason ? `Now · ${event.seasonLabel}` : event.seasonLabel}</Text>
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
  nearHeroCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
    padding: 18,
  },
  nearHeroTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 27,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    marginTop: 4,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.72,
  },
  primaryButtonText: {
    color: colors.card,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginBottom: 12,
    padding: 14,
  },
  nearFallbackSection: {
    marginTop: 18,
  },
  nearbyBloomInSeason: {
    borderColor: colors.leaf,
    borderWidth: 2,
  },
  nearRowHeader: {
    alignItems: 'flex-start',
    gap: 8,
  },
  distanceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blush,
    borderRadius: 999,
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  mapActionButton: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapActionText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '800',
  },
  mapCaption: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 10,
  },
  fullMapShell: {
    backgroundColor: colors.background,
    flex: 1,
  },
  fullMapHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  fullMapTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    maxWidth: 240,
  },
  closeButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  closeButtonText: {
    color: colors.ink,
    fontWeight: '800',
  },
  fullMap: {
    flex: 1,
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
    borderRadius: 22,
    height: 230,
    width: '100%',
  },
  mapSurface: {
    backgroundColor: colors.sky,
    overflow: 'hidden',
  },
  webMap: {
    backgroundColor: colors.sky,
    flex: 1,
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
