import {
    Text,
} from "react-native";

export const SectionHeader = ({ title, colors }: { title: string; colors: any }) => {
    return (
        <Text style={{
            fontSize: 12,
            fontWeight: "700",
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginTop: 20,
            marginBottom: 8,
            marginLeft: 4,
        }}>
            {title}
        </Text>
    );
}