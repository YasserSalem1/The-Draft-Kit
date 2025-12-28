'use client';

import { useDraft } from '@/lib/draft/draft-context';
import { RotateCcw } from 'lucide-react';

export function DraftControls() {
    const { isStarted, resetDraft } = useDraft();

    if (!isStarted) {
        return null;
    }

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={resetDraft}
                className="p-2 text-gray-500 hover:text-white transition-colors ml-auto"
                title="Reset Draft"
            >
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-widest">
                    <RotateCcw className="w-4 h-4" /> Reset
                </div>
            </button>
        </div>
    );
}
