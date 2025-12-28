export const SCOUTING_DATA = {
    t1: {
        id: 't1',
        overview: "Aggressive early-game team with strong bot lane focus.",
        strategies: [
            "82% first dragon contest",
            "4-man bot lane rotations",
            "Prefers scaling compositions",
            "High priority on Herald control"
        ],
        tendencies: [
            { role: "TOP", name: "Zeus", tendency: "High Renekton/Jayce priority" },
            { role: "JUNGLE", name: "Oner", tendency: "Early bot-side pathing" },
            { role: "MID", name: "Faker", tendency: "Global pressure / Playmaking" },
            { role: "ADC", name: "Gumayusi", tendency: "Lane dominant / Push heavy" },
            { role: "SUPPORT", name: "Keria", tendency: "Ranged supports / Unconventional picks" },
        ],
        recentComps: ["Jayce", "Sejuani", "Azir", "Varus", "Ashe"],
        famousPicks: [
            { name: "LeBlanc", rate: 85 },
            { name: "Lee Sin", rate: 72 },
            { name: "Caitlyn", rate: 68 },
            { name: "Jayce", rate: 64 }
        ],
        popularBans: [
            { name: "Rumble", rate: 95 },
            { name: "Maokai", rate: 88 },
            { name: "Lucian", rate: 45 }
        ],
        insight: "Win condition is bot lane. Recommend early jungle pressure top-side and mid to isolate their strong side."
    },
    geng: {
        id: 'geng',
        overview: "Calculated macro team capitalizing on mid-game spikes.",
        strategies: [
            "Cross-map trading objectives",
            "Mid-jungle synergy focus",
            "Defensive vision control",
            "Late game teamfighting"
        ],
        tendencies: [
            { role: "TOP", name: "Kiin", tendency: "Weak side tank specialist" },
            { role: "JUNGLE", name: "Canyon", tendency: "Carry junglers / Invade heavy" },
            { role: "MID", name: "Chovy", tendency: "High CS / Side lane pressure" },
            { role: "ADC", name: "Peyz", tendency: "Hyper-carry protection" },
            { role: "SUPPORT", name: "Lehends", tendency: "Engage supports / Roaming" },
        ],
        recentComps: ["KSante", "Viego", "Ahri", "Zeri", "Lulu"],
        famousPicks: [
            { name: "Yone", rate: 92 },
            { name: "Nidalee", rate: 75 },
            { name: "Singed", rate: 40 }
        ],
        popularBans: [
            { name: "Vi", rate: 100 },
            { name: "Ahri", rate: 82 },
            { name: "Nautilus", rate: 60 }
        ],
        insight: "Disrupt Chovy's farming rhythm. Ban engage supports to limit Lehends' roam potential."
    }
};

export type ScoutingReportData = typeof SCOUTING_DATA.t1;
