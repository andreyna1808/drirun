import { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
    RewardedAd,
    RewardedAdEventType,
    TestIds,
} from "react-native-google-mobile-ads";

const IS_DEV = __DEV__;
const IS_IOS = Platform.OS === "ios";

export const BANNER_AD_UNIT_ID = IS_DEV
    ? TestIds.BANNER
    : IS_IOS
        ? process.env.IOS_ADMOB_BANNER_ID!
        : process.env.ANDROID_ADMOB_BANNER_ID!;

export const REWARDED_AD_UNIT_ID = IS_DEV
    ? TestIds.REWARDED
    : IS_IOS
        ? process.env.IOS_ADMOB_REWARDED_ID!
        : process.env.ANDROID_ADMOB_REWARDED_ID!;

export function useRewardedAd(onRewarded: () => void) {
    const [loaded, setLoaded] = useState(false);
    const [rewarded] = useState(() => RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID));

    useEffect(() => {
        const unsubLoad = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            setLoaded(true);
        });
        const unsubEarned = rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            () => {
                onRewarded();
            }
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