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
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { SHOP_ITEMS, getRarityColor, getRarityLabel, type ShopCategory } from "@/lib/shopItems";
import { ScreenContainer } from "@/components/screen-container";
import { PetGalleryStyles } from "@/styles/tabs/pet-gallery.styles";

// Categorias para filtro
const CATEGORIES: { key: ShopCategory | "all"; label: string; emoji: string }[] = [
  { key: "all", label: "gallery_category_all", emoji: "🎒" },
  { key: "outfit", label: "gallery_category_outfit", emoji: "👕" },
  { key: "accessory", label: "gallery_category_accessory", emoji: "👑" },
  { key: "background", label: "gallery_category_background", emoji: "🖼️" },
  { key: "furniture", label: "gallery_category_furniture", emoji: "🛋️" },
  { key: "color", label: "gallery_category_color", emoji: "🎨" },
];

export default function PetGalleryScreen() {
  const { t } = useTranslation();
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

  const styles = PetGalleryStyles(colors);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← {t("gallery_back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>🎒 {t("gallery_title")}</Text>
        <TouchableOpacity
          style={[styles.shopButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/pet/shop")}
        >
          <Text style={styles.shopButtonText}>🛒 {t("gallery_shop_button")}</Text>
        </TouchableOpacity>
      </View>

      {/* Resumo dos itens equipados */}
      <View style={[styles.equippedSummary, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.equippedTitle, { color: colors.foreground }]}>
          {t("gallery_equipped_title")}
        </Text>
        <View style={styles.equippedRow}>
          {state.pet.ownedItems.filter((i) => i.equipped).length === 0 ? (
            <Text style={[styles.noEquipped, { color: colors.muted }]}>
              {t("gallery_no_equipped")}
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
              {t(cat.label)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Lista de itens possuídos */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {t("gallery_empty_title")}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            {t("gallery_empty_subtitle")}
          </Text>
          <TouchableOpacity
            style={[styles.goToShopButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/pet/shop")}
          >
            <Text style={styles.goToShopText}>🛒 {t("gallery_go_to_shop")}</Text>
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
                    {equipped ? t("gallery_equipped_badge") : t("gallery_equip_badge")}
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