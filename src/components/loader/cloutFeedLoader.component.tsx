import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from 'react-native';
import CloutFeedLoaderLogoComponent from "@components/loader/cloutFeedLoaderLogo.component";
import { themeStyles } from "@styles/globalColors";

export default function CloutFeedLoader() {

    const spin = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0)).current;
    let isMounted = useRef<Boolean>(false).current;

    const animationTiming: number = 600;

    let spinValue = spin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const scaleValue = scale.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.75]
    });

    useEffect(
        () => {
            isMounted = true;
            animate();
            return () => {
                isMounted = false
            };
        },
        []
    );

    function animate() {
        if (isMounted) {
            spin.setValue(0);
            Animated.sequence([
                Animated.timing(
                    scale,
                    {
                        toValue: 0.5,
                        easing: Easing.linear,
                        duration: animationTiming,
                        useNativeDriver: true
                    }
                ),
                Animated.timing(
                    spin,
                    {
                        toValue: 1,
                        duration: animationTiming,
                        easing: Easing.linear,
                        useNativeDriver: true
                    }
                ),
                Animated.timing(
                    scale,
                    {
                        toValue: 0,
                        duration: animationTiming,
                        easing: Easing.linear,
                        useNativeDriver: true
                    }
                ),
            ]).start(animate)
        }
    }

    return (
        <View style={[{ flex: 1 }, themeStyles.containerColorMain]}>
            <Animated.View style={
                [
                    styles.container,
                    {
                        transform: [
                            { rotate: spinValue },
                            { scale: scaleValue },
                        ],
                    }
                ]
            }>
                <CloutFeedLoaderLogoComponent />
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create(
    {
        container: {
            position: 'absolute',
            top: 0,
            bottom: '30%',
            right: 0,
            left: 0,
            justifyContent: 'center',
            alignItems: 'center',
        }
    }
);
