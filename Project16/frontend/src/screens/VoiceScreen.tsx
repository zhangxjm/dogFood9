import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { voiceApi } from '../services/api';
import wsService from '../services/websocket';

interface CommandHistory {
  id: string;
  text: string;
  result: string;
  success: boolean;
  timestamp: Date;
}

const VoiceScreen: React.FC = () => {
  const { user } = useAuth();
  const [commandText, setCommandText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [supportedCommands, setSupportedCommands] = useState<string[]>([]);

  useEffect(() => {
    loadSupportedCommands();
  }, []);

  const loadSupportedCommands = async () => {
    try {
      const res = await voiceApi.getSupportedCommands();
      setSupportedCommands(res.data.data);
    } catch (error) {
      console.error('Load commands error:', error);
    }
  };

  const sendCommand = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    const commandToSend = text.trim();
    
    try {
      let result;
      if (wsService.isConnected() && user?.roomId) {
        result = await wsService.sendVoiceCommand(commandToSend, user.roomId);
      } else {
        result = await voiceApi.sendCommand(commandToSend, user?.roomId);
      }

      const data = result?.data || result;
      
      const historyItem: CommandHistory = {
        id: Date.now().toString(),
        text: commandToSend,
        result: data?.message || '操作成功',
        success: data?.success ?? true,
        timestamp: new Date(),
      };
      
      setHistory(prev => [historyItem, ...prev].slice(0, 20));
      setCommandText('');
      
      if (!data?.success) {
        Alert.alert('提示', data?.message || '指令执行失败');
      }
    } catch (error: any) {
      const historyItem: CommandHistory = {
        id: Date.now().toString(),
        text: commandToSend,
        result: error.message || '执行失败',
        success: false,
        timestamp: new Date(),
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 20));
      Alert.alert('错误', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        const demoCommands = ['打开主灯', '空调温度24度', '睡眠模式'];
        const randomCommand = demoCommands[Math.floor(Math.random() * demoCommands.length)];
        setCommandText(randomCommand);
      }, 2000);
    }
  };

  const quickCommands = [
    { text: '打开主灯', icon: 'bulb' },
    { text: '关闭灯光', icon: 'bulb-outline' },
    { text: '打开空调', icon: 'snow' },
    { text: '空调24度', icon: 'thermometer' },
    { text: '打开窗帘', icon: 'easel' },
    { text: '睡眠模式', icon: 'moon' },
    { text: '阅读模式', icon: 'book' },
    { text: '全部关闭', icon: 'power' },
  ];

  const renderHistoryItem = ({ item }: { item: CommandHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Ionicons
          name={item.success ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={item.success ? '#48bb78' : '#fc8181'}
        />
        <Text style={styles.historyTime}>
          {item.timestamp.toLocaleTimeString('zh-CN')}
        </Text>
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyCommand}>{item.text}</Text>
        <Text style={[styles.historyResult, !item.success && styles.historyResultError]}>
          {item.result}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a365d', '#2c5282']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>语音控制</Text>
        <Text style={styles.headerSubtitle}>说出指令，智能控制</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.voiceInputContainer}>
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={toggleListening}
            disabled={isProcessing}
          >
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={48}
              color={isListening ? '#fff' : '#2c5282'}
            />
          </TouchableOpacity>
          <Text style={styles.micHint}>
            {isListening ? '正在聆听...' : '点击麦克风说话'}
          </Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="或输入语音指令..."
            placeholderTextColor="#a0aec0"
            value={commandText}
            onChangeText={setCommandText}
            onSubmitEditing={() => sendCommand(commandText)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => sendCommand(commandText)}
            disabled={isProcessing || !commandText.trim()}
          >
            {isProcessing ? (
              <Ionicons name="hourglass" size={24} color="#fff" />
            ) : (
              <Ionicons name="send" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快捷指令</Text>
          <View style={styles.quickCommandsGrid}>
            {quickCommands.map((cmd, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickCommandButton}
                onPress={() => sendCommand(cmd.text)}
                disabled={isProcessing}
              >
                <Ionicons name={cmd.icon as any} size={20} color="#2c5282" />
                <Text style={styles.quickCommandText}>{cmd.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>支持的指令</Text>
          <View style={styles.commandsList}>
            {supportedCommands.map((cmd, index) => (
              <View key={index} style={styles.commandItem}>
                <Ionicons name="mic" size={16} color="#4299e1" />
                <Text style={styles.commandText}>{cmd}</Text>
              </View>
            ))}
          </View>
        </View>

        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>历史记录</Text>
            <FlatList
              data={history}
              renderItem={renderHistoryItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={24} color="#4299e1" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>使用提示</Text>
            <Text style={styles.tipText}>
              您可以通过语音控制房间内的所有智能设备，包括灯光、空调、窗帘、电视等。
              也可以直接切换到预设的场景模式，体验更加便捷的智能生活。
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  voiceInputContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  micButtonActive: {
    backgroundColor: '#e53e3e',
    borderColor: '#fc8181',
    shadowColor: '#e53e3e',
    shadowOpacity: 0.4,
  },
  micHint: {
    marginTop: 15,
    color: '#718096',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 16,
    color: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#3182ce',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  quickCommandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  quickCommandButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  quickCommandText: {
    marginLeft: 8,
    color: '#2d3748',
    fontSize: 14,
  },
  commandsList: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commandText: {
    marginLeft: 10,
    color: '#4a5568',
    fontSize: 14,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTime: {
    marginLeft: 8,
    color: '#a0aec0',
    fontSize: 12,
  },
  historyContent: {},
  historyCommand: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  historyResult: {
    fontSize: 14,
    color: '#48bb78',
  },
  historyResultError: {
    color: '#fc8181',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#ebf8ff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2b6cb0',
    marginBottom: 5,
  },
  tipText: {
    color: '#2c5282',
    fontSize: 14,
    lineHeight: 22,
  },
});

export default VoiceScreen;
