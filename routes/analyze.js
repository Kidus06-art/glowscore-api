const handleSubmit = async () => {
  if (!beforeImage || !afterImage) {
    Alert.alert('Missing photos', 'Please upload both before and after images.');
    return;
  }

  try {
    setIsLoading(true);

    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const beforeUrl = await uploadImageToFirebase(beforeImage, 'before');
    const afterUrl = await uploadImageToFirebase(afterImage, 'after');

    const response = await fetch('https://glowscore-api.onrender.com/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beforeUrl, afterUrl }),
    });

    const data = await response.json();

    console.log('Full API response:', data); // DEBUG LINE

    setIsLoading(false);

    if (data && data.result && data.result.score !== undefined) {
      Alert.alert(`GlowScore: ${data.result.score}`, data.result.description || 'Glow-up detected!');
    } else {
      Alert.alert('Analysis failed', 'Try uploading clearer photos with visible faces.');
    }

  } catch (err) {
    console.error('Frontend error:', err);
    setIsLoading(false);
    Alert.alert('Upload failed', 'There was an issue analyzing your glow-up.');
  }
};
