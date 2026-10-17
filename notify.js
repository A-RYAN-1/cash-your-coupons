import { Alert, Platform } from "react-native";

// React Native's Alert does nothing on the web, so errors would be invisible there.
export function notify(title, message) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}
