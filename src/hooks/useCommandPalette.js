import { useContext } from "react";
import { CommandPaletteContext } from "../context/CommandPaletteContext.jsx";

export default function useCommandPalette() {
  const value = useContext(CommandPaletteContext);
  if (!value) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  }
  return value;
}
