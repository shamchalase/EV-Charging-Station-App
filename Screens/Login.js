import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Colors, Shadows, BorderRadius, Spacing, Typography } from '../Components/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { currentUser } from '../Components/data';

function Login({ navigation }) {
  const [email, setEmail] = useState('alex.rivera@evdriver.com');
  const [password, setPassword] = useState('voltcharge2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Incomplete Fields', 'Please enter both your email/username and password to continue.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigation.replace('Home');
    }, 400);
  };

  const handleQuickDemoLogin = () => {
    setEmail('alex.rivera@evdriver.com');
    setPassword('voltcharge2026');
    navigation.replace('Home');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceDark} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Hero Brand Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Ionicons name="flash" size={38} color={Colors.primaryNeon} />
          </View>
          <Text style={styles.brandTitle}>VoltCharge</Text>
          <Text style={styles.brandSubtitle}>Next-Gen Smart EV Charging Network</Text>
        </View>

        {/* Auth Glass Card */}
        <View style={styles.authCard}>
          <Text style={styles.cardHeader}>Welcome Back</Text>
          <Text style={styles.cardSubHeader}>Sign in to locate chargers and book slots</Text>

          {/* Email / Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email or Username</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={Colors.textMuted} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.rememberMeRow} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Ionicons 
                name={rememberMe ? "checkbox" : "square-outline"} 
                size={18} 
                color={rememberMe ? Colors.primary : Colors.textMuted} 
              />
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'A password reset link has been sent to your email.')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Main Login Button */}
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.loginButtonText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
          </TouchableOpacity>

          {/* 1-Click Quick Demo Button */}
          <TouchableOpacity 
            style={styles.demoButton} 
            onPress={handleQuickDemoLogin}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={Colors.primaryDark} style={{ marginRight: 6 }} />
            <Text style={styles.demoButtonText}>1-Click Quick Demo Login</Text>
          </TouchableOpacity>

          {/* User Account Mock Preview */}
          <View style={styles.driverBadge}>
            <View style={styles.driverAvatar}>
              <Text style={styles.avatarLetter}>A</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.driverName}>Active Driver: {currentUser.name}</Text>
              <Text style={styles.driverVehicle}>🚗 {currentUser.vehicle.model} • {currentUser.vehicle.currentBatteryPct}% Battery</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to VoltCharge Terms & EV Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceDark,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(5, 182, 107, 0.15)',
    borderWidth: 2,
    borderColor: Colors.primaryNeon,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.glow,
  },
  brandTitle: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
  },
  cardHeader: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  cardSubHeader: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  forgotText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.semiBold,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.glow,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  demoButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    height: 46,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(5, 182, 107, 0.3)',
  },
  demoButtonText: {
    color: Colors.primaryDark,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  driverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    marginTop: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  driverAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.sm,
  },
  driverName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  driverVehicle: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: '85%',
  },
});

export default Login;