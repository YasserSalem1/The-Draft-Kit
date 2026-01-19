import { graphqlRequest } from '../api';

export type Region = 'LCK' | 'LPL' | 'LEC' | 'LTA North' | 'LTA South' | 'LCP' | 'PCS' | 'VCS' | 'Other';

export interface Player {
    id: string;
    nickname?: string;
    name?: string;
    role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
    photo?: string;
}

export interface Team {
    id: string;
    name: string;
    shortName: string;
    region: Region;
    color: string;
    logo: string;
    players?: Player[];
}

export const TEAMS: Team[] = [
    // --- LCK (Korea) ---
    {
        id: '47961', name: 'DRX', shortName: 'DRX', region: 'LCK', color: '#00A3E0', logo: 'https://cdn.grid.gg/assets/team-logos/6470bf630495e659e6120d516a2f790c',
        players: [
            { id: 'drx-top', name: 'DRX Top', role: 'TOP' },
            { id: 'drx-jungle', name: 'DRX Jungle', role: 'JUNGLE' },
            { id: 'drx-mid', name: 'DRX Mid', role: 'MID' },
            { id: 'drx-adc', name: 'DRX ADC', role: 'ADC' },
            { id: 'drx-support', name: 'DRX Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52747', name: 'NONGSHIM RED FORCE', shortName: 'NS', region: 'LCK', color: '#DE2027', logo: 'https://cdn.grid.gg/assets/team-logos/15cf94cff3b13fd908e2b79576b8e6f0',
        players: [
            { id: 'ns-top', name: 'NS Top', role: 'TOP' },
            { id: 'ns-jungle', name: 'NS Jungle', role: 'JUNGLE' },
            { id: 'ns-mid', name: 'NS Mid', role: 'MID' },
            { id: 'ns-adc', name: 'NS ADC', role: 'ADC' },
            { id: 'ns-support', name: 'NS Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '407', name: 'KT Rolster', shortName: 'KT', region: 'LCK', color: '#EA3323', logo: 'https://cdn.grid.gg/assets/team-logos/a47aaabd94d8ee66fc22a6893a48f4ae',
        players: [
            { id: 'kt-top', name: 'KT Top', role: 'TOP' },
            { id: 'kt-jungle', name: 'KT Jungle', role: 'JUNGLE' },
            { id: 'kt-mid', name: 'KT Mid', role: 'MID' },
            { id: 'kt-adc', name: 'KT ADC', role: 'ADC' },
            { id: 'kt-support', name: 'KT Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '48179', name: 'Dplus KIA', shortName: 'DK', region: 'LCK', color: '#00FA9A', logo: 'https://cdn.grid.gg/assets/team-logos/1c4e991b3a2ec38bc188409b6dcf6427',
        players: [
            { id: 'dk-top', name: 'DK Top', role: 'TOP' },
            { id: 'dk-jungle', name: 'DK Jungle', role: 'JUNGLE' },
            { id: 'dk-mid', name: 'DK Mid', role: 'MID' },
            { id: 'dk-adc', name: 'DK ADC', role: 'ADC' },
            { id: 'dk-support', name: 'DK Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47558', name: 'Gen.G Esports', shortName: 'GEN', region: 'LCK', color: '#AA8A00', logo: 'https://cdn.grid.gg/assets/team-logos/d2eded1af01ce76afb9540de0ef8b1d8',
        players: [
            { id: 'gen-top', name: 'GEN Top', role: 'TOP' },
            { id: 'gen-jungle', name: 'GEN Jungle', role: 'JUNGLE' },
            { id: 'gen-mid', name: 'GEN Mid', role: 'MID' },
            { id: 'gen-adc', name: 'GEN ADC', role: 'ADC' },
            { id: 'gen-support', name: 'GEN Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52817', name: 'BRION', shortName: 'BRO', region: 'LCK', color: '#004A25', logo: 'https://cdn.grid.gg/assets/team-logos/8fcd5ca8c455d1173afc0815b7321b7a',
        players: [
            { id: 'bro-top', name: 'BRO Top', role: 'TOP' },
            { id: 'bro-jungle', name: 'BRO Jungle', role: 'JUNGLE' },
            { id: 'bro-mid', name: 'BRO Mid', role: 'MID' },
            { id: 'bro-adc', name: 'BRO ADC', role: 'ADC' },
            { id: 'bro-support', name: 'BRO Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '3483', name: 'DN SOOPers', shortName: 'SOOP', region: 'LCK', color: '#00AEEF', logo: 'https://cdn.grid.gg/assets/team-logos/cfcf51afe7a2d0b7559a391e9b39f8e6',
        players: [
            { id: 'soop-top', name: 'SOOP Top', role: 'TOP' },
            { id: 'soop-jungle', name: 'SOOP Jungle', role: 'JUNGLE' },
            { id: 'soop-mid', name: 'SOOP Mid', role: 'MID' },
            { id: 'soop-adc', name: 'SOOP ADC', role: 'ADC' },
            { id: 'soop-support', name: 'SOOP Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '4035', name: 'BNK FearX', shortName: 'FOX', region: 'LCK', color: '#E5AF11', logo: 'https://cdn.grid.gg/assets/team-logos/0ee8dc4cac1c6b09c4b25b7cbefc2493',
        players: [
            { id: 'fox-top', name: 'FOX Top', role: 'TOP' },
            { id: 'fox-jungle', name: 'FOX Jungle', role: 'JUNGLE' },
            { id: 'fox-mid', name: 'FOX Mid', role: 'MID' },
            { id: 'fox-adc', name: 'FOX ADC', role: 'ADC' },
            { id: 'fox-support', name: 'FOX Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47494', name: 'T1', shortName: 'T1', region: 'LCK', color: '#E4002B', logo: 'https://cdn.grid.gg/assets/team-logos/1e7311945adc58ac807ffcf10b18d002',
        players: [
            { id: 't1-top', name: 'T1 Top', role: 'TOP' },
            { id: 't1-jungle', name: 'T1 Jungle', role: 'JUNGLE' },
            { id: 't1-mid', name: 'T1 Mid', role: 'MID' },
            { id: 't1-adc', name: 'T1 ADC', role: 'ADC' },
            { id: 't1-support', name: 'T1 Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '406', name: 'Hanwha Life Esports', shortName: 'HLE', region: 'LCK', color: '#FF6B00', logo: 'https://cdn.grid.gg/assets/team-logos/f6bbce9ba43dfbf1b50b6cde51fda71b',
        players: [
            { id: 'hle-top', name: 'HLE Top', role: 'TOP' },
            { id: 'hle-jungle', name: 'HLE Jungle', role: 'JUNGLE' },
            { id: 'hle-mid', name: 'HLE Mid', role: 'MID' },
            { id: 'hle-adc', name: 'HLE ADC', role: 'ADC' },
            { id: 'hle-support', name: 'HLE Support', role: 'SUPPORT' },
        ]
    },

    // --- LPL (China) ---
    {
        id: '3113', name: 'Ultra Prime', shortName: 'UP', region: 'LPL', color: '#00A1D6', logo: 'https://cdn.grid.gg/assets/team-logos/363f9a6c2cec06b86f2372ec4a0e6726',
        players: [
            { id: 'up-top', name: 'UP Top', role: 'TOP' },
            { id: 'up-jungle', name: 'UP Jungle', role: 'JUNGLE' },
            { id: 'up-mid', name: 'UP Mid', role: 'MID' },
            { id: 'up-adc', name: 'UP ADC', role: 'ADC' },
            { id: 'up-support', name: 'UP Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52726', name: 'Suzhou LNG Ninebot Esports', shortName: 'LNG', region: 'LPL', color: '#0055FF', logo: 'https://cdn.grid.gg/assets/team-logos/e951d09e1ea35d65144abf78b15c7456',
        players: [
            { id: 'lng-top', name: 'LNG Top', role: 'TOP' },
            { id: 'lng-jungle', name: 'LNG Jungle', role: 'JUNGLE' },
            { id: 'lng-mid', name: 'LNG Mid', role: 'MID' },
            { id: 'lng-adc', name: 'LNG ADC', role: 'ADC' },
            { id: 'lng-support', name: 'LNG Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52606', name: 'THUNDERTALKGAMING', shortName: 'TT', region: 'LPL', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/eb2b22333b15af55973d4f5dd03f83c1',
        players: [
            { id: 'tt-top', name: 'TT Top', role: 'TOP' },
            { id: 'tt-jungle', name: 'TT Jungle', role: 'JUNGLE' },
            { id: 'tt-mid', name: 'TT Mid', role: 'MID' },
            { id: 'tt-adc', name: 'TT ADC', role: 'ADC' },
            { id: 'tt-support', name: 'TT Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '368', name: 'Hangzhou LGD Gaming', shortName: 'LGD', region: 'LPL', color: '#E4002B', logo: 'https://cdn.grid.gg/assets/team-logos/e6a643a21b7b0ac2253ff218993ee2da',
        players: [
            { id: 'lgd-top', name: 'LGD Top', role: 'TOP' },
            { id: 'lgd-jungle', name: 'LGD Jungle', role: 'JUNGLE' },
            { id: 'lgd-mid', name: 'LGD Mid', role: 'MID' },
            { id: 'lgd-adc', name: 'LGD ADC', role: 'ADC' },
            { id: 'lgd-support', name: 'LGD Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52905', name: 'Shenzhen NINJAS IN PYJAMAS', shortName: 'NIP', region: 'LPL', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/ca79f71f4b21b081fa73eca82517dd18',
        players: [
            { id: 'nip-top', name: 'NIP Top', role: 'TOP' },
            { id: 'nip-jungle', name: 'NIP Jungle', role: 'JUNGLE' },
            { id: 'nip-mid', name: 'NIP Mid', role: 'MID' },
            { id: 'nip-adc', name: 'NIP ADC', role: 'ADC' },
            { id: 'nip-support', name: 'NIP Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47509', name: 'SHANGHAI EDWARD GAMING HYCAN', shortName: 'EDG', region: 'LPL', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/c6afd0a1e0a16aeef299f56bc1d651a0',
        players: [
            { id: 'edg-top', name: 'EDG Top', role: 'TOP' },
            { id: 'edg-jungle', name: 'EDG Jungle', role: 'JUNGLE' },
            { id: 'edg-mid', name: 'EDG Mid', role: 'MID' },
            { id: 'edg-adc', name: 'EDG ADC', role: 'ADC' },
            { id: 'edg-support', name: 'EDG Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52822', name: 'WeiboGaming Faw Audi', shortName: 'WBG', region: 'LPL', color: '#E4002B', logo: 'https://cdn.grid.gg/assets/team-logos/8383962348428abb759211ca64536c06',
        players: [
            { id: 'wbg-top', name: 'WBG Top', role: 'TOP' },
            { id: 'wbg-jungle', name: 'WBG Jungle', role: 'JUNGLE' },
            { id: 'wbg-mid', name: 'WBG Mid', role: 'MID' },
            { id: 'wbg-adc', name: 'WBG ADC', role: 'ADC' },
            { id: 'wbg-support', name: 'WBG Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52796', name: 'Beijing JDG Intel Esports', shortName: 'JDG', region: 'LPL', color: '#C60C30', logo: 'https://cdn.grid.gg/assets/team-logos/152f255d1328421284d3ff60424b8e00',
        players: [
            { id: 'jdg-top', name: 'JDG Top', role: 'TOP' },
            { id: 'jdg-jungle', name: 'JDG Jungle', role: 'JUNGLE' },
            { id: 'jdg-mid', name: 'JDG Mid', role: 'MID' },
            { id: 'jdg-adc', name: 'JDG ADC', role: 'ADC' },
            { id: 'jdg-support', name: 'JDG Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52910', name: "Xi'an Team WE", shortName: 'WE', region: 'LPL', color: '#C60C30', logo: 'https://cdn.grid.gg/assets/team-logos/610e999679cee0189eee94fd9921f728',
        players: [
            { id: 'we-top', name: 'WE Top', role: 'TOP' },
            { id: 'we-jungle', name: 'WE Jungle', role: 'JUNGLE' },
            { id: 'we-mid', name: 'WE Mid', role: 'MID' },
            { id: 'we-adc', name: 'WE ADC', role: 'ADC' },
            { id: 'we-support', name: 'WE Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '20483', name: "Anyone's Legend", shortName: 'AL', region: 'LPL', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/3f900588a5d1bc22435de057b77c2963',
        players: [
            { id: 'al-top', name: 'AL Top', role: 'TOP' },
            { id: 'al-jungle', name: 'AL Jungle', role: 'JUNGLE' },
            { id: 'al-mid', name: 'AL Mid', role: 'MID' },
            { id: 'al-adc', name: 'AL ADC', role: 'ADC' },
            { id: 'al-support', name: 'AL Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47472', name: 'Invictus Gaming', shortName: 'IG', region: 'LPL', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/529571ab502100d6ad4cde6fda36c070',
        players: [
            { id: 'ig-top', name: 'IG Top', role: 'TOP' },
            { id: 'ig-jungle', name: 'IG Jungle', role: 'JUNGLE' },
            { id: 'ig-mid', name: 'IG Mid', role: 'MID' },
            { id: 'ig-adc', name: 'IG ADC', role: 'ADC' },
            { id: 'ig-support', name: 'IG Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '356', name: 'BILIBILI GAMING DREAMSMART', shortName: 'BLG', region: 'LPL', color: '#00A1D6', logo: 'https://cdn.grid.gg/assets/team-logos/51307a108b3e4fdc5209079079a0ed37',
        players: [
            { id: 'blg-top', name: 'BLG Top', role: 'TOP' },
            { id: 'blg-jungle', name: 'BLG Jungle', role: 'JUNGLE' },
            { id: 'blg-mid', name: 'BLG Mid', role: 'MID' },
            { id: 'blg-adc', name: 'BLG ADC', role: 'ADC' },
            { id: 'blg-support', name: 'BLG Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47514', name: 'FunPlus Phoenix', shortName: 'FPX', region: 'LPL', color: '#E4002B', logo: 'https://cdn.grid.gg/assets/team-logos/bfba1ef33b3196cef656330864159955',
        players: [
            { id: 'fpx-top', name: 'FPX Top', role: 'TOP' },
            { id: 'fpx-jungle', name: 'FPX Jungle', role: 'JUNGLE' },
            { id: 'fpx-mid', name: 'FPX Mid', role: 'MID' },
            { id: 'fpx-adc', name: 'FPX ADC', role: 'ADC' },
            { id: 'fpx-support', name: 'FPX Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '375', name: 'TopEsports', shortName: 'TES', region: 'LPL', color: '#FF4200', logo: 'https://cdn.grid.gg/assets/team-logos/0a3a4f1e3b62cc86bb86284a63e62521',
        players: [
            { id: 'tes-top', name: 'TES Top', role: 'TOP' },
            { id: 'tes-jungle', name: 'TES Jungle', role: 'JUNGLE' },
            { id: 'tes-mid', name: 'TES Mid', role: 'MID' },
            { id: 'tes-adc', name: 'TES ADC', role: 'ADC' },
            { id: 'tes-support', name: 'TES Support', role: 'SUPPORT' },
        ]
    },

    // --- LEC (EMEA) ---
    {
        id: '47380', name: 'G2 Esports', shortName: 'G2', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/94a774753c28adb6602d3c36e428a849',
        players: [
            { id: 'g2-top', name: 'G2 Top', role: 'TOP' },
            { id: 'g2-jungle', name: 'G2 Jungle', role: 'JUNGLE' },
            { id: 'g2-mid', name: 'G2 Mid', role: 'MID' },
            { id: 'g2-adc', name: 'G2 ADC', role: 'ADC' },
            { id: 'g2-support', name: 'G2 Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '53165', name: 'Karmine Corp', shortName: 'KC', region: 'LEC', color: '#1A334C', logo: 'https://cdn.grid.gg/assets/team-logos/0c73991760c7d80df981a06e99c7cd51',
        players: [
            { id: 'kc-top', name: 'KC Top', role: 'TOP' },
            { id: 'kc-jungle', name: 'KC Jungle', role: 'JUNGLE' },
            { id: 'kc-mid', name: 'KC Mid', role: 'MID' },
            { id: 'kc-adc', name: 'KC ADC', role: 'ADC' },
            { id: 'kc-support', name: 'KC Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47376', name: 'Fnatic', shortName: 'FNC', region: 'LEC', color: '#FF5900', logo: 'https://cdn.grid.gg/assets/team-logos/d5bd0cb8ca32672cd8608d2ad2cb039a',
        players: [
            { id: 'fnc-top', name: 'FNC Top', role: 'TOP' },
            { id: 'fnc-jungle', name: 'FNC Jungle', role: 'JUNGLE' },
            { id: 'fnc-mid', name: 'FNC Mid', role: 'MID' },
            { id: 'fnc-adc', name: 'FNC ADC', role: 'ADC' },
            { id: 'fnc-support', name: 'FNC Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47619', name: 'Movistar KOI', shortName: 'KOI', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/739e7667002e441bd2596ba7fecff107',
        players: [
            { id: 'koi-top', name: 'KOI Top', role: 'TOP' },
            { id: 'koi-jungle', name: 'KOI Jungle', role: 'JUNGLE' },
            { id: 'koi-mid', name: 'KOI Mid', role: 'MID' },
            { id: 'koi-adc', name: 'KOI ADC', role: 'ADC' },
            { id: 'koi-support', name: 'KOI Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '353', name: 'SK Gaming', shortName: 'SK', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/c69f9b19774472b7b06d183c9de2a448',
        players: [
            { id: 'sk-top', name: 'SK Top', role: 'TOP' },
            { id: 'sk-jungle', name: 'SK Jungle', role: 'JUNGLE' },
            { id: 'sk-mid', name: 'SK Mid', role: 'MID' },
            { id: 'sk-adc', name: 'SK ADC', role: 'ADC' },
            { id: 'sk-support', name: 'SK Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '53168', name: 'GIANTX', shortName: 'GX', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/af80b36401e45be0a5eb13549ff4128f',
        players: [
            { id: 'gx-top', name: 'GX Top', role: 'TOP' },
            { id: 'gx-jungle', name: 'GX Jungle', role: 'JUNGLE' },
            { id: 'gx-mid', name: 'GX Mid', role: 'MID' },
            { id: 'gx-adc', name: 'GX ADC', role: 'ADC' },
            { id: 'gx-support', name: 'GX Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52661', name: 'Shifters', shortName: 'SHF', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/7df957bb35378ac0ba4dcd1cdb50ee83',
        players: [
            { id: 'shf-top', name: 'SHF Top', role: 'TOP' },
            { id: 'shf-jungle', name: 'SHF Jungle', role: 'JUNGLE' },
            { id: 'shf-mid', name: 'SHF Mid', role: 'MID' },
            { id: 'shf-adc', name: 'SHF ADC', role: 'ADC' },
            { id: 'shf-support', name: 'SHF Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47370', name: 'Team Vitality', shortName: 'VIT', region: 'LEC', color: '#FEE100', logo: 'https://cdn.grid.gg/assets/team-logos/195171114bca3c1f69136199f73fce14',
        players: [
            { id: 'vit-top', name: 'VIT Top', role: 'TOP' },
            { id: 'vit-jungle', name: 'VIT Jungle', role: 'JUNGLE' },
            { id: 'vit-mid', name: 'VIT Mid', role: 'MID' },
            { id: 'vit-adc', name: 'VIT ADC', role: 'ADC' },
            { id: 'vit-support', name: 'VIT Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '55749', name: 'Natus Vincere', shortName: 'NAVI', region: 'LEC', color: '#FFFF00', logo: 'https://cdn.grid.gg/assets/team-logos/af2a05c3739af4d1bef50163692d78e0',
        players: [
            { id: 'navi-top', name: 'NAVI Top', role: 'TOP' },
            { id: 'navi-jungle', name: 'NAVI Jungle', role: 'JUNGLE' },
            { id: 'navi-mid', name: 'NAVI Mid', role: 'MID' },
            { id: 'navi-adc', name: 'NAVI ADC', role: 'ADC' },
            { id: 'navi-support', name: 'NAVI Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47435', name: 'Team Heretics', shortName: 'TH', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/64b4c8501ef44ba51648a38d131d9f2e',
        players: [
            { id: 'th-top', name: 'TH Top', role: 'TOP' },
            { id: 'th-jungle', name: 'TH Jungle', role: 'JUNGLE' },
            { id: 'th-mid', name: 'TH Mid', role: 'MID' },
            { id: 'th-adc', name: 'TH ADC', role: 'ADC' },
            { id: 'th-support', name: 'TH Support', role: 'SUPPORT' },
        ]
    },

    // --- LTA North (Americas) ---
    {
        id: '47363', name: 'Team Liquid', shortName: 'TL', region: 'LTA North', color: '#0C223F', logo: 'https://cdn.grid.gg/assets/team-logos/ff1be4367df4d5a7a47e8ce8353d1d46',
        players: [
            { id: 'tl-top', name: 'TL Top', role: 'TOP' },
            { id: 'tl-jungle', name: 'TL Jungle', role: 'JUNGLE' },
            { id: 'tl-mid', name: 'TL Mid', role: 'MID' },
            { id: 'tl-adc', name: 'TL ADC', role: 'ADC' },
            { id: 'tl-support', name: 'TL Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '53073', name: 'Shopify Rebellion', shortName: 'SR', region: 'LTA North', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/25c81a9203d53e13e0dc9ab7d0dc35a0',
        players: [
            { id: 'sr-top', name: 'SR Top', role: 'TOP' },
            { id: 'sr-jungle', name: 'SR Jungle', role: 'JUNGLE' },
            { id: 'sr-mid', name: 'SR Mid', role: 'MID' },
            { id: 'sr-adc', name: 'SR ADC', role: 'ADC' },
            { id: 'sr-support', name: 'SR Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '54198', name: 'LYON', shortName: 'LYN', region: 'LTA North', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/e6b15b1910b92edfa85729a29ef40e08',
        players: [
            { id: 'lyn-top', name: 'LYN Top', role: 'TOP' },
            { id: 'lyn-jungle', name: 'LYN Jungle', role: 'JUNGLE' },
            { id: 'lyn-mid', name: 'LYN Mid', role: 'MID' },
            { id: 'lyn-adc', name: 'LYN ADC', role: 'ADC' },
            { id: 'lyn-support', name: 'LYN Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '340', name: 'FlyQuest', shortName: 'FLY', region: 'LTA North', color: '#1E4F2B', logo: 'https://cdn.grid.gg/assets/team-logos/c073b6e06dbed1d34d37fdcfdda85e4d',
        players: [
            { id: 'fly-top', name: 'FLY Top', role: 'TOP' },
            { id: 'fly-jungle', name: 'FLY Jungle', role: 'JUNGLE' },
            { id: 'fly-mid', name: 'FLY Mid', role: 'MID' },
            { id: 'fly-adc', name: 'FLY ADC', role: 'ADC' },
            { id: 'fly-support', name: 'FLY Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52416', name: 'Disguised', shortName: 'DSG', region: 'LTA North', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/2722c22bfb10c68858dd358e13fe3fc5',
        players: [
            { id: 'dsg-top', name: 'DSG Top', role: 'TOP' },
            { id: 'dsg-jungle', name: 'DSG Jungle', role: 'JUNGLE' },
            { id: 'dsg-mid', name: 'DSG Mid', role: 'MID' },
            { id: 'dsg-adc', name: 'DSG ADC', role: 'ADC' },
            { id: 'dsg-support', name: 'DSG Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47499', name: 'Dignitas', shortName: 'DIG', region: 'LTA North', color: '#FFB81C', logo: 'https://cdn.grid.gg/assets/team-logos/7562a16d59f1e163bf38214c552403d9',
        players: [
            { id: 'dig-top', name: 'DIG Top', role: 'TOP' },
            { id: 'dig-jungle', name: 'DIG Jungle', role: 'JUNGLE' },
            { id: 'dig-mid', name: 'DIG Mid', role: 'MID' },
            { id: 'dig-adc', name: 'DIG ADC', role: 'ADC' },
            { id: 'dig-support', name: 'DIG Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47351', name: 'Cloud9 Kia', shortName: 'C9', region: 'LTA North', color: '#00AEEF', logo: 'https://cdn.grid.gg/assets/team-logos/f7d208601ddc141eb136d9aba8ae7156',
        players: [
            { id: 'c9-top', name: 'C9 Top', role: 'TOP' },
            { id: 'c9-jungle', name: 'C9 Jungle', role: 'JUNGLE' },
            { id: 'c9-mid', name: 'C9 Mid', role: 'MID' },
            { id: 'c9-adc', name: 'C9 ADC', role: 'ADC' },
            { id: 'c9-support', name: 'C9 Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47497', name: '100 Thieves', shortName: '100', region: 'LTA North', color: '#EB3335', logo: 'https://cdn.grid.gg/assets/team-logos/5200f435d4391140826fada04936283c',
        players: [
            { id: '100-top', name: '100 Top', role: 'TOP' },
            { id: '100-jungle', name: '100 Jungle', role: 'JUNGLE' },
            { id: '100-mid', name: '100 Mid', role: 'MID' },
            { id: '100-adc', name: '100 ADC', role: 'ADC' },
            { id: '100-support', name: '100 Support', role: 'SUPPORT' },
        ]
    },

    // --- LTA South (Americas) ---
    {
        id: '48173', name: 'Vivo Keyd Stars', shortName: 'VKS', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/5fc2be84ac533a23b4c47fe1a5f9b8a8',
        players: [
            { id: 'vks-top', name: 'VKS Top', role: 'TOP' },
            { id: 'vks-jungle', name: 'VKS Jungle', role: 'JUNGLE' },
            { id: 'vks-mid', name: 'VKS Mid', role: 'MID' },
            { id: 'vks-adc', name: 'VKS ADC', role: 'ADC' },
            { id: 'vks-support', name: 'VKS Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '52573', name: 'RED Canids Kalunga', shortName: 'RED', region: 'LTA South', color: '#DE2027', logo: 'https://cdn.grid.gg/assets/team-logos/81c89d9a51f0f48ad863031b7966267f',
        players: [
            { id: 'red-top', name: 'RED Top', role: 'TOP' },
            { id: 'red-jungle', name: 'RED Jungle', role: 'JUNGLE' },
            { id: 'red-mid', name: 'RED Mid', role: 'MID' },
            { id: 'red-adc', name: 'RED ADC', role: 'ADC' },
            { id: 'red-support', name: 'RED Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '3389', name: 'Pain Gaming', shortName: 'PNG', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/6e3304db2cad17630886f15a94c640e1',
        players: [
            { id: 'png-top', name: 'PNG Top', role: 'TOP' },
            { id: 'png-jungle', name: 'PNG Jungle', role: 'JUNGLE' },
            { id: 'png-mid', name: 'PNG Mid', role: 'MID' },
            { id: 'png-adc', name: 'PNG ADC', role: 'ADC' },
            { id: 'png-support', name: 'PNG Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47960', name: 'LOUD', shortName: 'LLL', region: 'LTA South', color: '#00FF00', logo: 'https://cdn.grid.gg/assets/team-logos/c6b8fc94efc77793bf8a3bec217e9040',
        players: [
            { id: 'lll-top', name: 'LLL Top', role: 'TOP' },
            { id: 'lll-jungle', name: 'LLL Jungle', role: 'JUNGLE' },
            { id: 'lll-mid', name: 'LLL Mid', role: 'MID' },
            { id: 'lll-adc', name: 'LLL ADC', role: 'ADC' },
            { id: 'lll-support', name: 'LLL Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47757', name: 'LEVIATÁN', shortName: 'LEV', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/54f4e80969726869b0fbf48fb9ec5b18',
        players: [
            { id: 'lev-top', name: 'LEV Top', role: 'TOP' },
            { id: 'lev-jungle', name: 'LEV Jungle', role: 'JUNGLE' },
            { id: 'lev-mid', name: 'LEV Mid', role: 'MID' },
            { id: 'lev-adc', name: 'LEV ADC', role: 'ADC' },
            { id: 'lev-support', name: 'LEV Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '54284', name: 'Isurus', shortName: 'ISG', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/415cfdbb29b0f073df49ad8df54a1dcc',
        players: [
            { id: 'isg-top', name: 'ISG Top', role: 'TOP' },
            { id: 'isg-jungle', name: 'ISG Jungle', role: 'JUNGLE' },
            { id: 'isg-mid', name: 'ISG Mid', role: 'MID' },
            { id: 'isg-adc', name: 'ISG ADC', role: 'ADC' },
            { id: 'isg-support', name: 'ISG Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '47389', name: 'FURIA', shortName: 'FUR', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/cca64419f3775b0067e9244360474421',
        players: [
            { id: 'fur-top', name: 'FUR Top', role: 'TOP' },
            { id: 'fur-jungle', name: 'FUR Jungle', role: 'JUNGLE' },
            { id: 'fur-mid', name: 'FUR Mid', role: 'MID' },
            { id: 'fur-adc', name: 'FUR ADC', role: 'ADC' },
            { id: 'fur-support', name: 'FUR Support', role: 'SUPPORT' },
        ]
    },
    {
        id: '48070', name: 'Fluxo', shortName: 'FLX', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/0c1fba2ee93cc361e7f6275ae1220830',
        players: [
            { id: 'flx-top', name: 'FLX Top', role: 'TOP' },
            { id: 'flx-jungle', name: 'FLX Jungle', role: 'JUNGLE' },
            { id: 'flx-mid', name: 'FLX Mid', role: 'MID' },
            { id: 'flx-adc', name: 'FLX ADC', role: 'ADC' },
            { id: 'flx-support', name: 'FLX Support', role: 'SUPPORT' },
        ]
    },
];

export async function getTeamPlayers(teamId: string): Promise<Player[]> {
    const query = `
    query GetPlayers($teamId: ID!) {
      players(filter:{teamIdFilter:{id: $teamId}}) {
        edges{
          node{
            id
            nickname
          }
        }
      }
    }
    `;

    const response = await graphqlRequest<any>(query, { teamId });
    if (response.errors) {
        console.error("GraphQL Errors fetching players:", response.errors);
        return [];
    }

    const players = response.data?.players?.edges.map((edge: any) => ({
        id: edge.node.id,
        nickname: edge.node.nickname,
        role: 'TOP' as const
    })) || [];

    if (players.length === 0) {
        console.warn(`No players found for team ${teamId}`);
    }

    // Map roles based on index if exactly 5 players
    const roles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
    return players.map((p: any, i: number) => ({
        ...p,
        role: roles[i % 5],
        name: p.nickname // For backward compatibility with components using .name
    }));
}
