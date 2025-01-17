// src/components/AuthenticatedScreen.js

import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const AuthenticatedScreen = ({ user, handleAuthentication }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user.email}</Text>
      <Button title="Logout" onPress={handleAuthentication} color="#e74c3c" />
    </View>
  );
}; 

const styles = StyleSheet.create({
  // Define your styles here
});

export default AuthenticatedScreen;
