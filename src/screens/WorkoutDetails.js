import { useEffect, useRef, useState } from 'react';
import DragList from 'react-native-draglist';
import {
  Animated,
  FlatList,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const CATEGORY_COLORS = {
  chest: '#f97316',
  back: '#0ea5e9',
  shoulders: '#8b5cf6',
  bicep: '#22c55e',
  tricep: '#ef4444',
  legs: '#f59e0b',
};

const CATEGORY_LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  bicep: 'Bicep',
  tricep: 'Tricep',
  legs: 'Legs',
};

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'bicep', label: 'Bicep' },
  { value: 'tricep', label: 'Tricep' },
  { value: 'legs', label: 'Legs' },
];

function normalizeCategory(category) {
  if (!category) {
    return '';
  }

  const normalized = category.toLowerCase();
  if (normalized === 'biceps') {
    return 'bicep';
  }
  if (normalized === 'triceps') {
    return 'tricep';
  }
  return normalized;
}

function getCategoryDisplay(category) {
  if (!category) {
    return { label: 'Uncategorized', color: '#6b7280' };
  }

  const normalized = normalizeCategory(category);
  return {
    label: CATEGORY_LABELS[normalized] ?? category,
    color: CATEGORY_COLORS[normalized] ?? '#6b7280',
  };
}

