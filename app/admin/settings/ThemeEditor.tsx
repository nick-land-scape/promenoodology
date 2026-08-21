"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Picker from "@/components/admin/Picker";
import { Field, Problem, SaveBar, Word, useUnsaved } from "@/components/admin/ui";
import { COLOURS, FONTS, type Theme } from "@/lib/theme";
import { saveTheme } from "./actions";

/**
 * The look of the site, in one form.
 *
 * Every field can be empty, and empty is not a blank — it is "as drawn", the
 * value in the stylesheet. So there is a way back from every change here that
 * does not require remembering what the old number was, which matters when the
 * thing being changed is the colour of every word on the site.
 *
 * The colours are shown as well as named. A hex code is not something anybody
 * can picture, and this is the one page where being wrong is visible on every
 * other page at once.
 */
export default function ThemeEditor({ initial }: { initial: Theme }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [kept, setKept] = useState(initial);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  const changed = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(kept),
    [draft, kept],
  );

  /* A word before anybody walks away from this. */
  useUnsaved(changed, "changes to the look of the site");

  function set(patch: Partial<Theme>) {
    setDraft((was) => ({ ...was, ...patch }));
    setJustSaved(false);
  }

  function save() {
    setProblem("");
    start(async () => {
      const result = await saveTheme(draft);
      if (!result.ok) setProblem(result.error ?? "That did not save.");
      else {
        setKept(draft);
        setJustSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Problem>{problem}</Problem>

      <div className="admin-panel">
        <header className="admin-panel-head">
          <div>
            <h2 className="admin-panel-name">the two typefaces</h2>
            <p className="admin-panel-hint">
              One for what is read, one for what is a label. Only families that are already on the
              machine reading the page: a web font means a request before the first word can be
              drawn, and this site is words.
            </p>
          </div>
        </header>
        <div className="admin-fields">
          <Field label="what is read" hint="Headings, paragraphs, captions.">
            <Picker
              value={draft.serif}
              onChange={(next) => set({ serif: next })}
              options={FONTS.serif.map((font) => ({ value: font.value, label: font.label }))}
              empty={null}
              label="The typeface for what is read"
            />
          </Field>
          <Field label="what is a label" hint="Small capitals: the menu, buttons, tags.">
            <Picker
              value={draft.sans}
              onChange={(next) => set({ sans: next })}
              options={FONTS.sans.map((font) => ({ value: font.value, label: font.label }))}
              empty={null}
              label="The typeface for labels"
            />
          </Field>
        </div>
        {/* Set in the fonts themselves, so the choice is made by looking. */}
        <div className="admin-theme-taste">
          <p style={{ fontFamily: draft.serif || FONTS.serif[0].stack }}>
            Cooking is our medium — accessible, endlessly adaptable, and it ends in something
            everyone understands: a meal.
          </p>
          <span style={{ fontFamily: draft.sans || FONTS.sans[0].stack }}>
            hear when something is on →
          </span>
        </div>
      </div>

      <div className="admin-panel">
        <header className="admin-panel-head">
          <div>
            <h2 className="admin-panel-name">the five colours</h2>
            <p className="admin-panel-hint">
              These are the light ones. Dark has a palette of its own — a warm paper so photographs
              do not look like windows, and the accents lifted until they can be read rather than
              merely seen — and it follows these rather than being typed again.
            </p>
          </div>
        </header>
        <div className="admin-fields">
          {COLOURS.map((colour) => {
            const value = draft[colour.key] || colour.drawn;
            const asDrawn = !draft[colour.key];
            return (
              <Field key={colour.key} label={colour.label} hint={colour.note}>
                <span className="admin-theme-colour">
                  <input
                    type="color"
                    value={value}
                    aria-label={`The ${colour.label} the site is drawn with`}
                    onChange={(event) => set({ [colour.key]: event.target.value } as Partial<Theme>)}
                  />
                  <code>{asDrawn ? `${colour.drawn} — as drawn` : value}</code>
                  {asDrawn ? null : (
                    <Word onClick={() => set({ [colour.key]: "" } as Partial<Theme>)}>put it back</Word>
                  )}
                </span>
              </Field>
            );
          })}
        </div>
      </div>

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={changed}
        saved={justSaved}
        label="change the look"
      >
        <span className="admin-note" style={{ margin: 0 }}>
          every page at once, front of the house and back
        </span>
      </SaveBar>
    </>
  );
}
