import { Easing } from "react-native";
import { CardStyleInterpolators } from "@react-navigation/stack";

const config = {
    animation: "spring",
    config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
    },
};

const closeConfig = {
    animation: "timing",
    config: {
        duration: 500,
        easing: Easing.linear,
    },
};

export const stackConfig: any = {
    gestureDirection: "horizontal",
    gestureEnabled: true,
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    transitionSpec: {
        open: config,
        close: closeConfig,
    },
};
