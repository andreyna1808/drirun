/**
 * pet.tsx
 * Tela do Pet Fênix do DriRun.
 * Exibe a Fênix virtual com diferentes estados baseados na consistência do usuário.
 * O pet evolui com corridas, fica triste sem elas, morre com 7 dias de inatividade
 * e renasce das cinzas quando o usuário retoma as corridas.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  Alert,
  Modal,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useApp, PetState, calculatePetState, calculateDaysSinceLastRun } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { PetStyles } from "@/styles/tabs/pet.styles";

// ─── Configuração dos estados do pet ─────────────────────────────────────────

interface PetStateConfig {
  emoji: string;
  title: string;
  description: string;
  color: string;
  animation: "float" | "shake" | "pulse" | "spin" | "none";
}

/** Configuração visual para cada estado da Fênix */
const PET_STATES: Record<PetState, PetStateConfig> = {
  egg: {
    emoji: "🥚",
    title: "Ovo Fênix",
    description: "Sua Fênix ainda não nasceu. Complete sua primeira corrida para ela eclodir!",
    color: "#FFD700",
    animation: "pulse",
  },
  hatchling: {
    emoji: "🐣",
    title: "Filhote de Fênix",
    description: "Ela nasceu! Pequena mas cheia de energia. Continue correndo para ela crescer!",
    color: "#FF8C5A",
    animation: "float",
  },
  young: {
    emoji: "🦅",
    title: "Fênix Jovem",
    description: "Suas asas estão crescendo! Ela está ficando mais forte a cada corrida.",
    color: "#FF6B35",
    animation: "float",
  },
  adult: {
    emoji: "🔥",
    title: "Fênix Adulta",
    description: "Poderosa e majestosa! Ela está quase pronta para voar livre.",
    color: "#FFD700",
    animation: "pulse",
  },
  free: {
    emoji: "✨",
    title: "Fênix Livre!",
    description: "INCRÍVEL! Você completou sua meta! Sua Fênix conquistou a liberdade eterna!",
    color: "#FFD700",
    animation: "spin",
  },
  sad: {
    emoji: "😢",
    title: "Fênix Triste",
    description: "Ela sente sua falta... Volte a correr para animá-la!",
    color: "#6B7280",
    animation: "none",
  },
  depressed: {
    emoji: "😞",
    title: "Fênix Deprimida",
    description: "3 dias sem correr... Ela está muito triste. Corra hoje antes que seja tarde!",
    color: "#4B5563",
    animation: "shake",
  },
  dead: {
    emoji: "💀",
    title: "Fênix Falecida",
    description: "A Fênix sucumbiu à tristeza. Mas ela pode renascer das cinzas se você voltar a correr!",
    color: "#374151",
    animation: "none",
  },
  reborn: {
    emoji: "🌟",
    title: "Fênix Renascendo!",
    description: "Das cinzas, ela renasce! Você voltou! Continue assim e ela ficará ainda mais forte!",
    color: "#FF6B35",
    animation: "spin",
  },
};

// ─── Componente da Fênix animada ──────────────────────────────────────────────

