import { useEffect, useState } from "react";

// Reads the active theme from <html data-theme="..."> and updates on change.
export const useThemeKey = () => {
  const [key, setKey] = useState<string>(() =>
    typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-theme") ?? "hybrid"
      : "hybrid",
  );
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const obs = new MutationObserver(() =>
      setKey(root.getAttribute("data-theme") ?? "hybrid"),
    );
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return key;
};
