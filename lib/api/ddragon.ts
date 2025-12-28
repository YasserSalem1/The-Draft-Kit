export interface Champion {
    id: string;
    name: string;
    title: string;
    tags: string[];
    image: {
        full: string;
        sprite: string;
        group: string;
    };
}

export interface DDragonResponse {
    type: string;
    format: string;
    version: string;
    data: Record<string, Champion>;
}

// Cache the version to avoid fetching it every time
let cachedVersion: string | null = null;

export async function getLatestVersion(): Promise<string> {
    if (cachedVersion) return cachedVersion;

    try {
        const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await res.json();
        cachedVersion = versions[0];
        return versions[0];
    } catch (e) {
        console.error("Failed to fetch DDragon version, falling back to recent", e);
        return "14.23.1";
    }
}

export async function getChampions(): Promise<Champion[]> {
    const version = await getLatestVersion();
    try {
        const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
        const data: DDragonResponse = await res.json();
        return Object.values(data.data);
    } catch (e) {
        console.error("Failed to fetch champions", e);
        return [];
    }
}

export function getChampionIconUrl(version: string, imageFull: string): string {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${imageFull}`;
}