export default function WorkoutDetails({
  navigation,
  route,
  workouts,
  availableExercises,
  onAddExerciseToWorkout,
  onDeleteExercise,
  onReorderWorkoutExercises,
  onUpdateWeightExercise,
}) {
  const { workoutId, title } = route.params;
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [draggingOption, setDraggingOption] = useState(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);

  const draggingOptionRef = useRef(null);
  const dropZoneActiveRef = useRef(false);
  const dragIndicatorPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragIndicatorSizeRef = useRef({ width: 260, height: 40 });

  const lastDragPointRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const containerBoundsRef = useRef({ x: 0, y: 0 });
  const workoutListZoneRef = useRef(null);
  const workoutListBoundsRef = useRef(null);
  const dropTargetZoneRef = useRef(null);
  const dropTargetBoundsRef = useRef(null);

  const workout = workouts.find((item) => item.id === workoutId);
  const exercises = workout?.exercises ?? [];

  const sortedExerciseOptions = [...availableExercises].sort((a, b) => {
    const aCategory = normalizeCategory(a.category);
    const bCategory = normalizeCategory(b.category);

    if (aCategory !== bCategory) {
      return aCategory.localeCompare(bCategory);
    }

    return a.name.localeCompare(b.name);
  });

  const filteredExerciseOptions = sortedExerciseOptions.filter((exercise) => {
    const normalizedCategory = normalizeCategory(exercise.category);
    const categoryPass =
      selectedCategory === 'all' || normalizedCategory === selectedCategory;
    const queryPass = exercise.name
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());

    return categoryPass && queryPass;
  });

  const selectedExercise = availableExercises.find(
    (exercise) => exercise.id === selectedExerciseId
  );

  const measureWorkoutListZone = () => {
    if (containerRef.current) {
      containerRef.current.measureInWindow((x, y) => {
        containerBoundsRef.current = { x, y };
      });
    }

    if (!workoutListZoneRef.current) {
      return;
    }

    workoutListZoneRef.current.measureInWindow((x, y, width, height) => {
      workoutListBoundsRef.current = { x, y, width, height };
    });

    if (dropTargetZoneRef.current) {
      dropTargetZoneRef.current.measureInWindow((x, y, width, height) => {
        dropTargetBoundsRef.current = { x, y, width, height };
      });
    }
  };

  const isPointInsideDropTarget = (point, zone) => {
    if (!zone) {
      return false;
    }

    const padding = 18;
    return (
      point.x >= zone.x - padding &&
      point.x <= zone.x + zone.width + padding &&
      point.y >= zone.y - padding &&
      point.y <= zone.y + zone.height + padding
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      measureWorkoutListZone();
    }, 0);

    return () => clearTimeout(timer);
  }, [exercises.length, filteredExerciseOptions.length]);

  const toLocalIndicatorPosition = (point) => ({
    x:
      point.x -
      containerBoundsRef.current.x -
      dragIndicatorSizeRef.current.width / 2,
    y:
      point.y -
      containerBoundsRef.current.y -
      dragIndicatorSizeRef.current.height / 2,
  });

  const finishOptionDrag = () => {
    const draggedExercise = draggingOptionRef.current;
    if (!draggedExercise) {
      return;
    }

    const releasePoint = lastDragPointRef.current;
    const droppedInTargetRow = isPointInsideDropTarget(
      releasePoint,
      dropTargetBoundsRef.current
    );
    const droppedInWorkoutList = isPointInsideDropTarget(
      releasePoint,
      workoutListBoundsRef.current
    );

    if (droppedInTargetRow || droppedInWorkoutList || dropZoneActiveRef.current) {
      onAddExerciseToWorkout(workoutId, draggedExercise.id);
    }

    draggingOptionRef.current = null;
    setDraggingOption(null);
    dropZoneActiveRef.current = false;
    setDropZoneActive(false);
  };

  const startOptionDrag = (item, startPoint) => {
    measureWorkoutListZone();

    draggingOptionRef.current = item;
    setDraggingOption(item);
    lastDragPointRef.current = startPoint;

    const localPosition = toLocalIndicatorPosition(startPoint);
    dragIndicatorPosition.setValue(localPosition);

    const isActive = isPointInsideDropTarget(startPoint, dropTargetBoundsRef.current);
    dropZoneActiveRef.current = isActive;
    setDropZoneActive(isActive);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => Boolean(draggingOptionRef.current),
      onMoveShouldSetPanResponder: () => Boolean(draggingOptionRef.current),
      onMoveShouldSetPanResponderCapture: () => Boolean(draggingOptionRef.current),
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (event) => {
        if (!draggingOptionRef.current) {
          return;
        }

        const point = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
        };

        lastDragPointRef.current = point;
        dragIndicatorPosition.setValue(toLocalIndicatorPosition(point));

        const isActive = isPointInsideDropTarget(point, dropTargetBoundsRef.current);
        if (isActive !== dropZoneActiveRef.current) {
          dropZoneActiveRef.current = isActive;
          setDropZoneActive(isActive);
        }
      },
      onPanResponderRelease: () => {
        if (draggingOptionRef.current) {
          finishOptionDrag();
        }
      },
      onPanResponderTerminate: () => {
        if (draggingOptionRef.current) {
          finishOptionDrag();
        }
      },
    })
  ).current;

  const handleAddExercise = () => {
    onAddExerciseToWorkout(workoutId, selectedExerciseId);
    setSelectedExerciseId('');
  };

  return (
    <SafeAreaView
      ref={containerRef}
      style={styles.container}
      onLayout={measureWorkoutListZone}
      {...panResponder.panHandlers}
    >
      <Text style={styles.title}>{title}</Text>

      {!workout ? (
        <Text style={styles.emptyText}>This workout no longer exists.</Text>
      ) : (
        <>
          <View style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>Add Exercise To Workout</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFiltersRow}
            >
              {CATEGORY_FILTERS.map((categoryFilter) => {
                const isActive = selectedCategory === categoryFilter.value;
                return (
                  <Pressable
                    key={categoryFilter.value}
                    style={[
                      styles.categoryFilterChip,
                      isActive && styles.categoryFilterChipActive,
                    ]}
                    onPress={() => setSelectedCategory(categoryFilter.value)}
                  >
                    <Text
                      style={[
                        styles.categoryFilterText,
                        isActive && styles.categoryFilterTextActive,
                      ]}
                    >
                      {categoryFilter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.optionsList}>
              <FlatList
                data={filteredExerciseOptions}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const categoryMeta = getCategoryDisplay(item.category);
                  const isSelected = selectedExerciseId === item.id;
                  const isDraggingThisOption = draggingOption?.id === item.id;

                  return (
                    <Pressable
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                        isDraggingThisOption && styles.optionRowDraggingSource,
                      ]}
                      delayLongPress={180}
                      onPress={() => setSelectedExerciseId(item.id)}
                      onLongPress={(event) => {
                        const startPoint = {
                          x: event.nativeEvent.pageX,
                          y: event.nativeEvent.pageY,
                        };

                        startOptionDrag(item, startPoint);
                      }}
                    >
                      <Text style={styles.optionName}>{item.name}</Text>
                      <View
                        style={[
                          styles.categoryPill,
                          { backgroundColor: categoryMeta.color },
                        ]}
                      >
                        <Text style={styles.categoryPillText}>{categoryMeta.label}</Text>
                      </View>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <Text style={styles.emptySelectorText}>No matching exercises.</Text>
                }
              />
            </View>

            <Text style={styles.dragHintText}>
              Tip: Long press an option and drag it into the workout list.
            </Text>

            <Text style={styles.selectedLabel}>
              Selected: {selectedExercise ? selectedExercise.name : 'None'}
            </Text>

            <Pressable
              style={[styles.addButton, !selectedExerciseId && styles.addButtonDisabled]}
              onPress={handleAddExercise}
              disabled={!selectedExerciseId}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          {availableExercises.length === 0 ? (
            <Text style={styles.helperText}>
              Add exercises in the Exercises tab first.
            </Text>
          ) : null}

          <View
            ref={workoutListZoneRef}
            collapsable={false}
            onLayout={measureWorkoutListZone}
            style={[
              styles.workoutListZone,
              dropZoneActive && styles.workoutListZoneActive,
            ]}
          >
            <View
              ref={dropTargetZoneRef}
              collapsable={false}
              onLayout={measureWorkoutListZone}
              style={[
                styles.dropTargetRow,
                dropZoneActive && styles.dropTargetRowActive,
              ]}
            >
              <Text
                style={[
                  styles.dropTargetText,
                  dropZoneActive && styles.dropTargetTextActive,
                ]}
              >
                Drop here to add exercise
              </Text>
            </View>
            <DragList
              data={exercises}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onReordered={async (fromIndex, toIndex) => {
                const reordered = [...exercises];
                const moved = reordered.splice(fromIndex, 1)[0];
                reordered.splice(toIndex, 0, moved);
                onReorderWorkoutExercises(workoutId, reordered);
              }}
              renderItem={({ item, onDragStart, onDragEnd, isActive }) => {
                const linkedExercise = availableExercises.find(
                  (exercise) => exercise.id === item.exerciseId
                );
                const categoryMeta = getCategoryDisplay(
                  linkedExercise?.category ?? item.category
                );

                return (
                  <View style={[styles.itemRow, isActive && styles.itemRowActive]}>
                    <View style={styles.itemTopRow}>
                      <Pressable
                        style={styles.itemInfoRow}
                        onPress={() => {
                          if (!item.exerciseId) {
                            return;
                          }

                          navigation.navigate('ExerciseDetails', {
                            exerciseId: item.exerciseId,
                            title: item.name,
                          });
                        }}
                      >
                        <Text style={styles.itemText}>{item.name}</Text>
                        <View
                          style={[
                            styles.categoryPill,
                            { backgroundColor: categoryMeta.color },
                          ]}
                        >
                          <Text style={styles.categoryPillText}>{categoryMeta.label}</Text>
                        </View>
                      </Pressable>
                      <Pressable
                        style={styles.reorderHandle}
                        onPressIn={onDragStart}
                        onPressOut={onDragEnd}
                      >
                        <Text style={styles.reorderHandleText}>Drag</Text>
                      </Pressable>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => onDeleteExercise(workoutId, item.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                    <View style={styles.metricsRow}>
                      <TextInput
                        style={styles.metricInput}
                        placeholder="sets"
                        keyboardType="numeric"
                        value={linkedExercise?.sets ?? ''}
                        onChangeText={(value) => {
                          if (!item.exerciseId) {
                            return;
                          }
                          onUpdateWeightExercise(item.exerciseId, { sets: value });
                        }}
                      />
                      <TextInput
                        style={styles.metricInput}
                        placeholder="reps"
                        keyboardType="numeric"
                        value={linkedExercise?.reps ?? ''}
                        onChangeText={(value) => {
                          if (!item.exerciseId) {
                            return;
                          }
                          onUpdateWeightExercise(item.exerciseId, { reps: value });
                        }}
                      />
                      <TextInput
                        style={styles.metricInput}
                        placeholder="weight (lb)"
                        keyboardType="numeric"
                        value={linkedExercise?.weightLb ?? ''}
                        onChangeText={(value) => {
                          if (!item.exerciseId) {
                            return;
                          }
                          onUpdateWeightExercise(item.exerciseId, { weightLb: value });
                        }}
                      />
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No exercises yet.</Text>
              }
            />
          </View>
        </>
      )}

      {draggingOption ? (
        <Animated.View
          pointerEvents="none"
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            dragIndicatorSizeRef.current = { width, height };
          }}
          style={[
            styles.dragIndicator,
            {
              transform: [
                { translateX: dragIndicatorPosition.x },
                { translateY: dragIndicatorPosition.y },
              ],
            },
          ]}
        >
          <View style={styles.optionRowDragIndicator}>
            <Text style={styles.optionName}>{draggingOption.name}</Text>
            <View
              style={[
                styles.categoryPill,
                {
                  backgroundColor: getCategoryDisplay(draggingOption.category).color,
                },
              ]}
            >
              <Text style={styles.categoryPillText}>
                {getCategoryDisplay(draggingOption.category).label}
              </Text>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  selectorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 14,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  categoryFiltersRow: {
    gap: 8,
    paddingVertical: 10,
  },
  categoryFilterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  categoryFilterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryFilterText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  categoryFilterTextActive: {
    color: '#ffffff',
  },
  optionsList: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: '#f9fafb',
  },
  dragHintText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 8,
  },
  optionRow: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionRowSelected: {
    backgroundColor: '#e5e7eb',
  },
  optionRowDraggingSource: {
    opacity: 0.2,
  },
  optionRowDragIndicator: {
    width: 260,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  optionName: {
    flex: 1,
    color: '#111827',
    fontWeight: '600',
    marginRight: 8,
  },
  emptySelectorText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 12,
  },
  selectedLabel: {
    marginTop: 10,
    marginBottom: 8,
    color: '#4b5563',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  helperText: {
    color: '#6b7280',
    marginBottom: 10,
  },
  workoutListZone: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
    marginBottom: 8,
  },
  workoutListZoneActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  dropTargetRow: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9ca3af',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  dropTargetRowActive: {
    borderColor: '#10b981',
    backgroundColor: '#dcfce7',
  },
  dropTargetText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 13,
  },
  dropTargetTextActive: {
    color: '#065f46',
  },
  listContent: {
    paddingBottom: 24,
  },
  itemRow: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  itemRowActive: {
    opacity: 0.9,
    borderColor: '#9ca3af',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  metricInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  categoryPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  reorderHandle: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  reorderHandleText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
  },
  dragIndicator: {
    position: 'absolute',
    zIndex: 999,
    elevation: 12,
    opacity: 0.45,
  },
});
