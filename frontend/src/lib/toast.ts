import { toast } from "sonner";
import { parseError } from "./errors";

export function toastError(err: unknown, fallback?: string) {
  const { message } = parseError(err);
  toast.error(fallback || message);
}

export function toastSuccess(message: string) {
  toast.success(message);
}

export function toastWarning(message: string) {
  toast.warning(message);
}

export function toastInfo(message: string) {
  toast.info(message);
}
