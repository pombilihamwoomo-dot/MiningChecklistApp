import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const toDateKey = (date) => {
  if (!date) return 'Unknown';
  const d = date?.toDate?.() ?? date;
  return d.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export default function SupervisorDashboard() {
  const [listData, setListData] = useState([]); // mixed: day headers + submissions + absent cards
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, cleared: 0, incomplete: 0, absent: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1. Fetch all workers
        const usersSnap = await getDocs(collection(db, 'users'));
        const allWorkers = usersSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.role === 'worker');

        // 2. Fetch all checklists
        const checkSnap = await getDocs(collection(db, 'checklists'));
        const submissions = checkSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          workerName: allWorkers.find(w => w.id === d.data().userId)?.name ?? 'Unknown',
        }));

        // 3. Sort newest first
        submissions.sort((a, b) => {
          const ta = a.date?.toDate?.()?.getTime?.() ?? 0;
          const tb = b.date?.toDate?.()?.getTime?.() ?? 0;
          return tb - ta;
        });

        // 4. Group by day key
        const dayMap = {}; // { dateKey: [submission, ...] }
        submissions.forEach(s => {
          const key = toDateKey(s.date);
          if (!dayMap[key]) dayMap[key] = [];
          dayMap[key].push(s);
        });

        // 5. For each day, find absent workers (no submission that day)
        let totalCount = 0, clearedCount = 0, incompleteCount = 0, absentCount = 0;
        const built = [];

        Object.entries(dayMap).forEach(([dateKey, daySubs]) => {
          const submittedIds = new Set(daySubs.map(s => s.userId));
          const absentWorkers = allWorkers.filter(w => !submittedIds.has(w.id));

          totalCount += daySubs.length;
          clearedCount += daySubs.filter(s => s.helmet && s.mask && s.emergencyKit).length;
          incompleteCount += daySubs.filter(s => !(s.helmet && s.mask && s.emergencyKit)).length;
          absentCount += absentWorkers.length;

          // Day header
          built.push({
            type: 'header',
            id: `header-${dateKey}`,
            dateKey,
            total: daySubs.length,
            cleared: daySubs.filter(s => s.helmet && s.mask && s.emergencyKit).length,
            absent: absentWorkers.length,
          });

          // Absent banners first
          absentWorkers.forEach(w => {
            built.push({ type: 'absent', id: `absent-${dateKey}-${w.id}`, workerName: w.name });
          });

          // Submissions
          daySubs.forEach(s => built.push({ type: 'submission', ...s }));
        });

        setStats({ total: totalCount, cleared: clearedCount, incomplete: incompleteCount, absent: absentCount });
        setListData(built);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const renderHeader = (item) => (
    <View style={styles.dayHeader}>
      <View style={styles.dayHeaderLeft}>
        <Ionicons name="calendar" size={14} color="#e74c3c" />
        <Text style={styles.dayHeaderTxt}> {item.dateKey}</Text>
      </View>
      <View style={styles.dayHeaderRight}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeTxt}>{item.total} submitted</Text>
        </View>
        {item.cleared > 0 && (
          <View style={[styles.dayBadge, { backgroundColor: '#0f2a0f' }]}>
            <Text style={[styles.dayBadgeTxt, { color: '#4caf50' }]}>{item.cleared} clear</Text>
          </View>
        )}
        {item.absent > 0 && (
          <View style={[styles.dayBadge, { backgroundColor: '#2a1a00' }]}>
            <Ionicons name="warning" size={11} color="#f39c12" />
            <Text style={[styles.dayBadgeTxt, { color: '#f39c12' }]}> {item.absent} absent</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAbsent = (item) => (
    <View style={styles.absentCard}>
      <View style={styles.absentLeft}>
        <Ionicons name="person-remove-outline" size={16} color="#f39c12" />
        <Text style={styles.absentName}> {item.workerName}</Text>
      </View>
      <View style={styles.absentBadge}>
        <Ionicons name="close-circle-outline" size={12} color="#f39c12" />
        <Text style={styles.absentBadgeTxt}> No Submission</Text>
      </View>
    </View>
  );

  const renderSubmission = (item) => {
    const date = item.date?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? 'Unknown';
    const passed = item.helmet && item.mask && item.emergencyKit;
    const startTime = item.shiftStart?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = item.shiftEnd?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const duration = formatDuration(item.shiftDurationSeconds);

    return (
      <View style={[styles.card, { borderLeftColor: passed ? '#27ae60' : '#e74c3c', borderLeftWidth: 3 }]}>
        <View style={styles.cardTop}>
          <View style={styles.workerRow}>
            <Ionicons name="person-circle-outline" size={18} color="#888" />
            <Text style={styles.workerName}> {item.workerName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: passed ? '#0f2a0f' : '#2a0f0f' }]}>
            <Ionicons name={passed ? 'checkmark-circle' : 'alert-circle'} size={13} color={passed ? '#4caf50' : '#e74c3c'} />
            <Text style={[styles.statusTxt, { color: passed ? '#4caf50' : '#e74c3c' }]}>
              {passed ? ' Clear' : ' Incomplete'}
            </Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={12} color="#555" />
          <Text style={styles.date}> {date}</Text>
        </View>

        {(startTime || duration) && (
          <View style={styles.shiftRow}>
            {startTime && (
              <View style={styles.shiftItem}>
                <Ionicons name="play-circle-outline" size={13} color="#4caf50" />
                <Text style={styles.shiftTxt}> {startTime}</Text>
              </View>
            )}
            {startTime && endTime && <Ionicons name="arrow-forward-outline" size={12} color="#444" />}
            {endTime && (
              <View style={styles.shiftItem}>
                <Ionicons name="stop-circle-outline" size={13} color="#e74c3c" />
                <Text style={styles.shiftTxt}> {endTime}</Text>
              </View>
            )}
            {duration && (
              <View style={styles.durationBadge}>
                <Ionicons name="timer-outline" size={12} color="#888" />
                <Text style={styles.durationTxt}> {duration}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.itemsRow}>
          {[
            { key: 'helmet', label: 'Helmet', val: item.helmet },
            { key: 'mask', label: 'Mask', val: item.mask },
            { key: 'kit', label: 'Kit', val: item.emergencyKit },
          ].map(i => (
            <View key={i.key} style={styles.checkItem}>
              <Ionicons name={i.val ? 'checkmark-circle' : 'close-circle'} size={14} color={i.val ? '#4caf50' : '#e74c3c'} />
              <Text style={styles.checkLabel}> {i.label}</Text>
            </View>
          ))}
        </View>

        {item.comments ? (
          <View style={styles.commentRow}>
            <Ionicons name="chatbubble-outline" size={12} color="#555" />
            <Text style={styles.comment}> {item.comments}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderItem = ({ item }) => {
    if (item.type === 'header') return renderHeader(item);
    if (item.type === 'absent') return renderAbsent(item);
    return renderSubmission(item);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="eye-outline" size={22} color="#e74c3c" />
          <Text style={styles.title}> Supervisor View</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut(auth)}>
          <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
          <Text style={styles.logout}> Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="documents-outline" size={20} color="#888" />
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="checkmark-done-circle-outline" size={20} color="#4caf50" />
          <Text style={[styles.statNum, { color: '#4caf50' }]}>{stats.cleared}</Text>
          <Text style={styles.statLabel}>All Clear</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="warning-outline" size={20} color="#e74c3c" />
          <Text style={[styles.statNum, { color: '#e74c3c' }]}>{stats.incomplete}</Text>
          <Text style={styles.statLabel}>Incomplete</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="person-remove-outline" size={20} color="#f39c12" />
          <Text style={[styles.statNum, { color: '#f39c12' }]}>{stats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#e74c3c" style={{ marginTop: 40 }} />
      ) : listData.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={48} color="#333" />
          <Text style={styles.empty}>No submissions yet.</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d', padding: 20, paddingTop: 55 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#e74c3c' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center' },
  logout: { color: '#e74c3c', fontWeight: '600', fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  stat: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 10, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#2a2a2a' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { color: '#666', fontSize: 10 },

  // Day header
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, marginTop: 6, borderWidth: 1, borderColor: '#222' },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dayHeaderTxt: { color: '#ccc', fontWeight: '700', fontSize: 13, flexShrink: 1 },
  dayHeaderRight: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  dayBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dayBadgeTxt: { color: '#888', fontSize: 11, fontWeight: '600' },

  // Absent card
  absentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1200', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#3a2800' },
  absentLeft: { flexDirection: 'row', alignItems: 'center' },
  absentName: { color: '#f39c12', fontWeight: '600', fontSize: 14 },
  absentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a1e00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  absentBadgeTxt: { color: '#f39c12', fontSize: 12, fontWeight: '600' },

  // Submission card
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  workerRow: { flexDirection: 'row', alignItems: 'center' },
  workerName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTxt: { fontSize: 12, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  date: { color: '#555', fontSize: 12 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, backgroundColor: '#111', borderRadius: 8, padding: 8 },
  shiftItem: { flexDirection: 'row', alignItems: 'center' },
  shiftTxt: { color: '#888', fontSize: 12 },
  durationBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  durationTxt: { color: '#888', fontSize: 12 },
  itemsRow: { flexDirection: 'row', gap: 14 },
  checkItem: { flexDirection: 'row', alignItems: 'center' },
  checkLabel: { color: '#aaa', fontSize: 13 },
  commentRow: { flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' },
  comment: { color: '#555', fontSize: 12, fontStyle: 'italic', flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty: { color: '#444', textAlign: 'center', fontSize: 15 },
});