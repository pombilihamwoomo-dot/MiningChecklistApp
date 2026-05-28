import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Image, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SAFETY_CARDS = [
  { icon: 'shield-checkmark-outline', title: 'Equipment checks', desc: 'Helmet, mask and emergency kit verified before every shift — no exceptions.' },
  { icon: 'time-outline', title: 'Timestamped records', desc: 'Every submission stored with date and time — a permanent audit trail.' },
  { icon: 'people-outline', title: 'Supervisor oversight', desc: 'View all worker submissions from one dashboard in real time.' },
];

const STEPS = [
  { num: '1', title: 'Sign in to your account', desc: 'Workers and supervisors each have their own secure login with role-based access.' },
  { num: '2', title: 'Complete the safety checklist', desc: 'Confirm helmet, dust mask, and emergency kit before entering underground areas.' },
  { num: '3', title: 'Submit and get confirmed', desc: 'Your check is stored instantly in Firebase. Supervisors see it immediately.' },
];

// Animated Button with press effect
const AnimatedButton = ({ onPress, icon, text, style, textStyle, isPrimary }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
      tension: 100
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 100
    }).start();
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        <Ionicons name={icon} size={18} color={isPrimary ? "#fff" : "#e74c3c"} />
        <Text style={textStyle}>{text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Pulsing Button that pulses periodically
const PulsingButton = ({ onPress, icon, text, style, textStyle, isPrimary, pulseInterval = 3000 }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Set up periodic pulsing (every 3 seconds by default)
    const interval = setInterval(() => {
      // Pulse animation sequence
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, pulseInterval);
    
    return () => clearInterval(interval);
  }, [pulseInterval]);
  
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
      tension: 100
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 100
    }).start();
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View style={[style, { transform: [{ scale: Animated.multiply(scaleValue, pulseAnim) }] }]}>
        <Ionicons name={icon} size={18} color={isPrimary ? "#fff" : "#e74c3c"} />
        <Text style={textStyle}>{text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Pulsing/Bouncing Logo Component
const PulsingLogo = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Create a continuous pulse/bounce effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.logoWrapper, 
        { 
          transform: [{ scale: pulseAnim }]
        }
      ]}
    >
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

// Fade-in animation wrapper
const FadeInView = ({ children, delay = 0, direction = 'up', style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(direction === 'up' ? 30 : direction === 'down' ? -30 : 0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      })
    ]).start();
  }, []);
  
  return (
    <Animated.View style={[
      style, 
      { 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      {children}
    </Animated.View>
  );
};

// Staggered card animation
const StaggeredCard = ({ icon, title, desc, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 3
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3
    }).start();
  };
  
  return (
    <FadeInView delay={index * 100} direction="right">
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.cardIcon}>
            <Ionicons name={icon} size={20} color="#e74c3c" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDesc}>{desc}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </FadeInView>
  );
};

