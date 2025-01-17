import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getImageUrls } from '../utils/firebaseUtils'; // Import your getImageUrls function

const ViewImages = ({ navigation, route }) => {
  const { userId } = route.params; // User ID passed from HomeScreen
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const urls = await getImageUrls(userId); // Fetch image URLs
        setImageUrls(urls); // Set the image URLs in state
      } catch (err) {
        console.error('Error fetching image URLs:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Loading images...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {imageUrls.length > 0 ? (
        imageUrls.map((url, index) => (
          <Image
            key={index}
            source={{ uri: url }}
            style={styles.image}
            resizeMode="cover"
          />
        ))
      ) : (
        <Text style={styles.text}>No images to display.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  image: {
    width: 300,
    height: 300,
    marginVertical: 10,
    borderRadius: 10,
  },
});

export default ViewImages;
