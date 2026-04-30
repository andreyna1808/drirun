import { useEffect, useState } from "react";
import {
    RewardedAd,
    RewardedAdEventType,
    TestIds,
} from "react-native-google-mobile-ads";

const IS_DEV = __DEV__;

export const BANNER_AD_UNIT_ID = IS_DEV
    ? TestIds.BANNER
    : process.env.ANDROID_ADMOB_BANNER_ID!;

export const REWARDED_AD_UNIT_ID = IS_DEV
    ? TestIds.REWARDED
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