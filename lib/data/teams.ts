import { graphqlRequest } from '../api';

export type Region = 'LCK' | 'LPL' | 'LEC' | 'LTA North' | 'LTA South' | 'LCP' | 'PCS' | 'VCS' | 'Other';

export interface Player {
    id: string;
    nickname?: string;
    name?: string;
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
            { id: 'drx-top', name: 'DRX Top' },
            { id: 'drx-jungle', name: 'DRX Jungle' },
            { id: 'drx-mid', name: 'DRX Mid' },
            { id: 'drx-adc', name: 'DRX ADC' },
            { id: 'drx-support', name: 'DRX Support' },
        ]
    },
    {
        id: '52747', name: 'NONGSHIM RED FORCE', shortName: 'NS', region: 'LCK', color: '#DE2027', logo: 'https://cdn.grid.gg/assets/team-logos/15cf94cff3b13fd908e2b79576b8e6f0',
        players: [
            { id: 'ns-top', name: 'NS Top' },
            { id: 'ns-jungle', name: 'NS Jungle' },
            { id: 'ns-mid', name: 'NS Mid' },
            { id: 'ns-adc', name: 'NS ADC' },
            { id: 'ns-support', name: 'NS Support' },
        ]
    },
    {
        id: '407', name: 'KT Rolster', shortName: 'KT', region: 'LCK', color: '#EA3323', logo: 'https://cdn.grid.gg/assets/team-logos/a47aaabd94d8ee66fc22a6893a48f4ae',
        players: [
            { id: 'kt-top', name: 'KT Top' },
            { id: 'kt-jungle', name: 'KT Jungle' },
            { id: 'kt-mid', name: 'KT Mid' },
            { id: 'kt-adc', name: 'KT ADC' },
            { id: 'kt-support', name: 'KT Support' },
        ]
    },
    {
        id: '48179', name: 'Dplus KIA', shortName: 'DK', region: 'LCK', color: '#00FA9A', logo: 'https://cdn.grid.gg/assets/team-logos/1c4e991b3a2ec38bc188409b6dcf6427',
        players: [
            { id: 'dk-top', name: 'DK Top' },
            { id: 'dk-jungle', name: 'DK Jungle' },
            { id: 'dk-mid', name: 'DK Mid' },
            { id: 'dk-adc', name: 'DK ADC' },
            { id: 'dk-support', name: 'DK Support' },
        ]
    },
    {
        id: '47558', name: 'Gen.G Esports', shortName: 'GEN', region: 'LCK', color: '#AA8A00', logo: 'https://cdn.grid.gg/assets/team-logos/d2eded1af01ce76afb9540de0ef8b1d8',
        players: [
            { id: 'gen-top', name: 'GEN Top' },
            { id: 'gen-jungle', name: 'GEN Jungle' },
            { id: 'gen-mid', name: 'GEN Mid' },
            { id: 'gen-adc', name: 'GEN ADC' },
            { id: 'gen-support', name: 'GEN Support' },
        ]
    },
    {
        id: '52817', name: 'BRION', shortName: 'BRO', region: 'LCK', color: '#004A25', logo: 'https://cdn.grid.gg/assets/team-logos/8fcd5ca8c455d1173afc0815b7321b7a',
        players: [
            { id: 'bro-top', name: 'BRO Top' },
            { id: 'bro-jungle', name: 'BRO Jungle' },
            { id: 'bro-mid', name: 'BRO Mid' },
            { id: 'bro-adc', name: 'BRO ADC' },
            { id: 'bro-support', name: 'BRO Support' },
        ]
    },
    {
        id: '3483', name: 'DN SOOPers', shortName: 'SOOP', region: 'LCK', color: '#00AEEF', logo: 'https://cdn.grid.gg/assets/team-logos/cfcf51afe7a2d0b7559a391e9b39f8e6',
        players: [
            { id: 'soop-top', name: 'SOOP Top' },
            { id: 'soop-jungle', name: 'SOOP Jungle' },
            { id: 'soop-mid', name: 'SOOP Mid' },
            { id: 'soop-adc', name: 'SOOP ADC' },
            { id: 'soop-support', name: 'SOOP Support' },
        ]
    },
    {
        id: '4035', name: 'BNK FearX', shortName: 'FOX', region: 'LCK', color: '#E5AF11', logo: 'https://cdn.grid.gg/assets/team-logos/0ee8dc4cac1c6b09c4b25b7cbefc2493',
        players: [
            { id: 'fox-top', name: 'FOX Top' },
            { id: 'fox-jungle', name: 'FOX Jungle' },
            { id: 'fox-mid', name: 'FOX Mid' },
            { id: 'fox-adc', name: 'FOX ADC' },
            { id: 'fox-support', name: 'FOX Support' },
        ]
    },
    {
        id: '47494', name: 'T1', shortName: 'T1', region: 'LCK', color: '#E4002B', logo: 'https://cdn.grid.gg/assets/team-logos/1e7311945adc58ac807ffcf10b18d002',
        players: [
            { id: 't1-top', name: 'T1 Top' },
            { id: 't1-jungle', name: 'T1 Jungle' },
            { id: 't1-mid', name: 'T1 Mid' },
            { id: 't1-adc', name: 'T1 ADC' },
            { id: 't1-support', name: 'T1 Support' },
        ]
    },
    {
        id: '406', name: 'Hanwha Life Esports', shortName: 'HLE', region: 'LCK', color: '#FF6B00', logo: 'https://cdn.grid.gg/assets/team-logos/f6bbce9ba43dfbf1b50b6cde51fda71b',
        players: [
            { id: 'hle-top', name: 'HLE Top' },
            { id: 'hle-jungle', name: 'HLE Jungle' },
            { id: 'hle-mid', name: 'HLE Mid' },
            { id: 'hle-adc', name: 'HLE ADC' },
            { id: 'hle-support', name: 'HLE Support' },
        ]
    },

    // --- LPL (China) ---
    {
        id: '3113', name: 'Ultra Prime', shortName: 'UP', region: 'LPL', color: '#00A1D6', logo: 'https://cdn.grid.gg/assets/team-logos/363f9a6c2cec06b86f2372ec4a0e6726',
        players: [
            { id: 'up-top', name: 'UP Top' },
            { id: 'up-jungle', name: 'UP Jungle' },
            { id: 'up-mid', name: 'UP Mid' },
            { id: 'up-adc', name: 'UP ADC' },
            { id: 'up-support', name: 'UP Support' },
        ]
    },
    {
        id: '52726', name: 'Suzhou LNG Ninebot Esports', shortName: 'LNG', region: 'LPL', color: '#0055FF', logo: 'https://cdn.grid.gg/assets/team-logos/e951d09e1ea35d65144abf78b15c7456',
        players: [
            { id: 'lng-top', name: 'LNG Top' },
            { id: 'lng-jungle', name: 'LNG Jungle' },
            { id: 'lng-mid', name: 'LNG Mid' },
            { id: 'lng-adc', name: 'LNG ADC' },
            { id: 'lng-support', name: 'LNG Support' },
        ]
    },
    {
        id: '52606', name: 'THUNDERTALKGAMING', shortName: 'TT', region: 'LPL', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/eb2b22333b15af55973d4f5dd03f83c1',
        players: [
            { id: 'tt-top', name: 'TT Top' },
            { id: 'tt-jungle', name: 'TT Jungle' },
            { id: 'tt-mid', name: 'TT Mid' },
            { id: 'tt-adc', name: 'TT ADC' },
            { id: 'tt-support', name: 'TT Support' },
        ]
    },
    {
        id: '368', name: 'Hangzhou LGD Gaming', shortName: 'LGD', region: 'LPL', color: '#E4002B', logo: 'https://cdn.grid.gg/assets/team-logos/e6a643a21b7b0ac2253ff218993ee2da',
        players: [
            { id: 'lgd-top', name: 'LGD Top' },
            { id: 'lgd-jungle', name: 'LGD Jungle' },
            { id: 'lgd-mid', name: 'LGD Mid' },
            { id: 'lgd-adc', name: 'LGD ADC' },
            { id: 'lgd-support', name: 'LGD Support' },
        ]
    },
    {
        id: '52905', name: 'Shenzhen NINJAS IN PYJAMAS', shortName: 'NIP', region: 'LPL', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/ca79f71f4b21b081fa73eca82517dd18',
        players: [
            { id: 'nip-top', name: 'NIP Top' },
            { id: 'nip-jungle', name: 'NIP Jungle' },
            { id: 'nip-mid', name: 'NIP Mid' },
            { id: 'nip-adc', name: 'NIP ADC' },
            { id: 'nip-support', name: 'NIP Support' },
        ]
    },
    {
        id: '47509', name: 'SHANGHAI EDWARD GAMING HYCAN', shortName: 'EDG', region: 'LPL', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/c6afd0a1e0a16aeef299f56bc1d651a0',
        players: [
            { id: 'edg-top', name: 'EDG Top' },
            { id: 'edg-jungle', name: 'EDG Jungle' },
            { id: 'edg-mid', name: 'EDG Mid' },
            { id: 'edg-adc', name: 'EDG ADC' },
            { id: 'edg-support', name: 'EDG Support' },
        ]
    },
    {
        id: '52822', name: 'WeiboGaming Faw Audi', shortName: 'WBG', region: 'LPL', color: '#E4002B', logo: 'https://cdn.grid.gg/assets/team-logos/8383962348428abb759211ca64536c06',
        players: [
            { id: 'wbg-top', name: 'WBG Top' },
            { id: 'wbg-jungle', name: 'WBG Jungle' },
            { id: 'wbg-mid', name: 'WBG Mid' },
            { id: 'wbg-adc', name: 'WBG ADC' },
            { id: 'wbg-support', name: 'WBG Support' },
        ]
    },
    {
        id: '52796', name: 'Beijing JDG Intel Esports', shortName: 'JDG', region: 'LPL', color: '#C60C30', logo: 'https://cdn.grid.gg/assets/team-logos/152f255d1328421284d3ff60424b8e00',
        players: [
            { id: 'jdg-top', name: 'JDG Top' },
            { id: 'jdg-jungle', name: 'JDG Jungle' },
            { id: 'jdg-mid', name: 'JDG Mid' },
            { id: 'jdg-adc', name: 'JDG ADC' },
            { id: 'jdg-support', name: 'JDG Support' },
        ]
    },
    {
        id: '52910', name: "Xi'an Team WE", shortName: 'WE', region: 'LPL', color: '#C60C30', logo: 'https://cdn.grid.gg/assets/team-logos/610e999679cee0189eee94fd9921f728',
        players: [
            { id: 'we-top', name: 'WE Top' },
            { id: 'we-jungle', name: 'WE Jungle' },
            { id: 'we-mid', name: 'WE Mid' },
            { id: 'we-adc', name: 'WE ADC' },
            { id: 'we-support', name: 'WE Support' },
        ]
    },
    {
        id: '20483', name: "Anyone's Legend", shortName: 'AL', region: 'LPL', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/3f900588a5d1bc22435de057b77c2963',
        players: [
            { id: 'al-top', name: 'AL Top' },
            { id: 'al-jungle', name: 'AL Jungle' },
            { id: 'al-mid', name: 'AL Mid' },
            { id: 'al-adc', name: 'AL ADC' },
            { id: 'al-support', name: 'AL Support' },
        ]
    },
    {
        id: '47472', name: 'Invictus Gaming', shortName: 'IG', region: 'LPL', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/529571ab502100d6ad4cde6fda36c070',
        players: [
            { id: 'ig-top', name: 'IG Top' },
            { id: 'ig-jungle', name: 'IG Jungle' },
            { id: 'ig-mid', name: 'IG Mid' },
            { id: 'ig-adc', name: 'IG ADC' },
            { id: 'ig-support', name: 'IG Support' },
        ]
    },
    {
        id: '356', name: 'BILIBILI GAMING DREAMSMART', shortName: 'BLG', region: 'LPL', color: '#00A1D6', logo: 'https://cdn.grid.gg/assets/team-logos/51307a108b3e4fdc5209079079a0ed37',
        players: [
            { id: 'blg-top', name: 'BLG Top' },
            { id: 'blg-jungle', name: 'BLG Jungle' },
            { id: 'blg-mid', name: 'BLG Mid' },
            { id: 'blg-adc', name: 'BLG ADC' },
            { id: 'blg-support', name: 'BLG Support' },
        ]
    },
    {
        id: '47514', name: 'FunPlus Phoenix', shortName: 'FPX', region: 'LPL', color: '#E4002B', logo: 'https://cdn.grid.gg/assets/team-logos/bfba1ef33b3196cef656330864159955',
        players: [
            { id: 'fpx-top', name: 'FPX Top' },
            { id: 'fpx-jungle', name: 'FPX Jungle' },
            { id: 'fpx-mid', name: 'FPX Mid' },
            { id: 'fpx-adc', name: 'FPX ADC' },
            { id: 'fpx-support', name: 'FPX Support' },
        ]
    },
    {
        id: '375', name: 'TopEsports', shortName: 'TES', region: 'LPL', color: '#FF4200', logo: 'https://cdn.grid.gg/assets/team-logos/0a3a4f1e3b62cc86bb86284a63e62521',
        players: [
            { id: 'tes-top', name: 'TES Top' },
            { id: 'tes-jungle', name: 'TES Jungle' },
            { id: 'tes-mid', name: 'TES Mid' },
            { id: 'tes-adc', name: 'TES ADC' },
            { id: 'tes-support', name: 'TES Support' },
        ]
    },

    // --- LEC (EMEA) ---
    {
        id: '47380', name: 'G2 Esports', shortName: 'G2', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/94a774753c28adb6602d3c36e428a849',
        players: [
            { id: 'g2-top', name: 'G2 Top' },
            { id: 'g2-jungle', name: 'G2 Jungle' },
            { id: 'g2-mid', name: 'G2 Mid' },
            { id: 'g2-adc', name: 'G2 ADC' },
            { id: 'g2-support', name: 'G2 Support' },
        ]
    },
    {
        id: '53165', name: 'Karmine Corp', shortName: 'KC', region: 'LEC', color: '#1A334C', logo: 'https://cdn.grid.gg/assets/team-logos/0c73991760c7d80df981a06e99c7cd51',
        players: [
            { id: 'kc-top', name: 'KC Top' },
            { id: 'kc-jungle', name: 'KC Jungle' },
            { id: 'kc-mid', name: 'KC Mid' },
            { id: 'kc-adc', name: 'KC ADC' },
            { id: 'kc-support', name: 'KC Support' },
        ]
    },
    {
        id: '47376', name: 'Fnatic', shortName: 'FNC', region: 'LEC', color: '#FF5900', logo: 'https://cdn.grid.gg/assets/team-logos/d5bd0cb8ca32672cd8608d2ad2cb039a',
        players: [
            { id: 'fnc-top', name: 'FNC Top' },
            { id: 'fnc-jungle', name: 'FNC Jungle' },
            { id: 'fnc-mid', name: 'FNC Mid' },
            { id: 'fnc-adc', name: 'FNC ADC' },
            { id: 'fnc-support', name: 'FNC Support' },
        ]
    },
    {
        id: '47619', name: 'Movistar KOI', shortName: 'KOI', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/739e7667002e441bd2596ba7fecff107',
        players: [
            { id: 'koi-top', name: 'KOI Top' },
            { id: 'koi-jungle', name: 'KOI Jungle' },
            { id: 'koi-mid', name: 'KOI Mid' },
            { id: 'koi-adc', name: 'KOI ADC' },
            { id: 'koi-support', name: 'KOI Support' },
        ]
    },
    {
        id: '353', name: 'SK Gaming', shortName: 'SK', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/c69f9b19774472b7b06d183c9de2a448',
        players: [
            { id: 'sk-top', name: 'SK Top' },
            { id: 'sk-jungle', name: 'SK Jungle' },
            { id: 'sk-mid', name: 'SK Mid' },
            { id: 'sk-adc', name: 'SK ADC' },
            { id: 'sk-support', name: 'SK Support' },
        ]
    },
    {
        id: '53168', name: 'GIANTX', shortName: 'GX', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/af80b36401e45be0a5eb13549ff4128f',
        players: [
            { id: 'gx-top', name: 'GX Top' },
            { id: 'gx-jungle', name: 'GX Jungle' },
            { id: 'gx-mid', name: 'GX Mid' },
            { id: 'gx-adc', name: 'GX ADC' },
            { id: 'gx-support', name: 'GX Support' },
        ]
    },
    {
        id: '52661', name: 'Shifters', shortName: 'SHF', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/7df957bb35378ac0ba4dcd1cdb50ee83',
        players: [
            { id: 'shf-top', name: 'SHF Top' },
            { id: 'shf-jungle', name: 'SHF Jungle' },
            { id: 'shf-mid', name: 'SHF Mid' },
            { id: 'shf-adc', name: 'SHF ADC' },
            { id: 'shf-support', name: 'SHF Support' },
        ]
    },
    {
        id: '47370', name: 'Team Vitality', shortName: 'VIT', region: 'LEC', color: '#FEE100', logo: 'https://cdn.grid.gg/assets/team-logos/195171114bca3c1f69136199f73fce14',
        players: [
            { id: 'vit-top', name: 'VIT Top' },
            { id: 'vit-jungle', name: 'VIT Jungle' },
            { id: 'vit-mid', name: 'VIT Mid' },
            { id: 'vit-adc', name: 'VIT ADC' },
            { id: 'vit-support', name: 'VIT Support' },
        ]
    },
    {
        id: '55749', name: 'Natus Vincere', shortName: 'NAVI', region: 'LEC', color: '#FFFF00', logo: 'https://cdn.grid.gg/assets/team-logos/af2a05c3739af4d1bef50163692d78e0',
        players: [
            { id: 'navi-top', name: 'NAVI Top' },
            { id: 'navi-jungle', name: 'NAVI Jungle' },
            { id: 'navi-mid', name: 'NAVI Mid' },
            { id: 'navi-adc', name: 'NAVI ADC' },
            { id: 'navi-support', name: 'NAVI Support' },
        ]
    },
    {
        id: '47435', name: 'Team Heretics', shortName: 'TH', region: 'LEC', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/64b4c8501ef44ba51648a38d131d9f2e',
        players: [
            { id: 'th-top', name: 'TH Top' },
            { id: 'th-jungle', name: 'TH Jungle' },
            { id: 'th-mid', name: 'TH Mid' },
            { id: 'th-adc', name: 'TH ADC' },
            { id: 'th-support', name: 'TH Support' },
        ]
    },

    // --- LTA North (Americas) ---
    {
        id: '47363', name: 'Team Liquid', shortName: 'TL', region: 'LTA North', color: '#0C223F', logo: 'https://cdn.grid.gg/assets/team-logos/ff1be4367df4d5a7a47e8ce8353d1d46',
        players: [
            { id: 'tl-top', name: 'TL Top' },
            { id: 'tl-jungle', name: 'TL Jungle' },
            { id: 'tl-mid', name: 'TL Mid' },
            { id: 'tl-adc', name: 'TL ADC' },
            { id: 'tl-support', name: 'TL Support' },
        ]
    },
    {
        id: '53073', name: 'Shopify Rebellion', shortName: 'SR', region: 'LTA North', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/25c81a9203d53e13e0dc9ab7d0dc35a0',
        players: [
            { id: 'sr-top', name: 'SR Top' },
            { id: 'sr-jungle', name: 'SR Jungle' },
            { id: 'sr-mid', name: 'SR Mid' },
            { id: 'sr-adc', name: 'SR ADC' },
            { id: 'sr-support', name: 'SR Support' },
        ]
    },
    {
        id: '54198', name: 'LYON', shortName: 'LYN', region: 'LTA North', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/e6b15b1910b92edfa85729a29ef40e08',
        players: [
            { id: 'lyn-top', name: 'LYN Top' },
            { id: 'lyn-jungle', name: 'LYN Jungle' },
            { id: 'lyn-mid', name: 'LYN Mid' },
            { id: 'lyn-adc', name: 'LYN ADC' },
            { id: 'lyn-support', name: 'LYN Support' },
        ]
    },
    {
        id: '340', name: 'FlyQuest', shortName: 'FLY', region: 'LTA North', color: '#1E4F2B', logo: 'https://cdn.grid.gg/assets/team-logos/c073b6e06dbed1d34d37fdcfdda85e4d',
        players: [
            { id: 'fly-top', name: 'FLY Top' },
            { id: 'fly-jungle', name: 'FLY Jungle' },
            { id: 'fly-mid', name: 'FLY Mid' },
            { id: 'fly-adc', name: 'FLY ADC' },
            { id: 'fly-support', name: 'FLY Support' },
        ]
    },
    {
        id: '52416', name: 'Disguised', shortName: 'DSG', region: 'LTA North', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/2722c22bfb10c68858dd358e13fe3fc5',
        players: [
            { id: 'dsg-top', name: 'DSG Top' },
            { id: 'dsg-jungle', name: 'DSG Jungle' },
            { id: 'dsg-mid', name: 'DSG Mid' },
            { id: 'dsg-adc', name: 'DSG ADC' },
            { id: 'dsg-support', name: 'DSG Support' },
        ]
    },
    {
        id: '47499', name: 'Dignitas', shortName: 'DIG', region: 'LTA North', color: '#FFB81C', logo: 'https://cdn.grid.gg/assets/team-logos/7562a16d59f1e163bf38214c552403d9',
        players: [
            { id: 'dig-top', name: 'DIG Top' },
            { id: 'dig-jungle', name: 'DIG Jungle' },
            { id: 'dig-mid', name: 'DIG Mid' },
            { id: 'dig-adc', name: 'DIG ADC' },
            { id: 'dig-support', name: 'DIG Support' },
        ]
    },
    {
        id: '47351', name: 'Cloud9 Kia', shortName: 'C9', region: 'LTA North', color: '#00AEEF', logo: 'https://cdn.grid.gg/assets/team-logos/f7d208601ddc141eb136d9aba8ae7156',
        players: [
            { id: 'c9-top', name: 'C9 Top' },
            { id: 'c9-jungle', name: 'C9 Jungle' },
            { id: 'c9-mid', name: 'C9 Mid' },
            { id: 'c9-adc', name: 'C9 ADC' },
            { id: 'c9-support', name: 'C9 Support' },
        ]
    },
    {
        id: '47497', name: '100 Thieves', shortName: '100', region: 'LTA North', color: '#EB3335', logo: 'https://cdn.grid.gg/assets/team-logos/5200f435d4391140826fada04936283c',
        players: [
            { id: '100-top', name: '100 Top' },
            { id: '100-jungle', name: '100 Jungle' },
            { id: '100-mid', name: '100 Mid' },
            { id: '100-adc', name: '100 ADC' },
            { id: '100-support', name: '100 Support' },
        ]
    },

    // --- LTA South (Americas) ---
    {
        id: '48173', name: 'Vivo Keyd Stars', shortName: 'VKS', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/5fc2be84ac533a23b4c47fe1a5f9b8a8',
        players: [
            { id: 'vks-top', name: 'VKS Top' },
            { id: 'vks-jungle', name: 'VKS Jungle' },
            { id: 'vks-mid', name: 'VKS Mid' },
            { id: 'vks-adc', name: 'VKS ADC' },
            { id: 'vks-support', name: 'VKS Support' },
        ]
    },
    {
        id: '52573', name: 'RED Canids Kalunga', shortName: 'RED', region: 'LTA South', color: '#DE2027', logo: 'https://cdn.grid.gg/assets/team-logos/81c89d9a51f0f48ad863031b7966267f',
        players: [
            { id: 'red-top', name: 'RED Top' },
            { id: 'red-jungle', name: 'RED Jungle' },
            { id: 'red-mid', name: 'RED Mid' },
            { id: 'red-adc', name: 'RED ADC' },
            { id: 'red-support', name: 'RED Support' },
        ]
    },
    {
        id: '3389', name: 'Pain Gaming', shortName: 'PNG', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/6e3304db2cad17630886f15a94c640e1',
        players: [
            { id: 'png-top', name: 'PNG Top' },
            { id: 'png-jungle', name: 'PNG Jungle' },
            { id: 'png-mid', name: 'PNG Mid' },
            { id: 'png-adc', name: 'PNG ADC' },
            { id: 'png-support', name: 'PNG Support' },
        ]
    },
    {
        id: '47960', name: 'LOUD', shortName: 'LLL', region: 'LTA South', color: '#00FF00', logo: 'https://cdn.grid.gg/assets/team-logos/c6b8fc94efc77793bf8a3bec217e9040',
        players: [
            { id: 'lll-top', name: 'LLL Top' },
            { id: 'lll-jungle', name: 'LLL Jungle' },
            { id: 'lll-mid', name: 'LLL Mid' },
            { id: 'lll-adc', name: 'LLL ADC' },
            { id: 'lll-support', name: 'LLL Support' },
        ]
    },
    {
        id: '47757', name: 'LEVIATÁN', shortName: 'LEV', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/54f4e80969726869b0fbf48fb9ec5b18',
        players: [
            { id: 'lev-top', name: 'LEV Top' },
            { id: 'lev-jungle', name: 'LEV Jungle' },
            { id: 'lev-mid', name: 'LEV Mid' },
            { id: 'lev-adc', name: 'LEV ADC' },
            { id: 'lev-support', name: 'LEV Support' },
        ]
    },
    {
        id: '54284', name: 'Isurus', shortName: 'ISG', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/415cfdbb29b0f073df49ad8df54a1dcc',
        players: [
            { id: 'isg-top', name: 'ISG Top' },
            { id: 'isg-jungle', name: 'ISG Jungle' },
            { id: 'isg-mid', name: 'ISG Mid' },
            { id: 'isg-adc', name: 'ISG ADC' },
            { id: 'isg-support', name: 'ISG Support' },
        ]
    },
    {
        id: '47389', name: 'FURIA', shortName: 'FUR', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/cca64419f3775b0067e9244360474421',
        players: [
            { id: 'fur-top', name: 'FUR Top' },
            { id: 'fur-jungle', name: 'FUR Jungle' },
            { id: 'fur-mid', name: 'FUR Mid' },
            { id: 'fur-adc', name: 'FUR ADC' },
            { id: 'fur-support', name: 'FUR Support' },
        ]
    },
    {
        id: '48070', name: 'Fluxo', shortName: 'FLX', region: 'LTA South', color: '#000000', logo: 'https://cdn.grid.gg/assets/team-logos/0c1fba2ee93cc361e7f6275ae1220830',
        players: [
            { id: 'flx-top', name: 'FLX Top' },
            { id: 'flx-jungle', name: 'FLX Jungle' },
            { id: 'flx-mid', name: 'FLX Mid' },
            { id: 'flx-adc', name: 'FLX ADC' },
            { id: 'flx-support', name: 'FLX Support' },
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
