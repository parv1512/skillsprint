"use client";
import {useCallback, useEffect, useState, type RefObject} from "react";

export function isEditingField() {
  const active = document.activeElement;
  return active instanceof HTMLElement && !active.matches(":disabled") &&
    (active.matches("textarea, select, input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio])") || active.isContentEditable);
}
export function revealResult(element: HTMLElement | null) {
  if (!element || isEditingField() || element.closest("[hidden], details:not([open])") || !element.isConnected) return;
  element.scrollIntoView({block:"start"});
  element.focus({preventScroll:true});
}
// Request focus after rendering an action result, never while editing an answer.
export function useResultFocus() {
  const [request, setRequest] = useState<{target: RefObject<HTMLElement | null>; selector?: string}>();
  useEffect(() => {
    if (!request) return;
    const frame = requestAnimationFrame(() => revealResult(request.selector
      ? request.target.current?.querySelector<HTMLElement>(request.selector) ?? null
      : request.target.current));
    return () => cancelAnimationFrame(frame);
  }, [request]);
  return useCallback((target: RefObject<HTMLElement | null>, selector?: string) => setRequest({target, selector}), []);
}
