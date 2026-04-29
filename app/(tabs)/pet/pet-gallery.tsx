/**
 * pet-gallery.tsx
 * Galeria do Pet — exibe os itens possuídos pelo usuário e permite equipar/remover.
 * Acessível a partir da aba Pet.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { SHOP_ITEMS, getRarityColor, getRarityLabel, type ShopCategory } from "@/lib/shopItems";
import { ScreenContainer } from "@/components/screen-container";

// Categorias para filtro
const CATEGORIES: { key: ShopCategory | "all"; label: string; emoji: string }[] = [
  { key: "all",        label: "Todos",      emoji: "🎒" },
  { key: "outfit",     label: "Roupas",     emoji: "👕" },
  { key: "accessory",  label: "Acessórios", emoji: "👑" },
  { key: "background", label: "Fundos",     emoji: "🖼️" },
  { key: "furniture",  label: "Mobília",    emoji: "🛋️" },
  { key: "color",      label: "Cores",      emoji: "🎨" },
];

export default function PetGalleryScreen() {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | "all">("all");

  // Itens que o usuário possui
  const ownedItemIds = state.pet.ownedItems.map((i) => i.id);
  const ownedShopItems = SHOP_ITEMS.filter((item) => ownedItemIds.includes(item.id));

  // Filtra por categoria
  const filteredItems = selectedCategory === "all"
    ? ownedShopItems
    : ownedShopItems.filter((item) => item.category === selectedCategory);

  /** Verifica se um item está equipado */
  function isEquipped(itemId: string): boolean {
    return state.pet.ownedItems.find((i) => i.id === itemId)?.equipped ?? false;
  }

  /** Equipa ou desequipa um item */
  function handleToggleEquip(itemId: string) {
    const equipped = isEquipped(itemId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: "EQUIP_SHOP_ITEM", payload: { itemId, equip: !equipped } });
  }

  const styles = createStyles(colors);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>🎒 Minha Galeria</Text>
        <TouchableOpacity
          style={[styles.shopButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/shop")}
        >
          <Text style={styles.shopButtonText}>🛒 Loja</Text>
        </TouchableOpacity>
      </View>

      {/* Resumo dos itens equipados */}
      <View style={[styles.equippedSummary, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.equippedTitle, { color: colors.foreground }]}>
          Itens Equipados na Fênix:
        </Text>
        <View style={styles.equippedRow}>
          {state.pet.ownedItems.filter((i) => i.equipped).length === 0 ? (
            <Text style={[styles.noEquipped, { color: colors.muted }]}>
              Nenhum item equipado. Toque em um item para equipar!
            </Text>
          ) : (
            state.pet.ownedItems
              .filter((i) => i.equipped)
              .map((i) => {
                const shopItem = SHOP_ITEMS.find((s) => s.id === i.id);
                return shopItem ? (
                  <View key={i.id} style={[styles.equippedBadge, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={styles.equippedBadgeEmoji}>{shopItem.emoji}</Text>
                  </View>
                ) : null;
              })
          )}
        </View>
      </View>

      {/* Filtro de categorias */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(cat) => cat.key}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
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
        )}
      />

      {/* Lista de itens possuídos */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Nenhum item aqui ainda!
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Visite a loja para comprar itens para sua Fênix.
          </Text>
          <TouchableOpacity
            style={[styles.goToShopButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/shop")}
          >
            <Text style={styles.goToShopText}>Ir para a Loja 🛒</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.itemsGrid}
          renderItem={({ item }) => {
            const equipped = isEquipped(item.id);
            const rarityColor = getRarityColor(item.rarity);
            return (
              <TouchableOpacity
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.surface, borderColor: equipped ? colors.primary : colors.border },
                  equipped && { borderWidth: 2 },
                ]}
                onPress={() => handleToggleEquip(item.id)}
                activeOpacity={0.8}
              >
                {/* Badge de raridade */}
                <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                  <Text style={styles.rarityText}>{getRarityLabel(item.rarity)}</Text>
                </View>

                {/* Indicador de equipado */}
                {equipped && (
                  <View style={[styles.equippedIndicator, { backgroundColor: colors.primary }]}>
                    <Text style={styles.equippedIndicatorText}>✓</Text>
                  </View>
                )}

                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>

                <View style={[
                  styles.actionBadge,
                  { backgroundColor: equipped ? colors.primary : colors.surface, borderColor: equipped ? colors.primary : colors.border },
                ]}>
                  <Text style={[styles.actionText, { color: equipped ? "#FFFFFF" : colors.muted }]}>
                    {equipped ? "✓ Equipado" : "Equipar"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
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
    shopButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    shopButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
    equippedSummary: {
      padding: 12,
      borderBottomWidth: 1,
    },
    equippedTitle: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
    equippedRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    equippedBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    equippedBadgeEmoji: { fontSize: 22 },
    noEquipped: { fontSize: 13, fontStyle: "italic" },
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
    itemsGrid: { padding: 12, gap: 12 },
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
    equippedIndicator: {
      position: "absolute",
      top: 8,
      left: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    equippedIndicatorText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
    itemEmoji: { fontSize: 40, marginTop: 8, marginBottom: 8 },
    itemName: { fontSize: 13, fontWeight: "700", textAlign: "center", marginBottom: 8 },
    actionBadge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
    },
    actionText: { fontSize: 12, fontWeight: "700" },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 12,
    },
    emptyEmoji: { fontSize: 64 },
    emptyTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
    emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
    goToShopButton: {
      marginTop: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 16,
    },
    goToShopText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  });
}
