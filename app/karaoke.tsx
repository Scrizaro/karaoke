import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, {useEffect, useState} from 'react';
import { Dimensions, GestureResponderEvent, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_LYRICS_DATA } from '@/constants/mockData';
import { useKaraokeAudio } from '@/hooks/useKaraokeAudio';
import { useLyricsScroll } from '@/hooks/useLyricsScroll';
import { useLyricsSync } from '@/hooks/useLyricsSync';
import {formatTime} from "@/app/utils/formatTime";

const { width } = Dimensions.get('window');
// Audio calibration offset for mockData
const SYNC_OFFSET = 1050;

const KaraokeScreen = () => {
    const router = useRouter();
    const [lastSkipBackTime, setLastSkipBackTime] = useState(0);
    const [showTranslation, setShowTranslation] = useState(false);
    const insets = useSafeAreaInsets();

    const {
        currentTime,
        duration,
        isPlaying,
        togglePlayback,
        seek,
        skipForward,
        skipBackward
    } = useKaraokeAudio(MOCK_LYRICS_DATA.audio);

    const {
        lyrics,
        activeLineIndex,
    } = useLyricsSync(MOCK_LYRICS_DATA.richSync.words, MOCK_LYRICS_DATA.lrc, currentTime, SYNC_OFFSET);

    const {
        scrollViewRef,
        scrollViewHeight,
        startInteraction,
        endInteraction,
        handleLayout,
        handleLineLayout,
        scrollToActiveLine
    } = useLyricsScroll(activeLineIndex);

    useEffect(() => {
        if (activeLineIndex !== -1) {
            setTimeout(() => {
                scrollToActiveLine(activeLineIndex);
            }, 100);
        }
    }, [showTranslation]);

    const handleSkipBackward = () => {
        const now = Date.now();
        if (now - lastSkipBackTime < 500) { // Double tap threshold
            seek(0);
        } else {
            skipBackward();
        }
        setLastSkipBackTime(now);
    };

    const handleProgressBarPress = (e: GestureResponderEvent) => {
        if (duration === 0) return;
        const { locationX } = e.nativeEvent;
        const barWidth = width - 60;
        const percentage = locationX / barWidth;
        const seekTime = duration * percentage;
        seek(seekTime);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* Background */}
            <Image
                source={{ uri: MOCK_LYRICS_DATA.album.cover_xl }}
                style={StyleSheet.absoluteFill}
                blurRadius={50}
                contentFit="cover"
            />
            <View style={styles.overlay} />

            <View style={[styles.header, { marginTop: insets.top }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: MOCK_LYRICS_DATA.album.cover }}
                        style={styles.albumArtSmall}
                    />
                    <View style={styles.songInfo}>
                        <Text style={styles.songTitle}>{MOCK_LYRICS_DATA.title}</Text>
                        <Text style={styles.artistName}>{MOCK_LYRICS_DATA.artist.name}</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.lyricsContainer}
                contentContainerStyle={{ paddingVertical: scrollViewHeight / 2 }}
                showsVerticalScrollIndicator={false}
                onLayout={handleLayout}
                onScrollBeginDrag={startInteraction}
                onScrollEndDrag={endInteraction}
                onMomentumScrollBegin={startInteraction}
                onMomentumScrollEnd={endInteraction}
                scrollEventThrottle={16}
            >
                {lyrics.map((line, index) => {
                    const isActive = index === activeLineIndex;

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => seek(line.milliseconds)}
                            activeOpacity={0.7}
                            onLayout={(e) => handleLineLayout(index, e)}
                        >
                            <Text
                                style={[
                                    styles.lyricLine,
                                    isActive && styles.activeLyricLine,
                                ]}
                            >
                                {isActive ? (
                                    line.words.map((word, wordIndex) => {
                                        const isWordActive = (currentTime + SYNC_OFFSET) >= word.start;
                                        return (
                                            <Text
                                                key={wordIndex}
                                                style={{
                                                    color: isWordActive ? 'white' : 'rgba(255,255,255,0.5)',
                                                }}
                                            >
                                                {word.text}{' '}
                                            </Text>
                                        );
                                    })
                                ) : (
                                    line.line
                                )}
                            </Text>
                            {showTranslation && line.translations?.es && (
                                <Text style={[styles.translationLine, isActive && styles.activeTranslationLine]}>
                                    {line.translations.es.text}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    onPress={() => setShowTranslation(!showTranslation)}
                    style={[
                        styles.translationButton,
                        { backgroundColor: showTranslation ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)' }
                    ]}
                >
                    <Ionicons name="language" size={22} color="#fff" />
                </TouchableOpacity>

                <TouchableWithoutFeedback onPress={handleProgressBarPress}>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }]} />
                    </View>
                </TouchableWithoutFeedback>

                <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>

                <View style={styles.buttonsRow}>
                    <TouchableOpacity onPress={handleSkipBackward}>
                        <Ionicons name="play-skip-back" size={40} color="white" style={{ marginRight: 40 }} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlayback}>
                        <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={80} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={skipForward}>
                        <Ionicons name="play-skip-forward" size={40} color="white" style={{ marginLeft: 40 }} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    albumArtSmall: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    songInfo: {
        flex: 1,
    },
    songTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    artistName: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    lyricsContainer: {
        flex: 1,
    },
    lyricLine: {
        fontSize: 24,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)', // Dimmed by default for past/future
        marginBottom: 30,
        paddingHorizontal: 30,
        lineHeight: 36,
    },
    activeLyricLine: {
        color: 'white',
        fontSize: 28,
        transform: [{ scale: 1.05 }],
    },
    translationLine: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 30,
        marginBottom: 10,
        marginTop: -20, // Pull it closer to the main lyrics
    },
    activeTranslationLine: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 20,
    },
    controls: {
        paddingHorizontal: 30,
        backgroundColor: 'transparent',
    },
    progressBarContainer: {
        height: 20,
        justifyContent: 'center',
        marginBottom: 10,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'white',
        borderRadius: 2,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    timeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontVariant: ['tabular-nums'],
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    translationButton: {
        marginBottom: 10,
        alignSelf: 'flex-start',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default KaraokeScreen;
