import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants';

// ── Auth screens ──────────────────────────────────────────────
import IntroScreen from '../screens/auth/IntroScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// ── Customer screens ──────────────────────────────────────────
import HomeScreen from '../screens/customer/HomeScreen';
import BarberDetailScreen from '../screens/customer/BarberDetailScreen';
import AppointmentScreen from '../screens/customer/AppointmentScreen';
import AppointmentConfirmScreen from '../screens/customer/AppointmentConfirmScreen';
import AppointmentsListScreen from '../screens/customer/AppointmentsListScreen';
import MessagingScreen from '../screens/customer/MessagingScreen';
import RatingScreen from '../screens/customer/RatingScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';

// ── Barber registration screens ───────────────────────────────
import BarberRegStep1Screen from '../screens/barber/BarberRegStep1Screen';
import BarberRegStep2Screen from '../screens/barber/BarberRegStep2Screen';
import BarberRegStep3Screen from '../screens/barber/BarberRegStep3Screen';
import BarberRegStep4Screen from '../screens/barber/BarberRegStep4Screen';

export type RootStackParamList = {
  Intro: undefined;
  Login: undefined;
  SignUp: undefined;
  CustomerTabs: undefined;
  BarberDetail: { barberId: string };
  Appointment: { barberId: string };
  AppointmentConfirm: { appointmentId: string };
  Messaging: { barberId: string; barberName: string };
  Rating: { appointmentId: string };
  BarberRegStep1: undefined;
  BarberRegStep2: { uid: string };
  BarberRegStep3: { uid: string };
  BarberRegStep4: { uid: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { borderTopColor: Colors.border },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            Home: focused ? 'home' : 'home-outline',
            Appointments: focused ? 'calendar' : 'calendar-outline',
            Messages: focused ? 'chatbubble' : 'chatbubble-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="Appointments" component={AppointmentsListScreen} options={{ title: 'Randevular' }} />
      <Tab.Screen name="Messages" component={MessagingScreen} options={{ title: 'Mesajlar' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth stack
          <>
            <Stack.Screen name="Intro" component={IntroScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="BarberRegStep1" component={BarberRegStep1Screen} />
            <Stack.Screen name="BarberRegStep2" component={BarberRegStep2Screen} />
            <Stack.Screen name="BarberRegStep3" component={BarberRegStep3Screen} />
            <Stack.Screen name="BarberRegStep4" component={BarberRegStep4Screen} />
          </>
        ) : (
          // App stack
          <>
            <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
            <Stack.Screen name="BarberDetail" component={BarberDetailScreen} />
            <Stack.Screen name="Appointment" component={AppointmentScreen} />
            <Stack.Screen name="AppointmentConfirm" component={AppointmentConfirmScreen} />
            <Stack.Screen name="Messaging" component={MessagingScreen} />
            <Stack.Screen name="Rating" component={RatingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
