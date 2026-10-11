export type RoleName = 'Admin' | 'ESS';

/** OrangeHRM userRoleId values used by the Admin > Users API. */
export const ROLE_IDS: Record<RoleName, number> = { Admin: 1, ESS: 2 };

/** Which main-menu entries each role must (not) see. Single source of truth for RBAC checks. */
export const ROLE_POLICIES: Record<RoleName, { visible: string[]; hidden: string[] }> = {
  Admin: { visible: ['Admin', 'PIM', 'Leave', 'My Info'], hidden: [] },
  ESS: { visible: ['My Info', 'Leave', 'Directory'], hidden: ['Admin', 'PIM'] },
};
