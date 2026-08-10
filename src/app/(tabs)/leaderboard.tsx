import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { getLeaderboardData } from "../../services/firestore";
import type { Report } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { Trophy, Award, Medal, Crown } from "lucide-react-native";

export default function StudentLeaderboardScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboardData();
      setReports(data);
    } catch (err) {
      console.error("Error loading leaderboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={ZEEPREP_THEME.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Class Standings & Rankings</Text>
        <Text style={styles.headerSubtitle}>
          Top performing students based on diagnostic assessment accuracy
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
      ) : reports.length > 0 ? (
        reports.map((item, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;

          return (
            <View
              key={item.id}
              style={[
                styles.rankCard,
                rank === 1 && styles.rankCard1,
                rank === 2 && styles.rankCard2,
                rank === 3 && styles.rankCard3,
              ]}
            >
              <View style={styles.rankBadge}>
                {rank === 1 ? (
                  <Crown size={20} color="#D97706" />
                ) : rank === 2 ? (
                  <Medal size={20} color="#64748B" />
                ) : rank === 3 ? (
                  <Award size={20} color="#B45309" />
                ) : (
                  <Text style={styles.rankNumber}>#{rank}</Text>
                )}
              </View>

              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.studentName || "Student Competitor"}</Text>
                <Text style={styles.examTitle}>{item.examTitle || "Assessment Attempt"}</Text>
              </View>

              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>{item.percentage}%</Text>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyCard}>
          <Trophy size={40} color={ZEEPREP_THEME.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Rankings Recorded</Text>
          <Text style={styles.emptySub}>
            Complete diagnostic assessments to earn scores and appear on the class leaderboard.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 4,
  },
  rankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  rankCard1: {
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  rankCard2: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  rankCard3: {
    borderColor: "#FED7AA",
    backgroundColor: "#FFF7ED",
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  examTitle: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  scorePill: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
  },
  emptyCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
  },
});
