import { create } from "zustand";

type FaviconStatus = "idle" | "loading" | "success";

interface FaviconStore {
  status: FaviconStatus;
  setLoading: () => void;
  setSuccess: () => void;
  setIdle: () => void;
}

export const useFaviconStore = create<FaviconStore>((set) => ({
  status: "idle",
  setLoading: () => set({ status: "loading" }),
  setSuccess: () => set({ status: "success" }),
  setIdle:   () => set({ status: "idle" }),
}));
