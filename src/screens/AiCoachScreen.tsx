import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import { GiftedChat, IMessage, Bubble } from 'react-native-gifted-chat';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AiCoach'>;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const AiCoachScreen: React.FC<Props> = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Hello! I\'m your AI life coach. How can I help you improve your well-being and achieve personal growth today?',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Coach',
          avatar: 'https://placekitten.com/200/200',
        },
      },
    ]);
  }, []);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, newMessages)
    );

    const userMessage = newMessages[0].text;

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an empathetic and supportive life coach, dedicated to helping people improve their well-being, achieve personal growth, and overcome life challenges. Focus on providing practical, actionable advice while maintaining a compassionate and understanding approach. Draw from principles of positive psychology, mindfulness, and personal development to guide users toward their best selves.',
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        model: 'gpt-4',
      });

      const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I couldn\'t process that.';

      const aiMessage: IMessage = {
        _id: Math.random().toString(),
        text: aiResponse,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Coach',
          avatar: 'https://placekitten.com/200/200',
        },
      };

      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [aiMessage])
      );
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      const errorMessage: IMessage = {
        _id: Math.random().toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Coach',
          avatar: 'https://placekitten.com/200/200',
        },
      };

      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [errorMessage])
      );
    }
  }, []);

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#1E90FF',
          },
          left: {
            backgroundColor: '#1E1E1E',
          },
        }}
        textStyle={{
          right: {
            color: '#fff',
          },
          left: {
            color: '#fff',
          },
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatContainer}>
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: 1,
          }}
          renderAvatar={null}
          placeholder="Ask your AI coach..."
          renderBubble={renderBubble}
          alwaysShowSend
          scrollToBottom
          inverted={true}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
});

export default AiCoachScreen;
