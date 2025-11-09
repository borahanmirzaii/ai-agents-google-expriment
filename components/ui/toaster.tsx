"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useUIStore } from "@/store/ui-store";

export function Toaster() {
  const { toasts, removeToast } = useUIStore();

  return (
    <ToastProvider>
      {toasts.map(({ id, message, type, duration = 3000 }) => {
        // Auto-remove after duration
        setTimeout(() => removeToast(id), duration);

        return (
          <Toast key={id} variant={type === "error" ? "destructive" : type === "success" ? "success" : "default"}>
            <div className="grid gap-1">
              <ToastTitle>
                {type === "success" && "Success"}
                {type === "error" && "Error"}
                {type === "info" && "Info"}
                {type === "warning" && "Warning"}
              </ToastTitle>
              <ToastDescription>{message}</ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
