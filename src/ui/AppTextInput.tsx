import { TextInput, type TextInputProps } from 'react-native';

export function AppTextInput({ style, placeholderTextColor = '#64748B', ...props }: TextInputProps) {
  return <TextInput {...props} placeholderTextColor={placeholderTextColor} style={[{ color: '#25362D' }, style]} />;
}
