// Token helpers are intentionally inert in read-only mode.
export interface Session {
  username: string;
  displayName?: string;
  avatar?: string;
}

export const signToken = (_session: Session): string => "";
export const verifyToken = (_token: string): Session | null => null;
export const extractToken = (_header?: string): string | null => null;