export default function LandingScreen({ navigation }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp'
  });
  
  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: 'clamp'
  });
  
  return (
    <Animated.ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
    >
      <StatusBar barStyle="light-content" />

      {/* Hero Section */}
      <Animated.View style={[styles.hero, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <FadeInView delay={200}>
          <PulsingLogo />
        </FadeInView>
        
        <FadeInView delay={400}>
          <Text style={styles.appName}>Mining Safety</Text>
        </FadeInView>
        
        <FadeInView delay={600}>
          <Text style={styles.appTag}>CHECKLIST APP</Text>
        </FadeInView>
        
        <FadeInView delay={800}>
          <Text style={styles.heroSub}>
            Digitising underground pre-shift safety checks.{'\n'}Keep every worker safe, every single shift.
          </Text>
        </FadeInView>
        
        <FadeInView delay={1000}>
          <View style={styles.btnRow}>
            {/* Sign In button with periodic pulsing */}
            <PulsingButton
              onPress={() => navigation.navigate('Login')}
              icon="log-in-outline"
              text="Sign In"
              style={styles.btnPrimary}
              textStyle={styles.btnPrimaryTxt}
              isPrimary={true}
              pulseInterval={3000} // Pulses every 3 seconds
            />
            {/* Register button - normal, no pulsing */}
            <AnimatedButton
              onPress={() => navigation.navigate('Register')}
              icon="person-add-outline"
              text="Register"
              style={styles.btnSecondary}
              textStyle={styles.btnSecondaryTxt}
              isPrimary={false}
            />
          </View>
        </FadeInView>
      </Animated.View>

      {/* Why safety checks matter */}
      <View style={styles.section}>
        <FadeInView delay={200} direction="left">
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={18} color="#e74c3c" />
            <Text style={styles.sectionTitle}> Why safety checks matter</Text>
          </View>
        </FadeInView>
        
        <FadeInView delay={400}>
          <Text style={styles.sectionSub}>
            Underground mining is one of the world's most dangerous occupations
          </Text>
        </FadeInView>

        {SAFETY_CARDS.map((c, i) => (
          <StaggeredCard key={i} icon={c.icon} title={c.title} desc={c.desc} index={i} />
        ))}
      </View>

      <View style={styles.divider} />

      {/* How it works */}
      <View style={styles.section}>
        <FadeInView delay={200} direction="right">
          <View style={styles.sectionHeader}>
            <Ionicons name="git-branch-outline" size={18} color="#e74c3c" />
            <Text style={styles.sectionTitle}> How it works</Text>
          </View>
        </FadeInView>
        
        <FadeInView delay={400}>
          <Text style={styles.sectionSub}>
            Three simple steps to a safer shift
          </Text>
        </FadeInView>

        {STEPS.map((s, i) => (
          <FadeInView key={i} delay={i * 150 + 600} direction="right">
            <View style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumTxt}>{s.num}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
            {i < STEPS.length - 1 && <View style={styles.stepLine} />}
          </FadeInView>
        ))}
      </View>

      <View style={styles.divider} />

      {/* CTA Section */}
      <View style={styles.section}>
        <FadeInView delay={200}>
          <View style={styles.sectionHeader}>
            <Ionicons name="rocket-outline" size={18} color="#e74c3c" />
            <Text style={styles.sectionTitle}> Ready to get started?</Text>
          </View>
        </FadeInView>
        
        <FadeInView delay={400}>
          <Text style={styles.sectionSub}>
            Join your team and stay protected underground
          </Text>
        </FadeInView>
        
        <FadeInView delay={600}>
          <View style={styles.btnRow}>
            {/* Sign In button with periodic pulsing */}
            <PulsingButton
              onPress={() => navigation.navigate('Login')}
              icon="log-in-outline"
              text="Sign In"
              style={styles.btnPrimary}
              textStyle={styles.btnPrimaryTxt}
              isPrimary={true}
              pulseInterval={3000} // Pulses every 3 seconds
            />
            {/* Register button - normal, no pulsing */}
            <AnimatedButton
              onPress={() => navigation.navigate('Register')}
              icon="person-add-outline"
              text="Create Account"
              style={styles.btnSecondary}
              textStyle={styles.btnSecondaryTxt}
              isPrimary={false}
            />
          </View>
        </FadeInView>
      </View>

      {/* Footer */}
      <FadeInView delay={800}>
        <View style={styles.footer}>
          <Text style={styles.footerTxt}>Mining Safety Checklist · Group 6 · 2026</Text>
        </View>
      </FadeInView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },

  hero: { padding: 28, paddingTop: 60, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  logo: { width: 120, height: 120, borderRadius: 60 },
  logoWrapper: { 
    width: 144, 
    height: 144, 
    borderRadius: 72, 
    backgroundColor: '#1a0505', 
    borderWidth: 2, 
    borderColor: '#c0392b', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16,
    shadowColor: '#c0392b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#e74c3c', letterSpacing: 1 },
  appTag: { fontSize: 11, color: '#c0392b', letterSpacing: 4, fontWeight: '700', marginBottom: 12 },
  heroSub: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 28 },

  btnRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  btnPrimary: { 
    backgroundColor: '#c0392b', 
    borderRadius: 10, 
    paddingVertical: 13, 
    paddingHorizontal: 28, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    shadowColor: '#c0392b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnPrimaryTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnSecondary: { 
    backgroundColor: 'transparent', 
    borderRadius: 10, 
    paddingVertical: 11, 
    paddingHorizontal: 28, 
    borderWidth: 2, 
    borderColor: '#c0392b', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  btnSecondaryTxt: { color: '#e74c3c', fontWeight: 'bold', fontSize: 15 },

  section: { padding: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  sectionSub: { fontSize: 12, color: '#555', marginBottom: 18 },
  divider: { height: 1, backgroundColor: '#1a1a1a', marginHorizontal: 24 },

  warnBox: { 
    backgroundColor: '#1f0a0a', 
    borderWidth: 1, 
    borderColor: '#3a1010', 
    borderRadius: 10, 
    padding: 14, 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 16,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  warnTxt: { color: '#e74c3c', fontSize: 12, lineHeight: 18, flex: 1 },

  card: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 10, 
    padding: 14, 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 10, 
    borderLeftWidth: 3, 
    borderLeftColor: '#c0392b', 
    borderWidth: 1, 
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#1f0a0a', alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 3 },
  cardDesc: { fontSize: 11, color: '#555', lineHeight: 16 },

  step: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#c0392b', alignItems: 'center', justifyContent: 'center', minWidth: 28 },
  stepNumTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 3 },
  stepDesc: { fontSize: 11, color: '#555', lineHeight: 16 },
  stepLine: { width: 2, height: 14, backgroundColor: '#2a2a2a', marginLeft: 13 },

  footer: { padding: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  footerTxt: { fontSize: 11, color: '#333' },
});