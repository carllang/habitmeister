const HEATMAP_WEEK_COUNT = 52;
import React, {useRef} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {
  getHabitStats,
  getOverallStats,
  getWeeklyTrend,
} from '../data/habitStats';
import {
  getDateKey,
  Habit,
  isHabitComplete,
  isHabitScheduledOnDate,
} from '../data/habitRepository';

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
      <View style={[styles.overview, isDarkTheme && styles.darkSurface]}>
        <View style={styles.overviewItem}>
          <Text
            style={[styles.overviewLabel, isDarkTheme && styles.darkMutedText]}>
            30-DAY COMPLETION
          </Text>
          <Text style={[styles.overviewValue, {color: actionColor}]}>
            {overall.completionRate}%
          </Text>
        </View>
        <View
          style={[styles.overviewDivider, isDarkTheme && styles.darkDivider]}
        />
        <View style={styles.overviewItem}>
          <Text
            style={[styles.overviewLabel, isDarkTheme && styles.darkMutedText]}>
            BEST STREAK
          </Text>
          <Text style={[styles.overviewValue, {color: actionColor}]}>
            {overall.bestStreak} days
          </Text>
        </View>
      </View>
      <Text style={[styles.sectionTitle, isDarkTheme && styles.darkText]}>
        Weekly rhythm
      </Text>
      <View style={[styles.trendCard, isDarkTheme && styles.darkSurface]}>
        <View style={styles.trendRow}>
          {trend.map((week, index) => {
            const height = Math.max((week.completed / maxTrendValue) * 100, 8);
            return (
              <View key={`${week.label}-${index}`} style={styles.trendColumn}>
                <View
                  style={[styles.barTrack, isDarkTheme && styles.darkTrackBg]}>
                  <View
                    style={[
                      styles.bar,
                      {height: `${height}%`, backgroundColor: actionColor},
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.trendLabel,
                    isDarkTheme && styles.darkMutedText,
                  ]}>
                  {week.label}
                </Text>
                <Text style={[styles.trendCount, {color: actionColor}]}>
                  {week.completed}/{week.scheduled}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.habitDetailsHeader}>
        <Text
          style={[
            styles.sectionTitle,
            styles.habitDetailsTitle,
            isDarkTheme && styles.darkText,
          ]}>
          Habit details
        </Text>
      </View>
      <View style={styles.habitList}>
        {habits.length === 0 ? (
          <Text style={[styles.emptyText, isDarkTheme && styles.darkMutedText]}>
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
                <View style={styles.habitTopRow}>
                  <View
                    style={[styles.colorMark, {backgroundColor: habit.color}]}
                  />
                  <View style={styles.habitCopy}>
                    <Text
                      style={[
                        styles.habitName,
                        isDarkTheme && styles.darkText,
                      ]}>
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
                    <Text
                      style={[
                        styles.statLabel,
                        isDarkTheme && styles.darkMutedText,
                      ]}>
                      current streak
                    </Text>
                  </View>
                </View>
                <HabitHeatmapItem
                  actionColor={actionColor}
                  habit={habit}
                  isDarkTheme={isDarkTheme}
                  today={today}
                />
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

function HabitHeatmapItem({
  actionColor,
  habit,
  isDarkTheme,
  today,
}: {
  actionColor: string;
  habit: Habit;
  isDarkTheme: boolean;
  today: Date;
}): React.JSX.Element {
  const scrollViewRef = useRef<ScrollView>(null);
  const heatmapStart = new Date(today);
  heatmapStart.setHours(0, 0, 0, 0);
  heatmapStart.setDate(today.getDate() - (HEATMAP_WEEK_COUNT * 7 - 1));

  const heatmapWeeks = Array.from(
    {length: HEATMAP_WEEK_COUNT},
    (_weekOffset, weekIndex) =>
      Array.from({length: 7}, (_dayOffset, dayIndex) => {
        const date = new Date(heatmapStart);
        date.setDate(heatmapStart.getDate() + weekIndex * 7 + dayIndex);
        return date;
      }),
  );

  return (
    <ScrollView
      accessibilityLabel={`Year completion heatmap for ${habit.name}`}
      contentContainerStyle={styles.heatmapContent}
      horizontal
      onContentSizeChange={() => {
        scrollViewRef.current?.scrollToEnd({animated: false});
      }}
      ref={scrollViewRef}
      showsHorizontalScrollIndicator={false}
      style={styles.heatmapScroll}>
      <View style={styles.heatmap}>
        {heatmapWeeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.heatmapWeek}>
            {week.map(date => {
              const complete = isHabitComplete(habit, date);
              const scheduled = isHabitScheduledOnDate(habit, date);
              return (
                <View
                  key={getDateKey(date)}
                  style={[
                    styles.heatmapCell,
                    {
                      backgroundColor: getHeatmapColor({
                        actionColor,
                        complete,
                        isDarkTheme,
                        scheduled,
                      }),
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

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

function getHeatmapColor({
  actionColor,
  complete,
  isDarkTheme,
  scheduled,
}: {
  actionColor: string;
  complete: boolean;
  isDarkTheme: boolean;
  scheduled: boolean;
}): string {
  if (complete) {
    return actionColor;
  }
  if (scheduled) {
    return isDarkTheme ? '#3B4543' : '#D8D5C9';
  }
  return isDarkTheme ? '#242B2A' : '#EEEAE2';
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  label: {
    color: '#286B69',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {color: '#202A2A', fontSize: 28, fontWeight: '700', marginTop: 4},
  subtitle: {color: '#778080', fontSize: 14, marginTop: 6},
  backButton: {alignSelf: 'flex-start', marginBottom: 20, paddingVertical: 4},
  backText: {color: '#286B69', fontSize: 14, fontWeight: '700'},
  overview: {
    alignItems: 'center',
    backgroundColor: '#F0E8DC',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewLabel: {
    color: '#778080',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  overviewValue: {
    color: '#286B69',
    fontSize: 25,
    fontWeight: '700',
    marginTop: 6,
  },
  overviewDivider: {backgroundColor: '#E5DED3', height: 42, width: 1},
  sectionTitle: {
    color: '#202A2A',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
  },
  trendCard: {
    backgroundColor: '#F0E8DC',
    borderRadius: 8,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  trendRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: 140,
    justifyContent: 'space-around',
  },
  habitDetailsHeader: {
    borderTopColor: '#E5DED3',
    borderTopWidth: 1,
    marginTop: 28,
    paddingTop: 18,
  },
  habitDetailsTitle: {marginTop: 0},
  habitTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  heatmapScroll: {
    marginTop: 12,
  },
  heatmapContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingRight: 2,
  },
  heatmap: {
    flexDirection: 'row',
    gap: 3,
  },
  heatmapWeek: {flexShrink: 0, gap: 3, width: 11},
  heatmapCell: {
    borderRadius: 2,
    height: 11,
    width: 11,
  },
  trendColumn: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    backgroundColor: '#E5DED3',
    borderRadius: 6,
    height: 96,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 22,
  },
  bar: {
    backgroundColor: '#286B69',
    borderRadius: 6,
    minHeight: 8,
    width: '100%',
  },
  trendLabel: {color: '#778080', fontSize: 11, marginTop: 8},
  trendCount: {color: '#286B69', fontSize: 10, fontWeight: '700', marginTop: 3},
  habitList: {borderTopColor: '#E5DED3', borderTopWidth: 1, marginTop: 14},
  habitRow: {
    alignItems: 'stretch',
    borderBottomColor: '#E5DED3',
    borderBottomWidth: 1,
    flexDirection: 'column',
    paddingVertical: 14,
  },
  pressed: {opacity: 0.65},
  colorMark: {borderRadius: 5, height: 10, width: 10},
  habitCopy: {flex: 1, marginLeft: 12},
  habitName: {color: '#202A2A', fontSize: 15, fontWeight: '600'},
  habitDetail: {color: '#778080', fontSize: 12, marginTop: 3},
  habitStats: {alignItems: 'flex-end'},
  statValue: {color: '#286B69', fontSize: 18, fontWeight: '700'},
  statLabel: {color: '#778080', fontSize: 9, marginTop: 2},
  emptyText: {color: '#778080', fontSize: 13, paddingVertical: 18},
  detailOverview: {
    alignItems: 'center',
    backgroundColor: '#F0E8DC',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
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
  darkTrackBg: {backgroundColor: '#263130'},
});
