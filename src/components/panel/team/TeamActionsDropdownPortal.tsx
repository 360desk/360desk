"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

interface TeamActionsDropdownPortalProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  minWidth?: number;
}

export function TeamActionsDropdownPortal({
  open,
  onClose,
  triggerRef,
  children,
  className = "",
  minWidth = 220,
}: TeamActionsDropdownPortalProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.right,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onClose, triggerRef]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className={className}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        transform: "translateX(-100%)",
        zIndex: 9999,
        minWidth,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
