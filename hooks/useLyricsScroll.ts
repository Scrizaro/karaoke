import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView } from 'react-native';

export const useLyricsScroll = (activeLineIndex: number) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [scrollViewHeight, setScrollViewHeight] = useState(0);
    const lineLayouts = useRef<{ [key: number]: { y: number; height: number } }>({});

    const isUserInteracting = useRef(false);
    const interactionTimeout = useRef<NodeJS.Timeout | null>(null);
    const activeLineIndexRef = useRef(activeLineIndex);

    const scrollToActiveLine = (index: number) => {
        if (index === -1 || scrollViewHeight === 0) return;

        const layout = lineLayouts.current[index];
        if (!layout) return;

        const { y, height: lineHeight } = layout;
        const centerOffset = scrollViewHeight / 2 - lineHeight / 2;
        const offset = y - centerOffset;

        scrollViewRef.current?.scrollTo({
            y: Math.max(0, offset),
            animated: true,
        });
    };

    const startInteraction = () => {
        isUserInteracting.current = true;
        if (interactionTimeout.current) {
            clearTimeout(interactionTimeout.current);
        }
    };

    const endInteraction = () => {
        if (interactionTimeout.current) {
            clearTimeout(interactionTimeout.current);
        }
        interactionTimeout.current = setTimeout(() => {
            isUserInteracting.current = false;
            scrollToActiveLine(activeLineIndexRef.current);
        }, 5000);
    };

    const handleLayout = (e: LayoutChangeEvent) => {
        setScrollViewHeight(e.nativeEvent.layout.height);
    };

    const handleLineLayout = (index: number, e: LayoutChangeEvent) => {
        lineLayouts.current[index] = {
            y: e.nativeEvent.layout.y,
            height: e.nativeEvent.layout.height,
        };
    };

    useEffect(() => {
        activeLineIndexRef.current = activeLineIndex;
    }, [activeLineIndex]);

    useEffect(() => {
        if (activeLineIndex !== -1 && !isUserInteracting.current) {
            scrollToActiveLine(activeLineIndex);
        }
    }, [activeLineIndex, scrollViewHeight]);

    return {
        scrollViewRef,
        scrollViewHeight,
        startInteraction,
        endInteraction,
        handleLayout,
        handleLineLayout,
        scrollToActiveLine
    };
}
