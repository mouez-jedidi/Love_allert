import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from './config';

import LoadingScreen from './screens/LoadingScreen';
import NoInternetScreen from './screens/NoInternetScreen';
import SplashScreen from './screens/SplashScreen';
import AuthScreen from './screens/AuthScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import HomeScreen from './screens/HomeScreen';
import MatchScreen from './screens/MatchScreen';
import ChatScreen from './screens/ChatScreen';
import ChatListScreen from './screens/ChatListScreen';
import MyProfileScreen from './screens/MyProfileScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen';
import VerifyPhoneScreen from './screens/VerifyPhoneScreen';
import CameraScreen from './screens/CameraScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import TermsScreen from './screens/TermsScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import BlockReportScreen from './screens/BlockReportScreen';
import GalleryScreen from './screens/GalleryScreen';
import BlockedUsersScreen from './screens/BlockedUsersScreen';
import AboutScreen from './screens/AboutScreen';
const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState('Onboarding');
  const [checking, setChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const onboardingDone = await AsyncStorage.getItem('onboardingDone');
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        setInitialRoute(onboardingDone ? 'Splash' : 'Onboarding');
        setChecking(false);
        return;
      }

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        await AsyncStorage.clear();
        await AsyncStorage.setItem('onboardingDone', 'true');
        setInitialRoute('Splash');
        setChecking(false);
        return;
      }

      const me = await res.json();

      if (!me || !me._id) {
        await AsyncStorage.clear();
        await AsyncStorage.setItem('onboardingDone', 'true');
        setInitialRoute('Splash');
        setChecking(false);
        return;
      }

if (!me.photo) {
  setInitialRoute('Profile');
} else {
  setInitialRoute('Home');
}
    } catch (err) {
      console.log('checkAuth error:', err.message);
      const token = await AsyncStorage.getItem('token');
      const onboardingDone = await AsyncStorage.getItem('onboardingDone');
      if (token) {
        setInitialRoute('Home');
      } else {
        setInitialRoute(onboardingDone ? 'Splash' : 'Onboarding');
      }
    } finally {
      setChecking(false);
    }
  };

  if (checking) return <LoadingScreen />;

  if (!isConnected) {
    return (
      <NoInternetScreen
        onRetry={() =>
          NetInfo.fetch().then(state =>
            setIsConnected(state.isConnected ?? true)
          )
        }
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Match" component={MatchScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="MyProfile" component={MyProfileScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="VerifyPhone" component={VerifyPhoneScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="BlockReport" component={BlockReportScreen} />
        <Stack.Screen name="Gallery" component={GalleryScreen} />
        <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}