


import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Image, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import {
  collection, getDocs, doc, getDoc,
  addDoc, updateDoc, Timestamp
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useFocusEffect } from '@react-navigation/native';

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatElapsed = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export default function WorkerDashboard({ navigation }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const [activeShift, setActiveShift] = useState(null); // { id, startTime }
  const [shiftElapsed, setShiftElapsed] = useState(0);
  const timerRef = useRef(null);

  // ── No compound queries — fetch all, filter client-side ──────────────────
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'checklists'));
      const mine = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.userId === auth.currentUser.uid)
        .sort((a, b) => {
          const ta = a.date?.toDate?.()?.getTime?.() ?? 0;
          const tb = b.date?.toDate?.()?.getTime?.() ?? 0;
          return tb - ta;
        });
      setSubmissions(mine);
    } catch (e) {
      console.error('fetchSubmissions:', e);
    }
    setLoading(false);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) setUserName(snap.data().name);
    } catch (e) {
      console.error('fetchUser:', e);
    }
  }, []);

  const fetchActiveShift = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'shifts'));
      const open = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .find(d => d.userId === auth.currentUser.uid && d.active === true);

      if (open) {
        const startTime = open.shiftStart?.toDate?.() ?? new Date();
        setActiveShift({ id: open.id, startTime });
        setShiftElapsed(Math.floor((new Date() - startTime) / 1000));
      } else {
        setActiveShift(null);
        setShiftElapsed(0);
      }
    } catch (e) {
      console.error('fetchActiveShift:', e);
    }
  }, []);

  // Reload everything when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUser();
      fetchSubmissions();
      fetchActiveShift();
    }, [fetchUser, fetchSubmissions, fetchActiveShift])
  );

  // Live elapsed timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeShift) {
      timerRef.current = setInterval(() => {
        setShiftElapsed(Math.floor((new Date() - activeShift.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [activeShift]);

  // ── Clock In ─────────────────────────────────────────────────────────────
  const handleClockIn = async () => {
    try {
      const now = new Date();
      const ref = await addDoc(collection(db, 'shifts'), {
        userId: auth.currentUser.uid,
        shiftStart: Timestamp.fromDate(now),
        active: true,
      });
      setActiveShift({ id: ref.id, startTime: now });
      setShiftElapsed(0);
    } catch (e) {
      Alert.alert('Error clocking in', e.message);
    }
  };

  // ── Clock Out ────────────────────────────────────────────────────────────
  const handleClockOut = () => {
    Alert.alert('End shift', 'Are you sure you want to end your shift?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Shift', style: 'destructive', onPress: async () => {
          try {
            const now = new Date();
            await updateDoc(doc(db, 'shifts', activeShift.id), {
              shiftEnd: Timestamp.fromDate(now),
              shiftDurationSeconds: Math.floor((now - activeShift.startTime) / 1000),
              active: false,
            });
            setActiveShift(null);
            setShiftElapsed(0);
          } catch (e) {
            Alert.alert('Error clocking out', e.message);
          }
        }
      }
    ]);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const renderItem = ({ item }) => {
    const date = item.date?.toDate?.().toLocaleString() ?? 'Unknown';
    const passed = item.helmet && item.mask && item.emergencyKit;
    const startTime = item.shiftStart?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = item.shiftEnd?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const duration = formatDuration(item.shiftDurationSeconds);

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
              <Ionicons name={i.val ? 'checkmark-circle' : 'close-circle'} size={16} color={i.val ? '#4caf50' : '#e74c3c'} />
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
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
        <Text style={styles.title}>My Shifts</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut(auth)}>
          <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      {/* Profile row */}
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{getInitials(userName)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeTxt}>Welcome back,</Text>
          <Text style={styles.userNameTxt}>{userName || 'Worker'}</Text>
        </View>
      </View>

      {/* Clock In / Active Shift */}
      {activeShift ? (
        <View style={styles.activeShiftCard}>
          <View style={styles.activeShiftLeft}>
            <View style={styles.activeDot} />
            <View>
              <Text style={styles.activeShiftLabel}>Shift in progress</Text>
              <Text style={styles.activeShiftTime}>
                Started {activeShift.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <View style={styles.activeShiftRight}>
            <Text style={styles.elapsedTxt}>{formatElapsed(shiftElapsed)}</Text>
            <TouchableOpacity style={styles.clockOutBtn} onPress={handleClockOut}>
              <Ionicons name="stop-circle-outline" size={14} color="#fff" />
              <Text style={styles.clockOutTxt}> Clock Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.clockInBtn} onPress={handleClockIn}>
          <Ionicons name="play-circle-outline" size={20} color="#fff" />
          <Text style={styles.clockInTxt}> Start Shift</Text>
        </TouchableOpacity>
      )}

      {/* New Safety Check */}
      <TouchableOpacity
        style={[styles.newBtn, !activeShift && styles.newBtnDisabled]}
        onPress={() => activeShift && navigation.navigate('Checklist')}
        disabled={!activeShift}
      >
        <Ionicons name="add-circle-outline" size={20} color={activeShift ? '#fff' : '#555'} />
        <Text style={[styles.newBtnText, !activeShift && { color: '#555' }]}> New Safety Check</Text>
      </TouchableOpacity>
      {!activeShift && (
        <Text style={styles.hintTxt}>start shift  first to submit a safety check</Text>
      )}

      {/* Submissions list */}
      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#e74c3c" size="large" />
        </View>
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
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d', padding: 20, paddingTop: 55 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerLogo: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#e74c3c' },
  logoutBtn: { padding: 6 },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#c0392b', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  welcomeTxt: { color: '#555', fontSize: 12 },
  userNameTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  activeShiftCard: { backgroundColor: '#0f2a0f', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1a4a1a', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeShiftLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4caf50' },
  activeShiftLabel: { color: '#4caf50', fontWeight: '700', fontSize: 14 },
  activeShiftTime: { color: '#666', fontSize: 12, marginTop: 2 },
  activeShiftRight: { alignItems: 'flex-end', gap: 6 },
  elapsedTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  clockOutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#c0392b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  clockOutTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },

  clockInBtn: { backgroundColor: '#27ae60', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  clockInTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  newBtn: { backgroundColor: '#c0392b', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  newBtnDisabled: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  newBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  hintTxt: { color: '#444', fontSize: 12, textAlign: 'center', marginBottom: 16 },

  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardDateRow: { flexDirection: 'row', alignItems: 'center' },
  cardDate: { color: '#666', fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTxt: { fontSize: 12, fontWeight: '600' },

  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, backgroundColor: '#111', borderRadius: 8, padding: 8 },
  shiftItem: { flexDirection: 'row', alignItems: 'center' },
  shiftTxt: { color: '#888', fontSize: 12 },
  durationBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  durationTxt: { color: '#888', fontSize: 12 },

  itemsRow: { flexDirection: 'row', gap: 16 },
  checkItem: { flexDirection: 'row', alignItems: 'center' },
  checkLabel: { color: '#aaa', fontSize: 13 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' },
  comment: { color: '#666', fontSize: 12, fontStyle: 'italic', flex: 1 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty: { color: '#444', textAlign: 'center', fontSize: 15, lineHeight: 22 },
});