import React, { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type KeyboardAwareScrollViewProps = PropsWithChildren<{
  keyboardVerticalOffset?: number;
  behavior?: 'padding' | 'height' | 'position';
  contentContainerStyle?: object;
}>;

export default function KeyboardAvoidingWrapper({
  children,
  keyboardVerticalOffset = 0,
  behavior = Platform.OS === 'ios' ? 'padding' : 'height',
  contentContainerStyle = {},
}: KeyboardAwareScrollViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={Platform.select({
          ios: 'dark-content',
          android: 'dark-content',
        })}
        backgroundColor="#F8FAFC"
      />
      <KeyboardAvoidingView
        behavior={behavior}
        style={styles.avoidingView}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          contentContainerStyle={StyleSheet.flatten([
            styles.scrollViewContent,
            contentContainerStyle,
          ])}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  avoidingView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 0,
    gap: 10,
  },
});
