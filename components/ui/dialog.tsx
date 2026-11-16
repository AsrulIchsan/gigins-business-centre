"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Scrollable centering container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 md:p-6 text-center">
        {/* Dialog body container without restrictive max-w so DialogContent controls width */}
        <div className="relative z-50 w-full flex justify-center text-left my-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl text-left",
      "max-h-[86vh] md:max-h-[74vh] flex flex-col overflow-hidden",
      "animate-in fade-in-90 zoom-in-95",
      className
    )}
    {...props}
  >
    {onClose && (
      <button
        onClick={onClose}
        type="button"
        className="absolute right-3.5 top-3.5 z-30 rounded-full p-1.5 text-slate-400 bg-white/90 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
        aria-label="Tutup"
      >
        <X className="h-5 w-5" />
      </button>
    )}
    <div className="overflow-y-auto overflow-x-hidden p-5 sm:p-6 overscroll-contain flex-1 custom-modal-scroll">
      {children}
    </div>
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-left mb-4 pr-8 shrink-0",
      className
    )}
    {...props}
  />
);

const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h2
    className={cn(
      "text-base sm:text-lg font-bold leading-tight tracking-tight text-slate-900",
      className
    )}
    {...props}
  />
);

const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p className={cn("text-xs text-slate-500", className)} {...props} />
);

const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2 mt-5 pt-3 border-t border-slate-200 shrink-0",
      className
    )}
    {...props}
  />
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
