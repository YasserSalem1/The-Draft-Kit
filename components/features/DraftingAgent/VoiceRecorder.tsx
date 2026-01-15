'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    onRecordingStart?: () => void;
    onRecordingEnd?: () => void;
    disabled?: boolean;
}

export function VoiceRecorder({
    onTranscription,
    onRecordingStart,
    onRecordingEnd,
    disabled = false,
}: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setIsProcessing(true);
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                // Send to STT endpoint
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');

                try {
                    const response = await fetch('http://localhost:5002/stt', {
                        method: 'POST',
                        body: formData,
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.text) {
                            onTranscription(data.text);
                        }
                    } else {
                        console.error('STT request failed');
                    }
                } catch (error) {
                    console.error('STT error:', error);
                } finally {
                    setIsProcessing(false);
                    onRecordingEnd?.();
                }

                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            onRecordingStart?.();
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }, [onTranscription, onRecordingStart, onRecordingEnd]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const handleClick = () => {
        if (disabled || isProcessing) return;

        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <motion.button
            onClick={handleClick}
            disabled={disabled || isProcessing}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            className={`
        relative w-20 h-20 rounded-full flex items-center justify-center
        transition-all duration-300
        ${isRecording
                    ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                    : isProcessing
                        ? 'bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
        >
            {/* Pulse animation when recording */}
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        exit={{ scale: 1, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-red-500"
                    />
                )}
            </AnimatePresence>

            {/* Icon */}
            <div className="relative z-10">
                {isProcessing ? (
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : isRecording ? (
                    <Square className="w-8 h-8 text-white fill-white" />
                ) : (
                    <Mic className="w-8 h-8 text-white" />
                )}
            </div>
        </motion.button>
    );
}
