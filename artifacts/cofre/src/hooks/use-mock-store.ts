import { useState, useEffect } from "react";
import { storeEmitter } from "@/data/mock-data";

export function useMockDataSync() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    storeEmitter.addEventListener("change", handler);
    return () => storeEmitter.removeEventListener("change", handler);
  }, []);
}
