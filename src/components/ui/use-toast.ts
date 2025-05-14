
import { useToast as useHookToast, toast } from "@/hooks/use-toast";

// Re-export the hooks with proper typing
export const useToast = useHookToast;
export { toast };
