declare module '@expo/vector-icons' {
  import { ReactNode } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: ViewStyle | TextStyle;
  }

  export interface IconComponent extends React.FC<IconProps> {
    glyphMap: Record<string, number>;
  }

  export const Ionicons: IconComponent;
  export const MaterialIcons: IconComponent;
  export const MaterialCommunityIcons: IconComponent;
  export const FontAwesome: IconComponent;
  export const FontAwesome5: IconComponent;
  export const Feather: IconComponent;
  export const Entypo: IconComponent;
  export const AntDesign: IconComponent;
}
