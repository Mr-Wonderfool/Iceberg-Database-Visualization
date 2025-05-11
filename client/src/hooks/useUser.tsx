import { createContext, useContext } from "react";
import { UserPublic } from "../types/types";

interface UserContextType {
  user: UserPublic | null;
  setUser: (user: UserPublic | null) => void;
}

export const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used with a UserProvider");
  }
  return context;
};
