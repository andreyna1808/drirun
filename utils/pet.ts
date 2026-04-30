import { PetState } from "@/context/AppContext";
import { IPetStateConfig } from "@/interfaces/pet/pet";
import { ShopCategory } from "@/lib/shopItems";

export const CATEGORIES: { key: ShopCategory | "all"; label: string; emoji: string }[] = [
    { key: "all", label: "gallery_category_all", emoji: "🎒" },
    { key: "outfit", label: "gallery_category_outfit", emoji: "👕" },
    { key: "accessory", label: "gallery_category_accessory", emoji: "👑" },
    { key: "background", label: "gallery_category_background", emoji: "🖼️" },
    { key: "furniture", label: "gallery_category_furniture", emoji: "🛋️" },
    { key: "color", label: "gallery_category_color", emoji: "🎨" },
];

export const PET_STATES: Record<PetState, IPetStateConfig> = {
    egg: {
        emoji: "🥚",
        title: "pet_state_egg_title",
        description: "pet_state_egg_description",
        color: "#FFD700",
        animation: "pulse",
    },
    hatchling: {
        emoji: "🐣",
        title: "pet_state_hatchling_title",
        description: "pet_state_hatchling_description",
        color: "#FF8C5A",
        animation: "float",
    },
    young: {
        emoji: "🦅",
        title: "pet_state_young_title",
        description: "pet_state_young_description",
        color: "#FF6B35",
        animation: "float",
    },
    adult: {
        emoji: "🔥",
        title: "pet_state_adult_title",
        description: "pet_state_adult_description",
        color: "#FFD700",
        animation: "pulse",
    },
    free: {
        emoji: "✨",
        title: "pet_state_free_title",
        description: "pet_state_free_description",
        color: "#FFD700",
        animation: "spin",
    },
    sad: {
        emoji: "😢",
        title: "pet_state_sad_title",
        description: "pet_state_sad_description",
        color: "#6B7280",
        animation: "none",
    },
    depressed: {
        emoji: "😞",
        title: "pet_state_depressed_title",
        description: "pet_state_depressed_description",
        color: "#4B5563",
        animation: "shake",
    },
    dead: {
        emoji: "💀",
        title: "pet_state_dead_title",
        description: "pet_state_dead_description",
        color: "#374151",
        animation: "none",
    },
    reborn: {
        emoji: "🌟",
        title: "pet_state_reborn_title",
        description: "pet_state_reborn_description",
        color: "#FF6B35",
        animation: "spin",
    },
};

export const GEM_PACKAGES = [
    { id: "gems_50", gems: 50, price: "R$ 10,00", emoji: "💎", bonus: "" },
    { id: "gems_150", gems: 150, price: "R$ 25,00", emoji: "💎💎", bonus: "+10%" },
    { id: "gems_250", gems: 250, price: "R$ 40,00", emoji: "💎💎💎", bonus: "+20%" },
    { id: "gems_500", gems: 500, price: "R$ 70,00", emoji: "💎💎💎💎", bonus: "+30%" },
];
