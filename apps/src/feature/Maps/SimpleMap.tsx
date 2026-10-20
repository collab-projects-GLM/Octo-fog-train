import React from "react";
import MapView from "react-native-maps";
import { View, StyleSheet } from "react-native";

/**
 * @abstract This fucntion retuns a simple map render
 * @returns JSX
 */

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});

export default function MapViewComponent() {
  return (
    <View className="w-full flex-1">
      <MapView style={styles.map} />
    </View>
  );
}
