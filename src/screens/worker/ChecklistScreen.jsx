import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Switch, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const ITEMS = [
  { key: 'helmet', label: 'Safety Helmet', desc: 'Present, undamaged and correctly fitted', icon: 'hardware-chip-outline' },
  { key: 'mask', label: 'Dust Mask', desc: 'Fitted with a valid, unexpired filter', icon: 'medkit-outline' },
  { key: 'emergencyKit', label: 'Emergency Kit', desc: 'Fully stocked and accessible', icon: 'briefcase-outline' },
];

export default function ChecklistScreen({ navigation }) {
  const [checks, setChecks] = useState({ helmet: false, mask: false, emergencyKit: false });
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  // Keep checklist state keyed by item so Firestore receives predictable fields.
  const toggle = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Store each safety item separately so supervisor reports can flag incomplete checks.
      await addDoc(collection(db, 'checklists'), {
        userId: auth.currentUser.uid,
        date: Timestamp.now(),
        helmet: checks.helmet,
        mask: checks.mask,
        emergencyKit: checks.emergencyKit,
        comments,
      });
      Alert.alert('Submitted', 'Your safety check has been recorded.', [
        // No onDone param — useFocusEffect on the dashboard re-fetches automatically
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  // A partially completed checklist is still allowed, but the UI warns the worker first.
  const allChecked = Object.values(checks).every(Boolean);
  const checkedCount = Object.values(checks).filter(Boolean).length;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back-outline" size={18} color="#e74c3c" />
          <Text style={styles.backTxt}> Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Pre-Shift Safety Check</Text>
        <Text style={styles.sub}>Toggle each item to confirm it has been checked</Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(checkedCount / ITEMS.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressTxt}>{checkedCount}/{ITEMS.length} items confirmed</Text>

        {ITEMS.map(item => (
          <View key={item.key} style={[styles.card, checks[item.key] && styles.cardChecked]}>
            <View style={[styles.iconBox, { backgroundColor: checks[item.key] ? '#0f2a0f' : '#1f0a0a' }]}>
              <Ionicons name={item.icon} size={22} color={checks[item.key] ? '#4caf50' : '#e74c3c'} />
            </View>
            <View style={styles.cardLeft}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={checks[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: '#2a2a2a', true: '#4caf50' }}
              thumbColor={checks[item.key] ? '#fff' : '#555'}
            />
          </View>
        ))}

        <Text style={styles.label}>Comments (optional)</Text>
        <View style={styles.textAreaRow}>
          <Ionicons name="chatbubble-outline" size={16} color="#555" style={{ marginTop: 2 }} />
          <TextInput
            style={styles.input}
            placeholder="Any issues or notes..."
            placeholderTextColor="#444"
            multiline
            numberOfLines={3}
            value={comments}
            onChangeText={setComments}
          />
        </View>

        {!allChecked && (
          <View style={styles.warning}>
            <Ionicons name="warning-outline" size={16} color="#e74c3c" />
            <Text style={styles.warningTxt}> Not all items confirmed — submission will be flagged as incomplete.</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.btn, allChecked && styles.btnClear]} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <View style={styles.btnInner}>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.btnTxt}> Submit Checklist</Text>
              </View>
            )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  scroll: { padding: 20, paddingTop: 55, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backTxt: { color: '#e74c3c', fontSize: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  sub: { color: '#666', fontSize: 13, marginBottom: 16 },

  progressBar: { height: 4, backgroundColor: '#222', borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#e74c3c', borderRadius: 4 },
  progressTxt: { color: '#666', fontSize: 12, marginBottom: 20 },

  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a', gap: 12 },
  cardChecked: { borderColor: '#1a3a1a' },
  iconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardLeft: { flex: 1 },
  itemLabel: { color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  itemDesc: { color: '#666', fontSize: 12 },

  label: { color: '#888', fontSize: 13, marginBottom: 8, marginTop: 8 },
  textAreaRow: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, gap: 8, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  input: { flex: 1, color: '#fff', fontSize: 14, textAlignVertical: 'top' },

  warning: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1f0a0a', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#3a1010' },
  warningTxt: { color: '#e74c3c', fontSize: 13, flex: 1 },

  btn: { backgroundColor: '#c0392b', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnClear: { backgroundColor: '#27ae60' },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
