import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";

export default function EditProfileScreen() {
    const { state, dispatch } = useApp();
    const colors = useColors();

    const [name, setName] = useState(state.profile?.name ?? "");
    const [age, setAge] = useState(String(state.profile?.age ?? ""));
    const [height, setHeight] = useState(String(state.profile?.height ?? ""));
    const [weight, setWeight] = useState(String(state.profile?.weight ?? ""));
    const [sex, setSex] = useState<"male" | "female" | "other">(state.profile?.sex ?? "other");

    const styles = createStyles(colors);

    const handleSave = () => {
        const ageNum = parseInt(age, 10);
        const heightNum = parseFloat(height);
        const weightNum = parseFloat(weight);

        if (!name.trim()) { Alert.alert("Nome obrigatório"); return; }
        if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) { Alert.alert("Idade inválida (5-120)"); return; }
        if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) { Alert.alert("Altura inválida (100-250 cm)"); return; }
        if (isNaN(weightNum) || weightNum < 20 || weightNum > 300) { Alert.alert("Peso inválido (20-300 kg)"); return; }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        dispatch({
            type: "UPDATE_PROFILE",
            payload: {
                name: name.trim(),
                age: ageNum,
                height: heightNum,
                weight: weightNum,
                sex,
            },
        });
        Alert.alert("Perfil atualizado!", "", [{ text: "OK", onPress: () => router.back() }]);
    };

    return (
        <ScreenContainer>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Editar Perfil</Text>

                <Text style={styles.label}>Nome</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={colors.muted} />

                <Text style={styles.label}>Sexo</Text>
                <View style={styles.sexRow}>
                    {(["male", "female", "other"] as const).map((s) => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.sexBtn, sex === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                            onPress={() => setSex(s)}
                        >
                            <Text style={[styles.sexText, sex === s && { color: "#FFF" }]}>
                                {s === "male" ? "Masculino" : s === "female" ? "Feminino" : "Outro"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Idade</Text>
                <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="Idade" />

                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="Altura em cm" />

                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="Peso em kg" />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveText}>Salvar Alterações</Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenContainer>
    );
}

function createStyles(colors: any) {
    return StyleSheet.create({
        content: { padding: 20 },
        title: { fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 24 },
        label: { color: colors.muted, marginBottom: 6, fontSize: 13, fontWeight: "600", marginTop: 12 },
        input: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 14,
            fontSize: 16,
            color: colors.foreground,
        },
        sexRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
        sexBtn: {
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: "center",
        },
        sexText: { fontSize: 14, fontWeight: "600", color: colors.foreground },
        saveBtn: {
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginTop: 32,
        },
        saveText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
    });
}