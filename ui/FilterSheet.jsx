import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { radius, space, type } from "../theme";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { Button, ChipRow } from "./core";
import { useStyles } from "./useStyles";

const barStyles = (t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: space.md,
  },
  title: { ...type.heading, color: t.text },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs + 2,
    minHeight: 44,
    paddingHorizontal: space.md - 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
  },
  buttonOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
  label: { ...type.label, color: t.text },
  badge: { ...type.micro, color: t.accent },
});

// The results heading with one Filters and sort button (pattern B4). `active` counts what is set.
export function FilterBar({ title, active, onOpen }) {
  const s = useStyles(barStyles);
  return (
    <View style={s.row}>
      <Text style={s.title}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          active ? `Filters and sort, ${active} set` : "Filters and sort"
        }
        onPress={onOpen}
        style={[s.button, active > 0 && s.buttonOn]}
      >
        <Icon name="options-outline" tone={active > 0 ? "accent" : "text"} />
        <Text style={s.label}>Filters</Text>
        {active > 0 ? <Text style={s.badge}>{active}</Text> : null}
      </Pressable>
    </View>
  );
}

const sheetStyles = (t) => ({
  group: { gap: space.sm, paddingBottom: space.md },
  label: {
    ...type.label,
    color: t.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grow: { flex: 1 },
});

// Pick an expiry window and a sort. The button shows how many coupons the draft would show.
export function FilterSheet({
  visible,
  onClose,
  windows,
  sorts,
  value,
  onApply,
  countFor,
}) {
  const s = useStyles(sheetStyles);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    // Start each opening from what is currently applied.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visible) setDraft(value);
  }, [visible, value]);

  const count = countFor(draft);
  return (
    <Sheet
      visible={visible}
      title="Filters and sort"
      onClose={onClose}
      footer={
        <>
          <View style={s.grow}>
            <Button
              variant="secondary"
              label="Reset"
              onPress={() => setDraft({ window: "All", sort: sorts[0] })}
            />
          </View>
          <View style={s.grow}>
            <Button
              label={`Show ${count} ${count === 1 ? "coupon" : "coupons"}`}
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            />
          </View>
        </>
      }
    >
      <View style={s.group}>
        <Text style={s.label}>Expires</Text>
        <ChipRow
          options={windows}
          value={draft.window}
          onChange={(v) => setDraft({ ...draft, window: v || "All" })}
        />
      </View>
      <View style={s.group}>
        <Text style={s.label}>Sort by</Text>
        <ChipRow
          options={sorts}
          value={draft.sort}
          onChange={(v) => setDraft({ ...draft, sort: v || draft.sort })}
        />
      </View>
    </Sheet>
  );
}