function PhoenixDisplay({
  petState,
  petName,
  colors,
}: {
  petState: PetState;
  petName: string;
  colors: any;
}) {
  const config = PET_STATES[petState];
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Configura a animação baseada no estado do pet
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

  // Aplica a transformação correta para cada tipo de animação
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
      {/* Círculo de fundo com cor do estado */}
      <View style={{
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: config.color + "20",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: config.color + "40",
        marginBottom: 16,
      }}>
        <Animated.Text style={[{ fontSize: 80 }, animStyle]}>
          {config.emoji}
        </Animated.Text>
      </View>

      {/* Nome do pet */}
      <Text style={{ fontSize: 22, fontWeight: "800", color: config.color, marginBottom: 4 }}>
        {petName}
      </Text>

      {/* Título do estado */}
      <Text style={{ fontSize: 15, color: "#6B7280", marginBottom: 8 }}>
        {config.title}
      </Text>
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PetScreen() {
  const { state, dispatch, refreshPetState } = useApp();
  const colors = useColors();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(state.pet.name);

  // Atualiza o estado do pet ao abrir a tela
  useEffect(() => {
    refreshPetState();
  }, [refreshPetState]);

  const petConfig = PET_STATES[state.pet.state];

  // Calcula o progresso de evolução (0–100%)
  const evolutionProgress = useMemo(() => {
    const { totalDaysCompleted } = state.pet;
    const { goalDays } = state;
    return Math.min(Math.round((totalDaysCompleted / goalDays) * 100), 100);
  }, [state.pet.totalDaysCompleted, state.goalDays]);

  // Determina o próximo estado de evolução
  const nextEvolution = useMemo(() => {
    const { totalDaysCompleted } = state.pet;
    if (totalDaysCompleted < 1) return { name: "Filhote", daysNeeded: 1 };
    if (totalDaysCompleted < 8) return { name: "Jovem", daysNeeded: 8 };
    if (totalDaysCompleted < 21) return { name: "Adulta", daysNeeded: 21 };
    if (totalDaysCompleted < state.goalDays) return { name: "Livre", daysNeeded: state.goalDays };
    return null;
  }, [state.pet.totalDaysCompleted, state.goalDays]);

  function handleRename() {
    if (!newName.trim()) {
      Alert.alert("Nome inválido", "O nome não pode estar vazio.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "RENAME_PET", payload: newName.trim() });
    setIsRenaming(false);
  }

  const styles = PetStyles(colors);

  // ── Tela de RIP (pet morto) ────────────────────────────────────────────────
  if ((state.pet.state as string) === "dead") {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.ripContainer}>
            {/* Lápide */}
            <Text style={styles.ripEmoji}>🪦</Text>
            <Text style={styles.ripTitle}>R.I.P.</Text>
            <Text style={styles.ripPetName}>{state.pet.name}</Text>
            <View style={styles.ripCard}>
              <Text style={styles.ripReason}>Motivo do falecimento:</Text>
              <Text style={styles.ripText}>
                {state.profile?.name ?? "O dono"} não foi consistente.
              </Text>
              <Text style={styles.ripDays}>
                {state.pet.daysSinceLastRun} dias sem correr
              </Text>
            </View>
            <Text style={styles.ripHope}>
              Mas não tudo está perdido...{"\n"}
              Volte a correr e sua Fênix renascerá das cinzas! 🔥
            </Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cabeçalho ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Meu Pet</Text>
          <TouchableOpacity
            style={styles.renameButton}
            onPress={() => setIsRenaming(true)}
          >
            <Text style={styles.renameButtonText}>✏️ Renomear</Text>
          </TouchableOpacity>
        </View>

        {/* ── Exibição da Fênix ── */}
        <View style={[styles.petCard, { borderColor: petConfig.color + "40" }]}>
          <PhoenixDisplay
            petState={state.pet.state}
            petName={state.pet.name}
            colors={colors}
          />

          {/* Descrição do estado */}
          <Text style={styles.petDescription}>{petConfig.description}</Text>
        </View>

        {/* ── Barra de evolução ── */}
        <View style={styles.evolutionCard}>
          <View style={styles.evolutionHeader}>
            <Text style={styles.evolutionLabel}>Evolução</Text>
            <Text style={styles.evolutionPercent}>{evolutionProgress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${evolutionProgress}%`,
                  backgroundColor: petConfig.color,
                },
              ]}
            />
          </View>
          {nextEvolution && (
            <Text style={styles.evolutionHint}>
              Próxima evolução: {nextEvolution.name} em {nextEvolution.daysNeeded - state.pet.totalDaysCompleted} dias
            </Text>
          )}
        </View>

        {/* ── Estatísticas do pet ── */}
        <View style={styles.statsGrid}>
          <StatCard
            value={String(state.pet.totalDaysCompleted)}
            label="Dias Corridos"
            color={colors.success}
            colors={colors}
          />
          <StatCard
            value={state.pet.daysSinceLastRun === 0 ? "Hoje!" : `${state.pet.daysSinceLastRun}d`}
            label="Última Corrida"
            color={state.pet.daysSinceLastRun === 0 ? colors.success : colors.warning}
            colors={colors}
          />
          <StatCard
            value={`${state.goalDays - state.pet.totalDaysCompleted}`}
            label="Dias Restantes"
            color={colors.primary}
            colors={colors}
          />
        </View>

        {/* ── Aviso de inatividade ── */}
        {state.pet.daysSinceLastRun > 0 && state.pet.state !== "dead" && (
          <View style={[styles.warningCard, {
            backgroundColor: state.pet.daysSinceLastRun >= 3 ? colors.error + "15" : colors.warning + "15",
            borderColor: state.pet.daysSinceLastRun >= 3 ? colors.error + "40" : colors.warning + "40",
          }]}>
            <Text style={styles.warningText}>
              {state.pet.daysSinceLastRun >= 6
                ? `⚠️ URGENTE! ${state.pet.name} vai morrer amanhã se você não correr!`
                : state.pet.daysSinceLastRun >= 3
                ? `😞 ${state.pet.name} está deprimida. ${7 - state.pet.daysSinceLastRun} dias até a morte.`
                : `😢 ${state.pet.name} está triste. Corra hoje para animá-la!`}
            </Text>
          </View>
        )}

        {/* ── Saldo de gemas + botões de Loja e Galeria ── */}
        {/* <View style={styles.shopCard}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={styles.shopTitle}>💎 {state.gems} gemas</Text>
            <Text style={[{ fontSize: 12, color: colors.muted }]}>+25💎 por corrida</Text>
          </View>
          <View style={styles.shopRow}>
            <TouchableOpacity
              style={[styles.shopButton, { backgroundColor: colors.primary }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/shop"); }}
            >
              <Text style={styles.shopButtonText}>🛒 Pet Shop</Text>
              <Text style={[styles.shopPrice, { color: "#FFFFFF99" }]}>Comprar itens</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shopButton, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/pet-gallery"); }}
            >
              <Text style={[styles.shopButtonText, { color: colors.foreground }]}>🎒 Galeria</Text>
              <Text style={[styles.shopPrice, { color: colors.muted }]}>
                {state.pet.ownedItems.length} itens
              </Text>
            </TouchableOpacity>
          </View>
        </View> */}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Modal de renomear ── */}
      <Modal visible={isRenaming} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Renomear Pet</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nome do seu pet"
              placeholderTextColor={colors.muted}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRename}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => { setIsRenaming(false); setNewName(state.pet.name); }}
              >
                <Text style={[styles.modalButtonText, { color: colors.foreground }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleRename}
              >
                <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

// ─── Componente de card de estatística ───────────────────────────────────────

function StatCard({ value, label, color, colors }: {
  value: string;
  label: string;
  color: string;
  colors: any;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

// ─── Utilitário de memo ───────────────────────────────────────────────────────

function useMemo<T>(factory: () => T, deps: any[]): T {
  return React.useMemo(factory, deps);
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

