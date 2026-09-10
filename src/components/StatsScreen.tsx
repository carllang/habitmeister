import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {
  getHabitStats,
  getOverallStats,
  getWeeklyTrend,
} from '../data/habitStats';
import {getDateKey, Habit, isHabitComplete} from '../data/habitRepository';

type StatsScreenProps = {
  actionColor: string;
  habits: Habit[];
  isDarkTheme: boolean;
  onBack?: () => void;
  onHabitPress?: (habit: Habit) => void;
  selectedHabitId?: number | null;
  today: Date;
};

export function StatsScreen({
  habits,
  isDarkTheme,
  onBack,
  onHabitPress,
  selectedHabitId,
  today,
  actionColor,
}: StatsScreenProps): React.JSX.Element {
  if (selectedHabitId !== undefined && selectedHabitId !== null) {
    const selectedHabit = habits.find(habit => habit.id === selectedHabitId);
    if (selectedHabit) {
      return (
        <HabitStatsDetail
          habit={selectedHabit}
          isDarkTheme={isDarkTheme}
          onBack={onBack ?? (() => undefined)}
          today={today}
          actionColor={actionColor}
        />
      );
    }
  }
  const overall = getOverallStats(habits, today);
  const trend = getWeeklyTrend(habits, today);
  const maxTrendValue = Math.max(...trend.map(week => week.scheduled), 1);

  return (
    <View style={styles.screen}>
      <Text style={[styles.label, {color: actionColor}]}>PROGRESS</Text>
      <Text style={[styles.title, isDarkTheme && styles.darkText]}>
        Your momentum
      </Text>
      <View style={styles.overview}>
        <View>
          <Text style={styles.overviewLabel}>30-DAY COMPLETION</Text>
          <Text style={[styles.overviewValue, {color: actionColor}]}>
            {overall.completionRate}%
          </Text>
        </View>
        <View style={styles.overviewDivider} />
        <View>
          <Text style={styles.overviewLabel}>BEST STREAK</Text>
          <Text style={[styles.overviewValue, {color: actionColor}]}>
            {overall.bestStreak} days
          </Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Weekly rhythm</Text>
      <View style={styles.trendRow}>
        {trend.map((week, index) => {
          const height = Math.max((week.completed / maxTrendValue) * 100, 6);
          return (
            <View key={`${week.label}-${index}`} style={styles.trendColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {height: `${height}%`, backgroundColor: actionColor},
                  ]}
                />
              </View>
              <Text style={styles.trendLabel}>{week.label}</Text>
              <Text style={[styles.trendCount, {color: actionColor}]}>
                {week.completed}/{week.scheduled}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.sectionTitle}>Habit details</Text>
      <View style={styles.habitList}>
        {habits.length === 0 ? (
          <Text style={styles.emptyText}>
            Add a habit to start seeing progress.
          </Text>
        ) : (
          habits.map(habit => {
            const stats = getHabitStats(habit, today);
            return (
              <Pressable
                accessibilityLabel={`View statistics for ${habit.name}`}
                accessibilityRole="button"
                key={habit.id}
                onPress={() => onHabitPress?.(habit)}
                style={({pressed}) => [
                  styles.habitRow,
                  pressed && styles.pressed,
                ]}>
                <View
                  style={[styles.colorMark, {backgroundColor: habit.color}]}
                />
                <View style={styles.habitCopy}>
                  <Text
                    style={[styles.habitName, isDarkTheme && styles.darkText]}>
                    {habit.name}
                  </Text>
                  <Text
                    style={[
                      styles.habitDetail,
                      isDarkTheme && styles.darkMutedText,
                    ]}>
                    {stats.completionRate}% of scheduled days
                  </Text>
                </View>
                <View style={styles.habitStats}>
                  <Text style={[styles.statValue, {color: actionColor}]}>
                    {stats.currentStreak}
                  </Text>
                  <Text style={styles.statLabel}>current streak</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

type HabitStatsDetailProps = {
  actionColor: string;
  habit: Habit;
  isDarkTheme: boolean;
  onBack: () => void;
  today: Date;
};

function HabitStatsDetail({
  actionColor,
  habit,
  isDarkTheme,
  onBack,
  today,
}: HabitStatsDetailProps): React.JSX.Element {
  const stats = getHabitStats(habit, today);
  const dates = Array.from({length: 30}, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    return date;
  });

  return (
    <View style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={styles.backButton}>
        <Text style={[styles.backText, {color: actionColor}]}>‹ Stats</Text>
      </Pressable>
      <Text style={[styles.label, {color: actionColor}]}>HABIT DETAIL</Text>
      <Text style={[styles.title, isDarkTheme && styles.darkText]}>
        {habit.name}
      </Text>
      <Text style={[styles.subtitle, isDarkTheme && styles.darkMutedText]}>
        {habit.detail}
      </Text>
      <View style={[styles.detailOverview, isDarkTheme && styles.darkSurface]}>
        <View>
          <Text
            style={[styles.overviewLabel, isDarkTheme && styles.darkMutedText]}>
            30-DAY RATE
          </Text>
          <Text style={[styles.overviewValue, {color: actionColor}]}>
            {stats.completionRate}%
          </Text>
        </View>
        <View
          style={[styles.overviewDivider, isDarkTheme && styles.darkDivider]}
        />
        <View>
          <Text
            style={[styles.overviewLabel, isDarkTheme && styles.darkMutedText]}>
            CURRENT STREAK
          </Text>
          <Text style={[styles.overviewValue, {color: actionColor}]}>
            {stats.currentStreak} days
          </Text>
        </View>
      </View>
      <Text style={[styles.sectionTitle, isDarkTheme && styles.darkText]}>
        Last 30 days
      </Text>
      <View style={[styles.dateGrid, isDarkTheme && styles.darkBorder]}>
        {dates.map(date => {
          const completed = isHabitComplete(habit, date);
          return (
            <View key={getDateKey(date)} style={styles.dateCell}>
              <View
                style={[
                  styles.dateDot,
                  completed && {backgroundColor: actionColor},
                ]}
              />
              <Text
                style={[styles.dateLabel, isDarkTheme && styles.darkMutedText]}>
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={[styles.detailFooter, isDarkTheme && styles.darkBorder]}>
        <Text style={[styles.footerLabel, isDarkTheme && styles.darkMutedText]}>
          BEST STREAK
        </Text>
        <Text style={[styles.footerValue, isDarkTheme && styles.darkText]}>
          {stats.bestStreak} days
        </Text>
        <Text style={[styles.footerLabel, isDarkTheme && styles.darkMutedText]}>
          SCHEDULED COMPLETIONS
        </Text>
        <Text style={[styles.footerValue, isDarkTheme && styles.darkText]}>
          {stats.completedScheduledDays} of {stats.scheduledDays} days
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  label: {
    color: '#286B69',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {color: '#202A2A', fontSize: 28, fontWeight: '700', marginTop: 7},
  subtitle: {color: '#778080', fontSize: 14, marginTop: 6},
  backButton: {alignSelf: 'flex-start', marginBottom: 24, paddingVertical: 4},
  backText: {color: '#286B69', fontSize: 14, fontWeight: '700'},
  overview: {
    alignItems: 'center',
    backgroundColor: '#F0E8DC',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    padding: 18,
  },
  overviewLabel: {color: '#778080', fontSize: 10, fontWeight: '700'},
  overviewValue: {
    color: '#286B69',
    fontSize: 25,
    fontWeight: '700',
    marginTop: 7,
  },
  overviewDivider: {backgroundColor: '#E5DED3', height: 42, width: 1},
  sectionTitle: {
    color: '#202A2A',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
  },
  trendRow: {
    alignItems: 'flex-end',
    borderBottomColor: '#E5DED3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 150,
    justifyContent: 'space-around',
    marginTop: 14,
    paddingHorizontal: 12,
  },
  trendColumn: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    backgroundColor: '#E5DED3',
    borderRadius: 5,
    height: 105,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 24,
  },
  bar: {
    backgroundColor: '#286B69',
    borderRadius: 5,
    minHeight: 6,
    width: '100%',
  },
  trendLabel: {color: '#778080', fontSize: 11, marginTop: 8},
  trendCount: {color: '#286B69', fontSize: 10, fontWeight: '700', marginTop: 3},
  habitList: {borderTopColor: '#E5DED3', borderTopWidth: 1, marginTop: 14},
  habitRow: {
    alignItems: 'center',
    borderBottomColor: '#E5DED3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 68,
  },
  pressed: {opacity: 0.65},
  colorMark: {borderRadius: 5, height: 10, width: 10},
  habitCopy: {flex: 1, marginLeft: 12},
  habitName: {color: '#202A2A', fontSize: 14, fontWeight: '600'},
  habitDetail: {color: '#778080', fontSize: 11, marginTop: 4},
  habitStats: {alignItems: 'flex-end'},
  statValue: {color: '#286B69', fontSize: 18, fontWeight: '700'},
  statLabel: {color: '#778080', fontSize: 9, marginTop: 2},
  emptyText: {color: '#778080', fontSize: 13, paddingVertical: 18},
  detailOverview: {
    alignItems: 'center',
    backgroundColor: '#F0E8DC',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    padding: 18,
  },
  dateGrid: {
    borderTopColor: '#E5DED3',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
  },
  dateCell: {alignItems: 'center', marginBottom: 12, width: '13%'},
  dateDot: {backgroundColor: '#D8D5C9', borderRadius: 5, height: 10, width: 10},
  dateDotComplete: {backgroundColor: '#286B69'},
  dateLabel: {color: '#778080', fontSize: 9, marginTop: 4},
  detailFooter: {
    borderTopColor: '#E5DED3',
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 16,
  },
  footerLabel: {
    color: '#778080',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 8,
  },
  footerValue: {
    color: '#202A2A',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  darkText: {color: '#F5F7F6'},
  darkMutedText: {color: '#B7C1BE'},
  darkSurface: {backgroundColor: '#1A2221'},
  darkDivider: {backgroundColor: '#3B4543'},
  darkBorder: {borderTopColor: '#35403E'},
});
