import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export default function WorkerDashboard({ navigation }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    setLoading(true);
    const q = query(
      collection(db, 'checklists'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const renderItem = ({ item }) => {
    const date = item.date?.toDate?.().toLocaleString() ?? 'Unknown';
    const passed = item.helmet && item.mask && item.emergencyKit;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardDateRow}>
            <Ionicons name="calendar-outline" size={13} color="#666" />
            <Text style={styles.cardDate}> {date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: passed ? '#0f2a0f' : '#2a0f0f' }]}>
            <Ionicons name={passed ? 'checkmark-circle' : 'warning'} size={13} color={passed ? '#4caf50' : '#e74c3c'} />
            <Text style={[styles.statusTxt, { color: passed ? '#4caf50' : '#e74c3c' }]}>
              {passed ? ' All Clear' : ' Incomplete'}
            </Text>
          </View>
        </View>
        <View style={styles.itemsRow}>
          <View style={styles.checkItem}>
            <Ionicons name={item.helmet ? 'checkmark-circle' : 'close-circle'} size={16} color={item.helmet ? '#4caf50' : '#e74c3c'} />
            <Text style={styles.checkLabel}> Helmet</Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name={item.mask ? 'checkmark-circle' : 'close-circle'} size={16} color={item.mask ? '#4caf50' : '#e74c3c'} />
            <Text style={styles.checkLabel}> Mask</Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name={item.emergencyKit ? 'checkmark-circle' : 'close-circle'} size={16} color={item.emergencyKit ? '#4caf50' : '#e74c3c'} />
            <Text style={styles.checkLabel}> Kit</Text>
          </View>
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
          <Ionicons name="shield-checkmark" size={22} color="#e74c3c" />
          <Text style={styles.title}> My Shifts</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut(auth)}>
          <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
          <Text style={styles.logout}> Logout</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('Checklist', { onDone: fetchSubmissions })}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.newBtnText}> New Safety Check</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color="#e74c3c" style={{ marginTop: 40 }} />
      ) : submissions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={48} color="#333" />
          <Text style={styles.empty}>No submissions yet.{'\n'}Start your first safety check!</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 30 }}
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
  newBtn: { backgroundColor: '#c0392b', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  newBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardDateRow: { flexDirection: 'row', alignItems: 'center' },
  cardDate: { color: '#666', fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTxt: { fontSize: 12, fontWeight: '600' },
  itemsRow: { flexDirection: 'row', gap: 16 },
  checkItem: { flexDirection: 'row', alignItems: 'center' },
  checkLabel: { color: '#aaa', fontSize: 13 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' },
  comment: { color: '#666', fontSize: 12, fontStyle: 'italic', flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty: { color: '#444', textAlign: 'center', fontSize: 15, lineHeight: 22 },
});