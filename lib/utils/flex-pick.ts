import championRoles from '@/champion_role.json';

/**
 * Checks if a champion is considered a "flex pick" based on champion_role.json.
 * A flex pick is defined as a champion that appears in more than one role.
 */
export function isFlexPick(championName: string): boolean {
    let roleCount = 0;
    
    // Iterate through all roles in champion_role.json
    for (const role in championRoles) {
        const championsInRole = championRoles[role as keyof typeof championRoles];
        if (championsInRole.includes(championName)) {
            roleCount++;
        }
    }
    
    return roleCount > 1;
}

/**
 * Returns all roles associated with a champion from champion_role.json.
 */
export function getChampionRoles(championName: string): string[] {
    const roles: string[] = [];
    
    for (const role in championRoles) {
        const championsInRole = championRoles[role as keyof typeof championRoles];
        if (championsInRole.includes(championName)) {
            roles.push(role);
        }
    }
    
    return roles;
}
