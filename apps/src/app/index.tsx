import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Octo Travel</CardTitle>
          <CardDescription>Tailwind and shadcn components are wired up.</CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <Button>
            <Text>Primary</Text>
          </Button>
          <Button variant="outline">
            <Text>Outline</Text>
          </Button>
          <Button variant="destructive">
            <Text>Destructive</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}
