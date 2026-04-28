/**
 * shop.tsx
 * Pet Shop do DriRun — loja de itens para personalizar a Fênix.
 * Moeda: gemas (💎). Ganhas ao completar dias ou assistir anúncios.
 * Pacotes de gemas disponíveis para compra (IAP).
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import {
  SHOP_ITEMS,
  getRarityColor,
  getRarityLabel,
  type ShopCategory,
  type ShopItem,
} from "@/lib/shopItems";
import { ScreenContainer } from "@/components/screen-container";

// ── Pacotes de gemas (IAP) ────────────────────────────────────────────────────
const GEM_PACKAGES = [
  { id: "gems_50",  gems: 50,  price: "R$ 10,00", emoji: "💎",   bonus: "" },
  { id: "gems_150", gems: 150, price: "R$ 25,00", emoji: "💎💎", bonus: "+10%" },
  { id: "gems_250", gems: 250, price: "R$ 40,00", emoji: "💎💎💎", bonus: "+20%" },
  { id: "gems_500", gems: 500, price: "R$ 70,00", emoji: "💎💎💎💎", bonus: "+30%" },
];

// ── Categorias da loja ────────────────────────────────────────────────────────
const CATEGORIES: { key: ShopCategory | "all"; label: string; emoji: string }[] = [
  { key: "all",        label: "Todos",      emoji: "🛒" },
  { key: "outfit",     label: "Roupas",     emoji: "👕" },
  { key: "accessory",  label: "Acessórios", emoji: "👑" },
  { key: "background", label: "Fundos",     emoji: "🖼️" },
  { key: "furniture",  label: "Mobília",    emoji: "🛋️" },
  { key: "color",      label: "Cores",      emoji: "🎨" },
];

export default function ShopScreen() {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | "all">("all");
  const [activeTab, setActiveTab] = useState<"items" | "gems">("items");

  /** Filtra itens pela categoria selecionada */
  const filteredItems = selectedCategory === "all"
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter((item) => item.category === selectedCategory);

  /** Verifica se o usuário já possui um item */
  function isOwned(itemId: string): boolean {
    return state.pet.ownedItems.some((i) => i.id === itemId);
  }

  /** Compra um item da loja */
  function handleBuyItem(item: ShopItem) {
    if (isOwned(item.id)) {
      Alert.alert("Já possui!", `Você já tem "${item.name}".`);
      return;
    }
    if (state.gems < item.cost) {
      Alert.alert(
        "Gemas insuficientes 💎",
        `Você precisa de ${item.cost} gemas, mas tem apenas ${state.gems}.\n\nComplete corridas ou compre mais gemas!`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Comprar Gemas", onPress: () => setActiveTab("gems") },
        ]
      );
      return;
    }
    Alert.alert(
      `Comprar ${item.emoji} ${item.name}?`,
      `Custo: ${item.cost} 💎\nSeu saldo: ${state.gems} 💎`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Comprar!",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            dispatch({ type: "BUY_SHOP_ITEM", payload: { itemId: item.id, cost: item.cost } });
            Alert.alert("Comprado! 🎉", `"${item.name}" foi adicionado ao seu pet!`);
          },
        },
      ]
    );
  }

  /** Simula compra de pacote de gemas (IAP placeholder) */
  function handleBuyGems(pkg: typeof GEM_PACKAGES[0]) {
    Alert.alert(
      `Comprar ${pkg.gems} 💎?`,
      `Valor: ${pkg.price}\n${pkg.bonus ? `Bônus: ${pkg.bonus}` : ""}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Comprar",
          onPress: () => {
            // TODO: Integrar com expo-in-app-purchases para produção
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            dispatch({ type: "ADD_GEMS", payload: pkg.gems });
            Alert.alert("Gemas adicionadas! 💎", `+${pkg.gems} gemas foram adicionadas!`);
          },
        },
      ]
    );
  }

  const styles = createStyles(colors);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backText, { color: colors.primary }]}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>🛒 Pet Shop</Text>
        <View style={[styles.gemsDisplay, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.gemsText, { color: colors.primary }]}>💎 {state.gems}</Text>
        </View>
      </View>

      {/* Tabs: Itens / Gemas */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(["items", "gems"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => { setActiveTab(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>
              {tab === "items" ? "🎁 Itens" : "💎 Gemas"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab: Itens da Loja */}
      {activeTab === "items" && (
        <>
          {/* Filtro de categorias */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryButton,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  selectedCategory === cat.key && { borderColor: colors.primary, backgroundColor: colors.primary },
                ]}
                onPress={() => { setSelectedCategory(cat.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[
                  styles.categoryLabel,
                  { color: selectedCategory === cat.key ? "#FFFFFF" : colors.muted },
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Lista de itens */}
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.itemsGrid}
            renderItem={({ item }) => {
              const owned = isOwned(item.id);
              const canAfford = state.gems >= item.cost;
              const rarityColor = getRarityColor(item.rarity);
              return (
                <TouchableOpacity
                  style={[
                    styles.itemCard,
                    { backgroundColor: colors.surface, borderColor: owned ? rarityColor : colors.border },
                    owned && { opacity: 0.85 },
                  ]}
                  onPress={() => handleBuyItem(item)}
                  activeOpacity={0.8}
                >
                  {/* Badge de raridade */}
                  <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                    <Text style={styles.rarityText}>{getRarityLabel(item.rarity)}</Text>
                  </View>

                  {/* Emoji do item */}
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>

                  {/* Nome e descrição */}
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemDesc, { color: colors.muted }]} numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* Preço ou "Possuído" */}
                  {owned ? (
                    <View style={[styles.ownedBadge, { backgroundColor: colors.success + "20" }]}>
                      <Text style={[styles.ownedText, { color: colors.success }]}>✅ Possuído</Text>
                    </View>
                  ) : (
                    <View style={[
                      styles.priceBadge,
                      { backgroundColor: canAfford ? colors.primary + "20" : colors.error + "20" },
                    ]}>
                      <Text style={[
                        styles.priceText,
                        { color: canAfford ? colors.primary : colors.error },
                      ]}>
                        💎 {item.cost}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}

      {/* Tab: Comprar Gemas */}
      {activeTab === "gems" && (
        <ScrollView contentContainerStyle={styles.gemsContent}>
          <Text style={[styles.gemsTitle, { color: colors.foreground }]}>
            Recarregue suas Gemas 💎
          </Text>
          <Text style={[styles.gemsSubtitle, { color: colors.muted }]}>
            Use gemas para comprar itens exclusivos para sua Fênix!
          </Text>

          {/* Saldo atual */}
          <View style={[styles.balanceCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
            <Text style={[styles.balanceLabel, { color: colors.muted }]}>Seu saldo atual</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>💎 {state.gems} gemas</Text>
          </View>

          {/* Como ganhar gemas grátis */}
          <View style={[styles.freeGemsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.freeGemsTitle, { color: colors.foreground }]}>Ganhe gemas grátis!</Text>
            <View style={styles.freeGemRow}>
              <Text style={styles.freeGemEmoji}>🏃</Text>
              <Text style={[styles.freeGemText, { color: colors.muted }]}>Complete um dia de corrida → +25 💎</Text>
            </View>
            <View style={styles.freeGemRow}>
              <Text style={styles.freeGemEmoji}>📺</Text>
              <Text style={[styles.freeGemText, { color: colors.muted }]}>Assista um anúncio → +50 💎</Text>
            </View>
          </View>

          {/* Pacotes de gemas */}
          <Text style={[styles.packagesTitle, { color: colors.foreground }]}>Pacotes de Gemas</Text>
          {GEM_PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.gemPackage, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleBuyGems(pkg)}
              activeOpacity={0.8}
            >
              <Text style={styles.gemPackageEmoji}>{pkg.emoji}</Text>
              <View style={styles.gemPackageInfo}>
                <Text style={[styles.gemPackageAmount, { color: colors.foreground }]}>
                  {pkg.gems} Gemas
                  {pkg.bonus ? (
                    <Text style={[styles.gemPackageBonus, { color: colors.success }]}> {pkg.bonus}</Text>
                  ) : null}
                </Text>
                <Text style={[styles.gemPackagePrice, { color: colors.muted }]}>{pkg.price}</Text>
              </View>
              <View style={[styles.buyButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.buyButtonText}>Comprar</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={[styles.iapDisclaimer, { color: colors.muted }]}>
            * Pagamentos processados pela App Store / Google Play.
            Gemas são válidas apenas neste app.
          </Text>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    backButton: { padding: 4 },
    backText: { fontSize: 15, fontWeight: "600" },
    headerTitle: { fontSize: 18, fontWeight: "800" },
    gemsDisplay: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    gemsText: { fontSize: 14, fontWeight: "700" },
    tabRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    tabText: { fontSize: 15, fontWeight: "600" },
    categoryScroll: { maxHeight: 60 },
    categoryContent: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      flexDirection: "row",
    },
    categoryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1.5,
    },
    categoryEmoji: { fontSize: 14 },
    categoryLabel: { fontSize: 12, fontWeight: "600" },
    itemsGrid: {
      padding: 12,
      gap: 12,
    },
    itemCard: {
      flex: 1,
      margin: 4,
      borderRadius: 16,
      padding: 12,
      alignItems: "center",
      borderWidth: 1.5,
      position: "relative",
    },
    rarityBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    rarityText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
    itemEmoji: { fontSize: 40, marginTop: 8, marginBottom: 8 },
    itemName: { fontSize: 13, fontWeight: "700", textAlign: "center", marginBottom: 4 },
    itemDesc: { fontSize: 11, textAlign: "center", lineHeight: 16, marginBottom: 8 },
    ownedBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    ownedText: { fontSize: 11, fontWeight: "700" },
    priceBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    priceText: { fontSize: 13, fontWeight: "700" },
    gemsContent: {
      padding: 20,
      gap: 16,
    },
    gemsTitle: { fontSize: 24, fontWeight: "800", textAlign: "center" },
    gemsSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
    balanceCard: {
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      borderWidth: 1.5,
    },
    balanceLabel: { fontSize: 13, marginBottom: 4 },
    balanceValue: { fontSize: 28, fontWeight: "900" },
    freeGemsCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
    },
    freeGemsTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
    freeGemRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    freeGemEmoji: { fontSize: 20 },
    freeGemText: { fontSize: 14, flex: 1 },
    packagesTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
    gemPackage: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      gap: 12,
    },
    gemPackageEmoji: { fontSize: 28 },
    gemPackageInfo: { flex: 1 },
    gemPackageAmount: { fontSize: 16, fontWeight: "700" },
    gemPackageBonus: { fontSize: 13, fontWeight: "600" },
    gemPackagePrice: { fontSize: 13, marginTop: 2 },
    buyButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
    },
    buyButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
    iapDisclaimer: {
      fontSize: 11,
      textAlign: "center",
      lineHeight: 18,
      marginTop: 8,
    },
  });
}
