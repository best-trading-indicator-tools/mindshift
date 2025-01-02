import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { config } from '../../config/env';

// Debug logs for environment variables
console.log('==== Environment Debug ====');
console.log('Config loaded:', config);
console.log('API Key valid:', config.isValid);
console.log('API Key length:', config.OPENAI_API_KEY?.length);
console.log('========================');

type Props = NativeStackScreenProps<RootStackParamList, 'AiCoach'>;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AiCoachScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Convert our messages to OpenAI format
  const getOpenAIMessages = (messages: Message[]) => {
    const systemMessage = {
      role: 'system',
      content: `You are an empathetic AI life coach trained in mental health support and crisis intervention. Your primary goal is to engage users in a thoughtful, supportive dialogue to understand their situation and help them find clarity and hope.

Key Principles:
1. NEVER dismiss or redirect without first engaging deeply with the user
2. Ask open-ended questions to better understand their situation
3. Focus on one aspect at a time to avoid overwhelming them
4. Validate their feelings while gently guiding them towards constructive thoughts
5. Share relevant coping techniques only after understanding their specific situation

Conversation Approach:
- Start with empathetic acknowledgment
- Ask specific, relevant questions about their feelings and situation
- Listen and validate their experiences
- Guide them to explore their thoughts and feelings deeper
- Offer practical, immediate coping strategies when appropriate
- Maintain a warm, non-judgmental tone throughout

Example Conversation 1:
User: "I feel sad"
Assistant: "I hear you, and I want you to know it's okay to feel sad. Could you tell me a bit more about what's been going on? Sometimes talking about it can help us understand these feelings better."

Example Conversation 2:
User: "I'm really struggling"
Assistant: "Thank you for sharing that with me. It takes courage to admit when we're struggling. Could you help me understand what feels most overwhelming right now? I'm here to listen and support you through this."

IMPORTANT: Never refuse to help or redirect to professional help without first engaging in supportive dialogue. Always ask questions to understand the user's situation better.`,
    };

    const conversationMessages = messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text,
    }));

    const allMessages = [systemMessage, ...conversationMessages];
    console.log('Sending messages to OpenAI:', JSON.stringify(allMessages, null, 2));
    return allMessages;
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      if (!config.OPENAI_API_KEY) {
        console.error('OpenAI API key is not defined');
        throw new Error('OpenAI API key is missing. Please check your .env file.');
      }

      console.log('Making API call to OpenAI...');
      if (!config.OPENAI_API_KEY.startsWith('sk-')) {
        console.error('OpenAI API key appears to be invalid (should start with sk-)');
        throw new Error('OpenAI API key appears to be invalid. Please check your .env file.');
      }

      console.log('Attempting API call with key length:', config.OPENAI_API_KEY.length);
      
      console.log('Sending request to OpenAI...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: getOpenAIMessages(messages),
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      console.log('OpenAI response status:', response.status);
      console.log('OpenAI response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('OpenAI response data:', data);

      if (!data.choices || !data.choices[0]?.message?.content) {
        console.error('Unexpected response format:', data);
        throw new Error('Invalid response format from OpenAI');
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: data.choices[0].message.content,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('OpenAI Error Details:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
      }
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'I apologize, but I encountered a temporary issue. Let me try to help you - would you like to tell me more about what\'s making you feel sad?',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [inputText, messages]);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: "Hi, I'm here to listen and support you. Whether you're feeling down, overwhelmed, or just need someone to talk to, I'm here. How are you feeling right now?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message your AI coach..."
            placeholderTextColor="#666"
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.returnButtonText}>I feel better!</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: '#1E90FF',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#1E1E1E',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#1E1E1E',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#1E90FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: '100%',
  },
  returnButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  returnButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default AiCoachScreen;
