export interface AIRecommendation {
    championName: string;
    role: string;
    winRate: number;
    reasoning: string[];
    score: number; // 0-100 relevance score
}

export interface AIDraftState {
    recommendations: AIRecommendation[];
    riskAlert?: {
        type: 'warning' | 'info' | 'critical';
        message: string;
    };
    currentWinRate: number;
    predictedWinRate: number;
}

export const MOCK_AI_DATA: AIDraftState = {
    recommendations: [
        {
            championName: "Sejuani",
            role: "JUNGLE",
            winRate: 60,
            reasoning: [
                "High synergy with Ashe / Braum",
                "Strong frontline vs Viego",
                "Improves teamfight reliability"
            ],
            score: 95
        },
        {
            championName: "Maokai",
            role: "JUNGLE",
            winRate: 58,
            reasoning: [
                "Excellent objective control",
                "Flex pick potential",
                "Reliable engage"
            ],
            score: 88
        },
        {
            championName: "Jarvan IV",
            role: "JUNGLE",
            winRate: 53,
            reasoning: [
                "Early game pressure",
                "Good lock down vs immobile carries",
                "Armor shred utility"
            ],
            score: 82
        },
        {
            championName: "Vi",
            role: "JUNGLE",
            winRate: 51,
            reasoning: [
                "Guaranteed backline access",
                "Strong skirmishing",
            ],
            score: 75
        }
    ],
    riskAlert: {
        type: 'warning',
        message: "Current draft lacks AP damage. Consider mid-lane AP later in draft."
    },
    currentWinRate: 52,
    predictedWinRate: 60
};
