import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import {
    RewardedAd,
    RewardedAdEventType,
    TestIds,
} from "react-native-google-mobile-ads";

const IS_DEV = __DEV__;
const extra = Constants.expoConfig?.extra || {};

export const BANNER_AD_UNIT_ID = IS_DEV
    ? TestIds.BANNER
    : Platform.OS === "ios"
        ? extra.IOS_ADMOB_BANNER_ID ?? "ca-app-pub-7257014034403853/6065347522"  // fallback seguro
        : extra.ANDROID_ADMOB_BANNER_ID ?? "ca-app-pub-7257014034403853/8914037993";

export const REWARDED_AD_UNIT_ID = IS_DEV
    ? TestIds.REWARDED
    : Platform.OS === "ios"
        ? extra.IOS_ADMOB_REWARDED_ID ?? "ca-app-pub-7257014034403853/4396817292"
        : extra.ANDROID_ADMOB_REWARDED_ID ?? "ca-app-pub-7257014034403853/8503897897";

export function useRewardedAd(onRewarded: () => void) {
    const [loaded, setLoaded] = useState(false);
    const [rewarded] = useState(() => RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID));

    useEffect(() => {
        const unsubLoad = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            setLoaded(true);
        });
        const unsubEarned = rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            () => onRewarded()
        );
        rewarded.load();
        return () => {
            unsubLoad();
            unsubEarned();
        };
    }, []);

    function showAd() {
        if (loaded) {
            rewarded.show();
            setLoaded(false);
        }
    }
    return { showAd, loaded };
}