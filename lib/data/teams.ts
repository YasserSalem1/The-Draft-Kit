export type Region = 'LCK' | 'LPL' | 'LEC' | 'LTA North' | 'LTA South' | 'LCP' | 'PCS' | 'VCS' | 'Other';

export interface Player {
    id: string;
    name: string;
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
    players: Player[];
}

export const TEAMS: Team[] = [
    // --- LCK (Korea) ---
    {
        id: 't1', name: 'T1', shortName: 'T1', region: 'LCK', color: '#E4002B', logo: '/logos/t1.svg',
        players: [
            { id: 'zeus', name: 'Zeus', role: 'TOP' },
            { id: 'oner', name: 'Oner', role: 'JUNGLE' },
            { id: 'faker', name: 'Faker', role: 'MID' },
            { id: 'gumayusi', name: 'Gumayusi', role: 'ADC' },
            { id: 'keria', name: 'Keria', role: 'SUPPORT' },
        ]
    },
    {
        id: 'geng', name: 'Gen.G', shortName: 'GEN', region: 'LCK', color: '#AA8A00', logo: '/logos/geng.svg',
        players: [
            { id: 'kiin', name: 'Kiin', role: 'TOP' },
            { id: 'canyon', name: 'Canyon', role: 'JUNGLE' },
            { id: 'chovy', name: 'Chovy', role: 'MID' },
            { id: 'ruler', name: 'Ruler', role: 'ADC' },
            { id: 'duro', name: 'Duro', role: 'SUPPORT' },
        ]
    },
    {
        id: 'hwh', name: 'Hanwha Life', shortName: 'HLE', region: 'LCK', color: '#FF6B00', logo: '/logos/hle.svg',
        players: [
            { id: 'doran', name: 'Doran', role: 'TOP' },
            { id: 'peanut', name: 'Peanut', role: 'JUNGLE' },
            { id: 'zeka', name: 'Zeka', role: 'MID' },
            { id: 'viper', name: 'Viper', role: 'ADC' },
            { id: 'delight', name: 'Delight', role: 'SUPPORT' },
        ]
    },
    {
        id: 'dk', name: 'Dplus KIA', shortName: 'DK', region: 'LCK', color: '#00FA9A', logo: '/logos/dk.svg',
        players: [
            { id: 'siwoo', name: 'Siwoo', role: 'TOP' },
            { id: 'lucid', name: 'Lucid', role: 'JUNGLE' },
            { id: 'showmaker', name: 'ShowMaker', role: 'MID' },
            { id: 'aiming', name: 'Aiming', role: 'ADC' },
            { id: 'beryl', name: 'BeryL', role: 'SUPPORT' },
        ]
    },
    {
        id: 'kt', name: 'KT Rolster', shortName: 'KT', region: 'LCK', color: '#EA3323', logo: '/logos/kt.svg',
        players: [
            { id: 'perfect', name: 'PerfecT', role: 'TOP' },
            { id: 'cuzz', name: 'Cuzz', role: 'JUNGLE' },
            { id: 'bdd', name: 'Bdd', role: 'MID' },
            { id: 'deokdam', name: 'Deokdam', role: 'ADC' },
            { id: 'way', name: 'Way', role: 'SUPPORT' },
        ]
    },

    // --- LPL (China) ---
    {
        id: 'blg', name: 'Bilibili Gaming', shortName: 'BLG', region: 'LPL', color: '#00A1D6', logo: '/logos/blg.svg',
        players: [
            { id: 'bin', name: 'Bin', role: 'TOP' },
            { id: 'xun', name: 'Xun', role: 'JUNGLE' },
            { id: 'knight', name: 'knight', role: 'MID' },
            { id: 'elk', name: 'Elk', role: 'ADC' },
            { id: 'on', name: 'ON', role: 'SUPPORT' },
        ]
    },
    {
        id: 'tes', name: 'Top Esports', shortName: 'TES', region: 'LPL', color: '#FF4200', logo: '/logos/tes.svg',
        players: [
            { id: '369', name: '369', role: 'TOP' },
            { id: 'tian', name: 'Tian', role: 'JUNGLE' },
            { id: 'creme', name: 'Creme', role: 'MID' },
            { id: 'jackeylove', name: 'JackeyLove', role: 'ADC' },
            { id: 'meiko', name: 'Meiko', role: 'SUPPORT' },
        ]
    },
    {
        id: 'wbg', name: 'Weibo Gaming', shortName: 'WBG', region: 'LPL', color: '#E4002B', logo: '/logos/wbg.svg',
        players: [
            { id: 'breathe', name: 'Breathe', role: 'TOP' },
            { id: 'tarzan', name: 'Tarzan', role: 'JUNGLE' },
            { id: 'xiaohu', name: 'Xiaohu', role: 'MID' },
            { id: 'light', name: 'Light', role: 'ADC' },
            { id: 'crisp', name: 'Crisp', role: 'SUPPORT' },
        ]
    },
    {
        id: 'lng', name: 'LNG Esports', shortName: 'LNG', region: 'LPL', color: '#0055FF', logo: '/logos/lng.svg',
        players: [
            { id: 'zika', name: 'Zika', role: 'TOP' },
            { id: 'weiwei', name: 'Weiwei', role: 'JUNGLE' },
            { id: 'scout', name: 'Scout', role: 'MID' },
            { id: 'gala', name: 'GALA', role: 'ADC' },
            { id: 'hang', name: 'Hang', role: 'SUPPORT' },
        ]
    },
    {
        id: 'jdg', name: 'JD Gaming', shortName: 'JDG', region: 'LPL', color: '#C60C30', logo: '/logos/jdg.svg',
        players: [
            { id: 'xiaoxu', name: 'Xiaoxu', role: 'TOP' },
            { id: 'junjia', name: 'JunJia', role: 'JUNGLE' },
            { id: 'hongq', name: 'HongQ', role: 'MID' },
            { id: 'gala2', name: 'GALA', role: 'ADC' },
            { id: 'vampire', name: 'Vampire', role: 'SUPPORT' },
        ]
    },

    // --- LEC (EMEA) ---
    {
        id: 'g2', name: 'G2 Esports', shortName: 'G2', region: 'LEC', color: '#000000', logo: '/logos/g2.svg',
        players: [
            { id: 'brokenblade', name: 'BrokenBlade', role: 'TOP' },
            { id: 'yike', name: 'Yike', role: 'JUNGLE' },
            { id: 'caps', name: 'Caps', role: 'MID' },
            { id: 'hanssama', name: 'Hans Sama', role: 'ADC' },
            { id: 'mikyx', name: 'Mikyx', role: 'SUPPORT' },
        ]
    },
    {
        id: 'fnc', name: 'Fnatic', shortName: 'FNC', region: 'LEC', color: '#FF5900', logo: '/logos/fnc.svg',
        players: [
            { id: 'oscarinin', name: 'Oscarinin', role: 'TOP' },
            { id: 'razork', name: 'Razork', role: 'JUNGLE' },
            { id: 'humanoid', name: 'Humanoid', role: 'MID' },
            { id: 'upset', name: 'Upset', role: 'ADC' },
            { id: 'mikyx2', name: 'Mikyx', role: 'SUPPORT' }, // Note: check rumors
        ]
    },
    {
        id: 'kc', name: 'Karmine Corp', shortName: 'KC', region: 'LEC', color: '#1A334C', logo: '/logos/kc.svg',
        players: [
            { id: 'canna', name: 'Canna', role: 'TOP' },
            { id: 'yike2', name: 'Yike', role: 'JUNGLE' },
            { id: 'vladi', name: 'Vladi', role: 'MID' },
            { id: 'caliste', name: 'Caliste', role: 'ADC' },
            { id: 'targamas', name: 'Targamas', role: 'SUPPORT' },
        ]
    },

    // --- LTA North (Americas) ---
    {
        id: 'fly', name: 'FlyQuest', shortName: 'FLY', region: 'LTA North', color: '#1E4F2B', logo: '/logos/fly.svg',
        players: [
            { id: 'bwipo', name: 'Bwipo', role: 'TOP' },
            { id: 'inspired', name: 'Inspired', role: 'JUNGLE' },
            { id: 'quad', name: 'Quad', role: 'MID' },
            { id: 'massu', name: 'Massu', role: 'ADC' },
            { id: 'busio', name: 'Busio', role: 'SUPPORT' },
        ]
    },
    {
        id: 'tl', name: 'Team Liquid', shortName: 'TL', region: 'LTA North', color: '#0C223F', logo: '/logos/tl.svg',
        players: [
            { id: 'impact', name: 'Impact', role: 'TOP' },
            { id: 'umti', name: 'UmTi', role: 'JUNGLE' },
            { id: 'apa', name: 'APA', role: 'MID' },
            { id: 'yeon', name: 'Yeon', role: 'ADC' },
            { id: 'corejj', name: 'CoreJJ', role: 'SUPPORT' },
        ]
    },
    {
        id: 'c9', name: 'Cloud9', shortName: 'C9', region: 'LTA North', color: '#00AEEF', logo: '/logos/c9.svg',
        players: [
            { id: 'thanatos', name: 'Thanatos', role: 'TOP' },
            { id: 'blaber', name: 'Blaber', role: 'JUNGLE' },
            { id: 'loki', name: 'Loki', role: 'MID' },
            { id: 'zven', name: 'Zven', role: 'ADC' },
            { id: 'vulcan', name: 'Vulcan', role: 'SUPPORT' },
        ]
    },
    {
        id: '100', name: '100 Thieves', shortName: '100', region: 'LTA North', color: '#EB3335', logo: '/logos/100.svg',
        players: [
            { id: 'sniper', name: 'Sniper', role: 'TOP' },
            { id: 'river', name: 'River', role: 'JUNGLE' },
            { id: 'quid', name: 'Quid', role: 'MID' },
            { id: 'fbi', name: 'FBI', role: 'ADC' },
            { id: 'eyla', name: 'Eyla', role: 'SUPPORT' },
        ]
    },

    // --- LCP (Pacific) ---
    {
        id: 'psg', name: 'PSG Talon', shortName: 'PSG', region: 'LCP', color: '#DE0028', logo: '/logos/psg.svg',
        players: [
            { id: 'azhi', name: 'Azhi', role: 'TOP' },
            { id: 'karsa', name: 'Karsa', role: 'JUNGLE' },
            { id: 'maple', name: 'Maple', role: 'MID' },
            { id: 'betty', name: 'Betty', role: 'ADC' },
            { id: 'woody', name: 'Woody', role: 'SUPPORT' },
        ]
    },
    {
        id: 'gam', name: 'GAM Esports', shortName: 'GAM', region: 'LCP', color: '#F8B61C', logo: '/logos/gam.svg',
        players: [
            { id: 'kiaya', name: 'Kiaya', role: 'TOP' },
            { id: 'levi', name: 'Levi', role: 'JUNGLE' },
            { id: 'emo', name: 'Emo', role: 'MID' },
            { id: 'easylove', name: 'EasyLove', role: 'ADC' },
            { id: 'elio', name: 'Elio', role: 'SUPPORT' },
        ]
    },
];
