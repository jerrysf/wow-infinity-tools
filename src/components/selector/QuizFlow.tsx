"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { GameClass, SelectorConfig } from "@/lib/data/schema";
import { recommend, type Answers } from "@/lib/selector/recommend";
import { pick, t } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/lib/site";
import { DemoBadge } from "@/components/site/StatusBadge";
import { classColor } from "@/lib/class-colors";

function encodeAnswers(answers: Answers): string {
  return Object.entries(answers)
    .map(([q, o]) => `${q}:${o}`)
    .join(",");
}

function decodeAnswers(raw: string | null, config: SelectorConfig): Answers {
  const answers: Answers = {};
  if (!raw) return answers;
  for (const pair of raw.split(",")) {
    const [qid, oid] = pair.split(":");
    const question = config.questions.find((q) => q.id === qid);
    if (question && question.options.some((o) => o.id === oid)) {
      answers[qid] = oid;
    }
  }
  return answers;
}

export function QuizFlow({
  config,
  classes,
  locale,
  dict,
}: {
  config: SelectorConfig;
  classes: GameClass[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);
  // Gate URL writes until the initial ?a= restore has landed.
  const [ready, setReady] = useState(false);

  // Restore answers from ?a= on mount so result links are shareable. This is
  // genuine hydration from an external system (the URL) and cannot run during
  // SSR, so the set-state-in-effect rule does not apply here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("a");
    const restored = decodeAnswers(raw, config);
    if (Object.keys(restored).length > 0) {
      setAnswers(restored);
      if (Object.keys(restored).length >= config.questions.length) {
        setShowResults(true);
        setStep(config.questions.length - 1);
      }
    }
    setReady(true);
  }, [config]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const encoded = encodeAnswers(answers);
    if (encoded) params.set("a", encoded);
    else params.delete("a");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [answers, ready]);

  const results = useMemo(
    () => recommend(answers, config, classes),
    [answers, config, classes],
  );

  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const question = config.questions[step];
  const total = config.questions.length;

  function choose(optionId: string) {
    const next = { ...answers, [question.id]: optionId };
    setAnswers(next);
    setCopied(false);
    if (step + 1 >= total) setShowResults(true);
    else setStep(step + 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setShowResults(false);
    setCopied(false);
  }

  function copySummary() {
    const lines = results.map((r, i) => {
      const c = classById.get(r.classId);
      return `${i + 1}. ${c ? pick(c.name, locale) : r.classId}`;
    });
    const text = `${dict.selector.results}\n${lines.join("\n")}\n${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => setCopied(true));
  }

  if (showResults) {
    return (
      <div>
        <p className="card mb-4 p-3 text-sm text-[#b0a284]">{dict.selector.resultsDisclaimer}</p>
        <h2 className="mb-4 text-xl font-semibold">{dict.selector.results}</h2>
        {results.length === 0 && <p>{dict.selector.noResults}</p>}
        <ol className="space-y-4">
          {results.map((rec) => {
            const c = classById.get(rec.classId);
            if (!c) return null;
            const reasons = rec.matched
              .sort((a, b) => b.weight - a.weight)
              .slice(0, 3)
              .map((m) => {
                const q = config.questions.find((q) => q.id === m.questionId);
                const o = q?.options.find((o) => o.id === m.optionId);
                return o ? `${pick(q!.text, locale)} → ${pick(o.text, locale)}` : "";
              })
              .filter(Boolean);
            return (
              <li key={rec.classId} className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold" style={{ color: classColor(c.id) }}>
                    {pick(c.name, locale)}
                  </h3>
                  {c.demo && <DemoBadge dict={dict} />}
                </div>
                {c.tagline && (
                  <p className="mt-1 text-sm text-[#b0a284]">{pick(c.tagline, locale)}</p>
                )}
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <h4 className="font-medium">{dict.selector.whyThis}</h4>
                    <ul className="mt-1 list-inside list-disc text-[#b0a284]">
                      {reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    {c.strengths && (
                      <>
                        <h4 className="font-medium">{dict.selector.goodFor}</h4>
                        <p className="mt-1 text-[#b0a284]">{pick(c.strengths, locale)}</p>
                      </>
                    )}
                    {c.drawbacks && (
                      <>
                        <h4 className="mt-2 font-medium">{dict.selector.drawbacks}</h4>
                        <p className="mt-1 text-[#b0a284]">{pick(c.drawbacks, locale)}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <Link
                    className="text-amber-300 underline decoration-amber-300/40 underline-offset-2 hover:text-amber-200"
                    href={localizedPath(locale, `/talents/${c.slug}`)}
                  >
                    {dict.common.actions.viewTalents}
                  </Link>
                  <Link
                    className="text-amber-300 underline decoration-amber-300/40 underline-offset-2 hover:text-amber-200"
                    href={localizedPath(locale, "/guides")}
                  >
                    {dict.common.actions.viewGuide}
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={copySummary} className="btn-gold">
            {copied ? dict.selector.summaryCopied : dict.selector.copySummary}
          </button>
          <button type="button" onClick={restart} className="btn-ghost">
            {dict.common.actions.restart}
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;
  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <p className="mb-2 text-sm text-[#8a7a58]">
          {t(dict.selector.questionOf, { current: step + 1, total })}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#241b0e]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
      </div>
      <h2 className="mb-4 text-xl font-semibold">{pick(question.text, locale)}</h2>
      <div className="grid gap-2">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option.id)}
            className="card card-interactive px-4 py-3 text-left text-sm font-medium hover:border-[#8a6a28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            {pick(option.text, locale)}
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost">
            {dict.common.actions.back}
          </button>
        )}
        <button type="button" onClick={restart} className="btn-ghost">
          {dict.common.actions.restart}
        </button>
      </div>
    </div>
  );
}
