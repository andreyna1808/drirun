import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    Animated,
} from "react-native";
import { PET_STATES } from "@/utils/pet";
import { PetState } from "@/interfaces/context";

export const PhoenixDisplay = ({
    petState,
    petName,
    colors,
    t,
}: {
    petState: PetState;
    petName: string;
    colors: any;
    t: any;
}) => {
    const config = PET_STATES[petState];
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let animation: Animated.CompositeAnimation | null = null;

        if (config.animation === "float") {
            animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, { toValue: -12, duration: 1200, useNativeDriver: true }),
                    Animated.timing(animValue, { toValue: 0, duration: 1200, useNativeDriver: true }),
                ])
            );
        } else if (config.animation === "pulse") {
            animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, { toValue: 1, duration: 800, useNativeDriver: true }),
                    Animated.timing(animValue, { toValue: 0, duration: 800, useNativeDriver: true }),
                ])
            );
        } else if (config.animation === "shake") {
            animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, { toValue: -6, duration: 100, useNativeDriver: true }),
                    Animated.timing(animValue, { toValue: 6, duration: 100, useNativeDriver: true }),
                    Animated.timing(animValue, { toValue: -6, duration: 100, useNativeDriver: true }),
                    Animated.timing(animValue, { toValue: 0, duration: 100, useNativeDriver: true }),
                    Animated.delay(2000),
                ])
            );
        } else if (config.animation === "spin") {
            animation = Animated.loop(
                Animated.timing(animValue, { toValue: 1, duration: 3000, useNativeDriver: true })
            );
        }

        animation?.start();
        return () => {
            animation?.stop();
            animValue.setValue(0);
        };
    }, [petState]);

    const animStyle = (() => {
        if (config.animation === "float" || config.animation === "shake") {
            return { transform: [{ translateY: animValue }] };
        }
        if (config.animation === "pulse") {
            return {
                transform: [{
                    scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
                }],
            };
        }
        if (config.animation === "spin") {
            return {
                transform: [{
                    rotate: animValue.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
                }],
            };
        }
        return {};
    })();

    return (
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <View
                style={{
                    width: 160,
                    height: 160,
                    borderRadius: 80,
                    backgroundColor: config.color + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 3,
                    borderColor: config.color + "40",
                    marginBottom: 16,
                }}
            >
                <Animated.Text style={[{ fontSize: 80 }, animStyle]}>
                    {config.emoji}
                </Animated.Text>
            </View>

            <Text style={{ fontSize: 22, fontWeight: "800", color: config.color, marginBottom: 4 }}>
                {petName}
            </Text>

            <Text style={{ fontSize: 15, color: "#6B7280", marginBottom: 8 }}>
                {t(config.title)}
            </Text>
        </View>
    );
}