import { AVPlaybackSource, AVPlaybackStatus, Audio } from 'expo-av';
import { useEffect, useState } from 'react';

export const useKaraokeAudio = (audioSource: AVPlaybackSource) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        async function loadSound() {
            try {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    audioSource,
                    { shouldPlay: false },
                    onPlaybackStatusUpdate
                );
                setSound(newSound);
            } catch (error) {
                console.error('Error loading sound', error);
            }
        }

        loadSound();

        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [audioSource]); // Re-load if source changes, though unlikely in this simplified case

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setCurrentTime(status.positionMillis);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);

            if (status.didJustFinish) {
                setIsPlaying(false);
            }
        }
    };

    const togglePlayback = async () => {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.playAsync();
        }
    };

    const seek = async (ms: number) => {
        if (sound) {
            await sound.setPositionAsync(ms);
        }
    };

    const skipForward = async () => {
        if (!sound) return;
        const newTime = Math.min(duration, currentTime + 10000);
        await sound.setPositionAsync(newTime);
    };

    const skipBackward = async () => {
        if (!sound) return;
        const newTime = Math.max(0, currentTime - 10000);
        await sound.setPositionAsync(newTime);
    };

    return {
        sound,
        currentTime,
        duration,
        isPlaying,
        togglePlayback,
        seek,
        skipForward,
        skipBackward
    };
}
