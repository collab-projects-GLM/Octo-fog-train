import { Link, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";

type AuthLinkProps = { prompt: string; label: string; href: Href };

/** "New here? Create an account" style link between the auth screens. */
export default function AuthLink({ prompt, label, href }: AuthLinkProps) {
  return (
    <View className="flex-row gap-1">
      <Text className="text-base text-gray-500">{prompt}</Text>
      <Link href={href} asChild>
        <Pressable accessibilityRole="link">
          <Text className="text-base font-semibold text-black">{label}</Text>
        </Pressable>
      </Link>
    </View>
  );
}
