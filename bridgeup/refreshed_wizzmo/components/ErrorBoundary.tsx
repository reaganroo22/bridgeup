import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
  }

  handleReload = () => {
    // Reset error state
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <LinearGradient
          colors={['#FF4DB8', '#8B5CF6']}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 0,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            padding: 24,
            alignItems: 'center',
            maxWidth: 300,
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '900',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 16,
              textTransform: 'lowercase',
            }}>
              wizzmo
            </Text>
            
            <Text style={{
              fontSize: 16,
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 20,
              opacity: 0.9,
            }}>
              something went wrong, but we're fixing it!
            </Text>

            <TouchableOpacity
              onPress={this.handleReload}
              style={{
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: '#FFFFFF',
                borderRadius: 0,
              }}
            >
              <Text style={{
                color: '#FF4DB8',
                fontWeight: '600',
                fontSize: 16,
                textTransform: 'lowercase',
              }}>
                try again
              </Text>
            </TouchableOpacity>

            {__DEV__ && (
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                marginTop: 16,
              }}>
                {this.state.error?.message}
              </Text>
            )}
          </View>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}