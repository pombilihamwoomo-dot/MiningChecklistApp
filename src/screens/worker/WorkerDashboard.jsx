import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function SupervisorDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const snap = await getDocs(collection(db, 'checklists'));
        const results = await Promise.all(snap.docs.map(async d => {
          const data = d.data();
          const userSnap = await getDoc(doc(db, 'users', data.userId));
          return {
            id: d.id,
            ...data,
            workerName: userSnap.exists() ? userSnap.data().name : 'Unknown'
          };
        }));
        results.sort((a, b) => {
          const ta = a.date?.toDate?.()?.getTime?.() ?? 0;
          const tb = b.date?.toDate?.()?.getTime?.() ?? 0;
          return tb - ta;
        });
        setSubmissions(results);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const total = submissions.length;
  const cleared = submissions.filter(s => s.helmet && s.mask && s.emergencyKit).length;
  const incomplete = total - cleared;

  const renderItem = ({ item }) => {
    const date = item.date?.toDate?.().toLocaleString() ?? 'Unknown';
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
            {startTime && endTime && (
              <Ionicons name="arrow-forward-outline" size={12} color="#444" />
            )}
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
          <Text style={styles.statNum}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="checkmark-done-circle-outline" size={20} color="#4caf50" />
          <Text style={[styles.statNum, { color: '#4caf50' }]}>{cleared}</Text>
          <Text style={styles.statLabel}>All Clear</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="warning-outline" size={20} color="#e74c3c" />
          <Text style={[styles.statNum, { color: '#e74c3c' }]}>{incomplete}</Text>
          <Text style={styles.statLabel}>Incomplete</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#e74c3c" style={{ marginTop: 40 }} />
      ) : submissions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={48} color="#333" />
          <Text style={styles.empty}>No submissions yet.</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
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
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  stat: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#2a2a2a' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { color: '#666', fontSize: 11 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
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