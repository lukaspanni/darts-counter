import { PracticeStoreProvider } from "@/lib/practice-store-provider";
import { PracticeController } from "@/components/practice/practice-controller";

export default function PracticePage() {
  return (
    <PracticeStoreProvider>
      <PracticeController />
    </PracticeStoreProvider>
  );
}
