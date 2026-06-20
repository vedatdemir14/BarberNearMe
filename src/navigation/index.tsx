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
import PaymentScreen from '../screens/customer/PaymentScreen';
import AppointmentsListScreen from '../screens/customer/AppointmentsListScreen';
import MessagingScreen from '../screens/customer/MessagingScreen';
import MessagesListScreen from '../screens/customer/MessagesListScreen';
import RatingScreen from '../screens/customer/RatingScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import MyReviewsScreen from '../screens/customer/MyReviewsScreen';
import NotificationsScreen from '../screens/customer/NotificationsScreen';
import SettingsScreen from '../screens/customer/SettingsScreen';

// ── Barber screens ────────────────────────────────────────────
import BarberDashboardScreen from '../screens/barber/BarberDashboardScreen';
import BarberAppointmentsScreen from '../screens/barber/BarberAppointmentsScreen';
import BarberProfileScreen from '../screens/barber/BarberProfileScreen';

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
  BarberTabs: undefined;
  BarberAppointments: undefined;
  BarberDetail: { barberId: string };
  Appointment: { barberId: string };
  AppointmentConfirm: { appointmentId: string };
  Payment: {
    barberId: string;
    barberName: string;
    serviceName: string;
    servicePrice: number;
    serviceId: string;
    date: string;
    timeSlot: string;
    staffName: string;
    staffId: string;
  };
  Messaging: { barberId: string; barberName: string; conversationId?: string };
  Rating: { appointmentId: string };
  MyReviews: undefined;
  Notifications: undefined;
  Settings: undefined;
  BarberRegStep1: undefined;
  BarberRegStep2: { uid: string };
  BarberRegStep3: { uid: string };
  BarberRegStep4: { uid: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function BarberTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { borderTopColor: Colors.border },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            BarberDashboard: focused ? 'grid' : 'grid-outline',
            BarberAppointments: focused ? 'calendar' : 'calendar-outline',
            Profile: focused ? 'storefront' : 'storefront-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="BarberDashboard" component={BarberDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="BarberAppointments" component={BarberAppointmentsScreen} options={{ title: 'Randevular' }} />
      <Tab.Screen name="Profile" component={BarberProfileScreen} options={{ title: 'Dükkan' }} />
    </Tab.Navigator>
  );
}

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
      <Tab.Screen name="Messages" component={MessagesListScreen} options={{ title: 'Mesajlar' }} />
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
        ) : profile?.role === 'barber' ? (
          // Barber app stack
          <>
            <Stack.Screen name="BarberTabs" component={BarberTabs} />
            <Stack.Screen name="BarberAppointments" component={BarberAppointmentsScreen} />
            <Stack.Screen name="BarberRegStep2" component={BarberRegStep2Screen} />
            <Stack.Screen name="BarberRegStep3" component={BarberRegStep3Screen} />
            <Stack.Screen name="BarberRegStep4" component={BarberRegStep4Screen} />
          </>
        ) : (
          // Customer app stack
          <>
            <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
            <Stack.Screen name="BarberDetail" component={BarberDetailScreen} />
            <Stack.Screen name="Appointment" component={AppointmentScreen} />
            <Stack.Screen name="AppointmentConfirm" component={AppointmentConfirmScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="Messaging" component={MessagingScreen} />
            <Stack.Screen name="Rating" component={RatingScreen} />
            <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
