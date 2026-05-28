import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('worker');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Fill in all fields.');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), { userId: cred.user.uid, name, role });
    } catch (e) {
      Alert.alert('Registration Failed', e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>

          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Create Account</Text>

          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666"
              value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666"
              autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666"
              secureTextEntry={!showPass} value={password} onChangeText={setPassword} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#888" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Select Role</Text>
          <View style={styles.roleRow}>
            {[
              { key: 'worker', label: 'Worker', icon: 'construct-outline' },
              { key: 'supervisor', label: 'Supervisor', icon: 'briefcase-outline' },
            ].map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
                onPress={() => setRole(r.key)}
              >
                <Ionicons name={r.icon} size={20} color={role === r.key ? '#e74c3c' : '#666'} />
                <Text style={[styles.roleTxt, role === r.key && styles.roleTxtActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={styles.btnInner}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.btnText}>Register</Text>
                </View>
              )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  logoWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1a0505', borderWidth: 2, borderColor: '#c0392b', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logo: { width: 80, height: 80, borderRadius: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#e74c3c', marginBottom: 20 },
  inputRow: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#2a2a2a', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#fff', paddingVertical: 14, fontSize: 15 },
  eyeBtn: { padding: 4 },
  label: { color: '#888', alignSelf: 'flex-start', marginBottom: 10, fontSize: 13 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20, width: '100%' },
  roleBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#2a2a2a', alignItems: 'center', backgroundColor: '#111', gap: 6 },
  roleBtnActive: { borderColor: '#e74c3c', backgroundColor: '#1f0a0a' },
  roleTxt: { color: '#666', fontWeight: '600', fontSize: 13 },
  roleTxtActive: { color: '#e74c3c' },
  btn: { width: '100%', backgroundColor: '#c0392b', borderRadius: 10, padding: 15, alignItems: 'center' },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#e74c3c', marginTop: 18, fontSize: 13 },
});