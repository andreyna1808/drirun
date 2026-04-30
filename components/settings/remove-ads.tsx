// import React, { useEffect, useState } from 'react';
// import { Alert, ActivityIndicator, View, Text } from 'react-native';
// import * as IAP from 'expo-iap';

// // Função para verificar se o usuário já comprou (ao iniciar o app)
// const checkProductPurchase = async (productId: string) => {
//     try {
//         const purchases = await IAP.getPurchaseHistory();
//         const isPurchased = purchases.some(p => p.productId === productId);
//         if (isPurchased && !state.hasRemovedAds) {
//             await finishTransaction({ purchase, isConsumable: false });
//             dispatch({ type: "REMOVE_ADS" });
//         }
//     } catch (error) {
//         console.error("Falha ao verificar compras anteriores", error);
//     }
// };

// export default function SettingsScreen() {
//     const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);

//     // Effect para conectar o IAP e verificar compras pendentes ao abrir o app
//     useEffect(() => {
//         (async () => {
//             await IAP.initConnection();
//             const restoreResult = await IAP.restorePurchases();
//             const isAlreadyPurchased = restoreResult.some(p => p.productId === 'remove_ads');
//             if (isAlreadyPurchased && !state.hasRemovedAds) {
//                 dispatch({ type: 'REMOVE_ADS' });
//             }
//         })();
//         return () => { IAP.endConnection(); };
//     }, []);

//     async function handleRemoveAds() {
//         if (state.hasRemovedAds) return Alert.alert('✅ Anúncios já removidos!');
//         setIsLoadingPurchase(true);

//         try {
//             const products = await IAP.getProducts(['remove_ads']);
//             if (!products[0]) throw new Error('Produto não encontrado');
//             const purchase = await IAP.requestPurchase('remove_ads');

//             if (purchase?.productId === 'remove_ads' && purchase.purchaseState === IAP.PurchaseState.DID_VERIFY) {
//                 await IAP.finishTransaction({ purchase, isConsumable: false });
//                 dispatch({ type: "REMOVE_ADS" });
//                 Alert.alert("Compra realizada", "Os anúncios foram removidos permanentemente!");
//             } else {
//                 throw new Error("Pagamento não concluído");
//             }
//         } catch (error) {
//             if (error.code !== 'E_USER_CANCELLED') {
//                 Alert.alert("Erro", "Não foi possível processar a compra. Tente novamente.");
//                 console.error(error);
//             }
//         } finally {
//             setIsLoadingPurchase(false);
//         }
//     }


//     {
//         !state.hasRemovedAds ? (
//             <TouchableOpacity style={styles.shopItem} onPress={handleRemoveAds} disabled={isLoadingPurchase}>
//                 <View style={styles.shopItemLeft}>
//                     <Text style={styles.shopItemEmoji}>🚫</Text>
//                     <View>
//                         <Text style={[styles.shopItemTitle, { color: colors.foreground }]}>
//                             {t("settings_remove_ads")}
//                         </Text>
//                         <Text style={[styles.shopItemDesc, { color: colors.muted }]}>
//                             {t("settings_remove_ads_desc")}
//                         </Text>
//                     </View>
//                 </View>
//                 {isLoadingPurchase ? (
//                     <ActivityIndicator color={colors.primary} />
//                 ) : (
//                     <View style={[styles.shopItemPrice, { backgroundColor: colors.primary + "20" }]}>
//                         <Text style={[styles.shopItemPriceText, { color: colors.primary }]}>
//                             {t("settings_remove_ads_price")}
//                         </Text>
//                     </View>
//                 )}
//             </TouchableOpacity>
//         ) : (
//             <View style={styles.shopItemDone}>
//                 <Text style={styles.shopItemEmoji}>✅</Text>
//                 <Text style={[styles.shopItemDoneText, { color: colors.success }]}>
//                     {t("settings_ads_removed")}
//                 </Text>
//             </View>
//         )
//     }