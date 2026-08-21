"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { seedDefaultCategories } from "@/app/(app)/budgets/actions";

export default function SeedCategoriesButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="btn-primary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await seedDefaultCategories();
          router.refresh();
        })
      }
    >
      <Sparkles size={18} />
      {pending ? "Creando…" : "Crear categorías sugeridas"}
    </button>
  );
}
