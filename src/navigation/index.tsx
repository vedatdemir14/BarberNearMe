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
import RatingScreen from '../screens/customer/RatingScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';

// ── Barber screens ────────────────────────────────────────────
import BarberDashboardScreen from '../screens/barber/BarberDashboardScreen';
import BarberAppointmentsScreen from '../screens/barber/BarberAppointmentsScreen';

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
  Messaging: { barberId: string; barberName: string };
  Rating: { appointmentId: string };
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
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="BarberDashboard" component={BarberDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="BarberAppointments" component={BarberAppointmentsScreen} options={{ title: 'Randevular' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
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
      <Tab.Screen name="Appointments" component={AppointmentsListScreen} options={{ title: 'R