import { useMemo } from "react";
import { useUsers } from "./use-queries";
import type { MultiSelectOption } from "@/components/common/MultiSelectDropdown";
import type { Professional } from "@/components/common/ProfessionalChips";

export function useProfessionals(divisionId?: string) {
  const { data: users, isLoading, error } = useUsers();

  const professionals = useMemo(() => {
    if (!users) return [];

    return users
      .filter((user) => user.role === "professional")
      .filter((user) => {
        // If divisionId is provided, filter by division
        if (divisionId) {
          return user.divisionId === divisionId;
        }
        return true;
      })
      .map((user) => ({
        id: user.id,
        name: user.name,
        profession: user.profession,
        divisionId: user.divisionId,
        email: user.email,
        avatar: user.avatar,
      }));
  }, [users, divisionId]);

  return {
    professionals,
    isLoading,
    error,
  };
}

export function useProfessionalsAsOptions(divisionId?: string): {
  options: MultiSelectOption[];
  isLoading: boolean;
  error: Error | null;
} {
  const { professionals, isLoading, error } = useProfessionals(divisionId);

  const options = useMemo(() => {
    return professionals.map((prof) => ({
      id: prof.id,
      name: prof.name,
      subtitle: prof.profession
        ? `${prof.profession}${prof.divisionId ? ` • ${prof.divisionId}` : ""}`
        : prof.divisionId || undefined,
      avatar: prof.avatar,
    }));
  }, [professionals]);

  return {
    options,
    isLoading,
    error,
  };
}

export function useProfessionalsById(ids: string[]): {
  professionals: Professional[];
  isLoading: boolean;
} {
  const { data: users, isLoading } = useUsers();

  const professionals = useMemo(() => {
    if (!users || !ids || ids.length === 0) return [];

    return ids
      .map((id) => {
        const user = users.find((u) => u.id === id);
        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          profession: user.profession,
          divisionId: user.divisionId,
          email: user.email,
          avatar: user.avatar,
        };
      })
      .filter((prof): prof is Professional => prof !== null);
  }, [users, ids]);

  return {
    professionals,
    isLoading,
  };
}
