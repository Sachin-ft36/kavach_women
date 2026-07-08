import { useEffect, useState } from "react";
import { fetchGreeting, type ChatContext } from "../services/api";

export function useGreeting(apiBase: string, name: string, language: string, context: ChatContext) {
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGreeting(apiBase, name, language, context).then((g) => {
      if (!cancelled) {
        setGreeting(g);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [apiBase, name, language]); // intentionally exclude context — caller controls refresh
  return { greeting, loading };
}
