import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const LoginScreen: React.FC = () => {
  const [loginType, setLoginType] = useState<'staff' | 'guest'>('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [idCard, setIdCard] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, guestLogin } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      if (loginType === 'staff') {
        if (!username || !password) {
          Alert.alert('提示', '请输入用户名和密码');
          return;
        }
        await login(username, password);
      } else {
        if (!roomNumber || !idCard) {
          Alert.alert('提示', '请输入房间号和身份证号');
          return;
        }
        await guestLogin(roomNumber, idCard);
      }
    } catch (error: any) {
      Alert.alert('登录失败', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoData = () => {
    if (loginType === 'staff') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setRoomNumber('1101');
      setIdCard('110112345678901234');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1a365d', '#2c5282', '#3182ce']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Ionicons name="hotel" size={80} color="#fff" />
            <Text style={styles.title}>智能酒店客房控制系统</Text>
            <Text style={styles.subtitle}>Smart Hotel Room Control</Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, loginType === 'staff' && styles.activeTab]}
              onPress={() => setLoginType('staff')}
            >
              <Text style={[styles.tabText, loginType === 'staff' && styles.activeTabText]}>
                员工登录
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, loginType === 'guest' && styles.activeTab]}
              onPress={() => setLoginType('guest')}
            >
              <Text style={[styles.tabText, loginType === 'guest' && styles.activeTabText]}>
                宾客登录
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {loginType === 'staff' ? (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={24} color="#718096" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="用户名"
                    placeholderTextColor="#a0aec0"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={24} color="#718096" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="密码"
                    placeholderTextColor="#a0aec0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="key" size={24} color="#718096" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="房间号 (如 1101)"
                    placeholderTextColor="#a0aec0"
                    value={roomNumber}
                    onChangeText={setRoomNumber}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="card" size={24} color="#718096" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="身份证号"
                    placeholderTextColor="#a0aec0"
                    value={idCard}
                    onChangeText={setIdCard}
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>登 录</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoButton} onPress={fillDemoData}>
              <Text style={styles.demoButtonText}>填入演示数据</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              演示账号: admin/admin123 或 1101/110112345678901234
            </Text>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    padding: 5,
    marginBottom: 30,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#2c5282',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
  },
  loginButton: {
    backgroundColor: '#3182ce',
    borderRadius: 12,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoButton: {
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 10,
  },
  demoButtonText: {
    color: '#3182ce',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});

export default LoginScreen;
