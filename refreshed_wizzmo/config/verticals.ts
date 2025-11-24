export type VerticalKey = 'wizzmo' | 'bridgeup' | 'techmentor';

export const VERTICAL_CONFIG: Record<VerticalKey, {
  name: string;
  description: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  lightColor: string;
  darkColor: string;
  gradientColors: string[];
  features: {
    showTrending: boolean;
    showEssayTagging: boolean;
    showCareerTags: boolean;
    targetAudience: 'college' | 'highschool' | 'both';
  };
}> = {
  wizzmo: {
    name: 'Wizzmo',
    description: 'College life advice from older students',
    tagline: 'Get advice from college students who\'ve been there',
    primaryColor: '#FF6B9D',
    accentColor: '#FFB347', 
    lightColor: '#FFF0F5',
    darkColor: '#8B0A3D',
    gradientColors: ['#FF6B9D', '#FFB347'],
    features: {
      showTrending: true,
      showEssayTagging: false,
      showCareerTags: true,
      targetAudience: 'college',
    },
  },
  bridgeup: {
    name: 'BridgeUp',
    description: 'College admissions advice for high schoolers',
    tagline: 'Get college guidance from current students',
    primaryColor: '#4A90E2',
    accentColor: '#7BB3F0',
    lightColor: '#E8F2FF',
    darkColor: '#2C5984',
    gradientColors: ['#4A90E2', '#6C9BD1'],
    features: {
      showTrending: true,
      showEssayTagging: true,
      showCareerTags: false,
      targetAudience: 'highschool',
    },
  },
  techmentor: {
    name: 'TechMentor', 
    description: 'Mentorship for aspiring developers',
    tagline: 'Learn coding from experienced developers',
    primaryColor: '#10B981',
    accentColor: '#34D399',
    lightColor: '#ECFDF5',
    darkColor: '#047857',
    gradientColors: ['#10B981', '#34D399'],
    features: {
      showTrending: true,
      showEssayTagging: false,
      showCareerTags: true,
      targetAudience: 'both',
    },
  },
};