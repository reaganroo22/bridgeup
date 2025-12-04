import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface MentorApplication {
  id: string;
  application_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  notes?: string;
}

export default function PendingApprovalScreen() {
  const { user, signOut } = useAuth();
  const [application, setApplication] = useState<MentorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplication = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('mentor_applications')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching application:', error);
        return;
      }

      if (data) {
        setApplication(data);
        
        // If approved, refresh the app to trigger proper 6-case routing
        if (data.application_status === 'approved') {
          console.log('[PendingApproval] Application approved! Triggering app refresh to handle Case 4 flow');
          // Force a fresh navigation check by replacing to a neutral route first, then to root
          router.replace('/auth');
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 100);
          return;
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplication();
  };

  useEffect(() => {
    fetchApplication();
  }, [user?.email]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getStatusMessage = () => {
    if (!application) {
      return {
        title: "No Application Found",
        message: "BridgeUp couldn't find a mentor application for your account. Please contact support if you believe this is an error."
      };
    }

    switch (application.application_status) {
      case 'pending':
        return {
          title: "Application Under Review",
          message: "BridgeUp is carefully reviewing your mentor application! We'll notify you via email once a decision has been made. This usually takes 1-2 business days."
        };
      case 'rejected':
        return {
          title: "Application Not Approved",
          message: "Unfortunately, your mentor application was not approved at this time. You're still welcome to use BridgeUp as a student! Check your email for more details."
        };
      default:
        return {
          title: "Application Status Unknown",
          message: "BridgeUp is having trouble determining your application status. Please contact support for assistance."
        };
    }
  };

  const status = getStatusMessage();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Image
            source={require('@/assets/images/bridgeup-logo.png')}
            style={styles.bearImage}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
          <Text style={styles.loadingText}>Checking your application...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B6B"
          />
        }
      >
        <View style={styles.content}>
          {/* Bear Image */}
          <Image
            source={require('@/assets/images/bridgeup-logo.png')}
            style={styles.bearImageLarge}
            resizeMode="contain"
          />
          
          
          {/* Title */}
          <Text style={styles.title}>{status.title}</Text>
          
          {/* Message */}
          <Text style={styles.message}>{status.message}</Text>
          
          {/* Application Info */}
          {application && (
            <View style={styles.applicationInfo}>
              <Text style={styles.infoLabel}>Application Status:</Text>
              <Text style={[styles.infoValue, styles[application.application_status]]}>
                {application.application_status.charAt(0).toUpperCase() + application.application_status.slice(1)}
              </Text>
              
              <Text style={styles.infoLabel}>Submitted:</Text>
              <Text style={styles.infoValue}>
                {new Date(application.submitted_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              
              {application.reviewed_at && (
                <>
                  <Text style={styles.infoLabel}>Reviewed:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(application.reviewed_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </>
              )}
            </View>
          )}
          
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>
                {refreshing ? 'Checking...' : 'Check Status'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          
          {/* Support Info */}
          <Text style={styles.supportText}>
            Need help? Contact us at support@bridgeup.app
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF4DB8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  bearImage: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  bearImageLarge: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'System',
  },
  statusEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    fontFamily: 'System',
  },
  applicationInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'System',
  },
  infoValue: {
    fontSize: 16,
    color: '#2C2C2E',
    fontFamily: 'System',
  },
  pending: {
    color: '#FF9500',
    fontWeight: '600',
  },
  approved: {
    color: '#30D158',
    fontWeight: '600',
  },
  rejected: {
    color: '#FF453A',
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  refreshButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FF4DB8',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  supportText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 30,
    fontFamily: 'System',
  },
});