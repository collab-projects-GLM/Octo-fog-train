import { Text } from '@/components/ui/text';
import { View } from 'react-native';

type FieldErrorProps = {
  message?: string;
  /** Lines reserved for the message. Longer text is clipped, never grown into. */
  lines?: 1 | 2;
};

/**
 * Error slot that always occupies the same height (text-sm = 20px per line), so
 * showing or clearing a message never shifts the fields around it.
 */
function FieldError({ message, lines = 1 }: FieldErrorProps) {
  return (
    <View className={lines === 2 ? 'h-10' : 'h-5'} accessibilityLiveRegion="polite">
      {message ? (
        <Text className="text-error text-sm" numberOfLines={lines}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export { FieldError };
