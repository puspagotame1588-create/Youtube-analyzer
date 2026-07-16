"use client";

/**
 * "Consult us directly" — a student enters (or confirms) their data and
 * requests a direct online consultation to find universities. The request,
 * including an academic snapshot and their shortlist, is recorded (Supabase
 * when configured, otherwise the student's own browser in demo mode).
 *
 * Private by design: the academic snapshot is prefilled from a locally stored
 * route profile if one exists, but the student can edit everything before it
 * is recorded, and contact details are only ever used to reply.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, MessagesSquare, ShieldCheck } from "lucide-react";
import {
  consultationRequestSchema,
  type ConsultationRequestFormValues,
} from "@/lib/schemas";
import {
  loadProfile,
  getSavedPrograms,
  getComparePrograms,
  submitConsultationRequest,
} from "@/lib/store";
import { getProgram } from "@/data/programs";
import { useI18n } from "@/lib/i18n";
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
  Label,
  FieldError,
} from "@/components/shared/ui";

const CONTACT_METHODS = ["email", "line", "whatsapp", "phone"] as const;

export default function ConsultClient() {
  const { t, locale } = useI18n();
  const [profileId, setProfileId] = useState<string | undefined>(undefined);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [result, setResult] = useState<null | { mode: "supabase" | "local"; reference: string }>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConsultationRequestFormValues>({
    resolver: zodResolver(consultationRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      contactMethod: "email",
      contactHandle: "",
      preferredLanguage: locale,
      currentCountry: "Japan",
      livingInJapan: true,
      highestEducation: "high_school",
      jlptLevel: "N3",
      preferredField: "it",
      schoolTypePreference: "either",
      tuitionBudgetJpy: 1200000,
      desiredStart: "2027-04",
      message: "",
      consentToRecord: false,
      consentToContact: true,
    },
  });

  // Prefill from a locally saved route profile + shortlist.
  useEffect(() => {
    const profile = loadProfile();
    if (profile) {
      setProfileId(profile.id);
      setValue("currentCountry", profile.currentCountry);
      setValue("livingInJapan", profile.livingInJapan);
      setValue("highestEducation", profile.highestEducation);
      setValue("jlptLevel", profile.jlptLevel);
      setValue("preferredField", profile.preferredField);
      setValue("schoolTypePreference", profile.schoolTypePreference);
      setValue("tuitionBudgetJpy", profile.tuitionBudgetJpy);
      if (profile.desiredStart) setValue("desiredStart", profile.desiredStart);
      if (profile.displayName) setValue("fullName", profile.displayName);
      setValue("preferredLanguage", profile.preferredLanguage);
    }
    const merged = Array.from(new Set([...getComparePrograms(), ...getSavedPrograms()]));
    setShortlist(merged);
  }, [setValue]);

  const contactMethod = watch("contactMethod");
  const needsHandle = contactMethod !== "email";

  const shortlistNames = useMemo(
    () =>
      shortlist
        .map((id) => {
          const p = getProgram(id);
          if (!p) return null;
          return locale === "ja" ? p.nameJa : p.name;
        })
        .filter((n): n is string => Boolean(n)),
    [shortlist, locale]
  );

  const err = (field: keyof ConsultationRequestFormValues) => {
    const e = errors[field];
    if (!e) return undefined;
    const key = `form.errors.${String(e.message)}`;
    const translated = t(key);
    return translated === key ? t("form.errors.required") : translated;
  };

  const onSubmit = async (values: ConsultationRequestFormValues) => {
    const res = await submitConsultationRequest({
      profileId,
      fullName: values.fullName,
      email: values.email,
      contactMethod: values.contactMethod,
      contactHandle: values.contactHandle || undefined,
      preferredLanguage: values.preferredLanguage,
      currentCountry: values.currentCountry,
      livingInJapan: values.livingInJapan,
      highestEducation: values.highestEducation,
      jlptLevel: values.jlptLevel,
      preferredField: values.preferredField,
      schoolTypePreference: values.schoolTypePreference,
      tuitionBudgetJpy: values.tuitionBudgetJpy,
      desiredStart: values.desiredStart || undefined,
      message: values.message,
      shortlistedProgramIds: shortlist,
      consentToRecord: values.consentToRecord,
      consentToContact: values.consentToContact,
    });
    setResult({ mode: res.mode, reference: res.reference });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card className="lumin-border p-8 text-center" role="status">
          <p className="text-3xl" aria-hidden>✅</p>
          <h1 className="mt-3 text-2xl font-bold text-ink">{t("consult.successTitle")}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            {t("consult.successBody")}
          </p>
          <div className="mx-auto mt-5 inline-flex flex-col items-center rounded-xl bg-surface-soft px-6 py-4">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-soft">
              {t("consult.referenceLabel")}
            </span>
            <span className="mt-1 font-mono text-2xl font-bold tracking-wide text-ink">
              {result.reference}
            </span>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-ink-soft">
            {result.mode === "local" ? t("consult.successLocalNote") : t("consult.successSentNote")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/results">
              <Button variant="outline">{t("nav.results")}</Button>
            </Link>
            <Link href="/privacy">
              <Button variant="ghost">{t("consult.managePrivacy")}</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Badge tone="info">{t("consult.badge")}</Badge>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{t("consult.title")}</h1>
      <p className="mt-2 text-ink-soft">{t("consult.subtitle")}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: MessagesSquare, key: "consult.value1" },
          { icon: CalendarClock, key: "consult.value2" },
          { icon: ShieldCheck, key: "consult.value3" },
        ].map(({ icon: Icon, key }) => (
          <div key={key} className="flex items-start gap-2.5 rounded-xl border border-ink/10 bg-surface p-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-electric" aria-hidden />
            <span className="text-sm text-ink">{t(key)}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-6">
        {/* Contact */}
        <Card className="space-y-5 p-6">
          <h2 className="text-lg font-semibold text-ink">{t("consult.contactTitle")}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="c-name">{t("consult.fullName")}</Label>
              <Input id="c-name" {...register("fullName")} />
              <FieldError message={err("fullName")} />
            </div>
            <div>
              <Label htmlFor="c-email">{t("consult.email")}</Label>
              <Input id="c-email" type="email" {...register("email")} />
              <FieldError message={err("email")} />
            </div>
            <div>
              <Label htmlFor="c-method">{t("consult.contactMethod")}</Label>
              <Select id="c-method" {...register("contactMethod")}>
                {CONTACT_METHODS.map((m) => (
                  <option key={m} value={m}>{t(`consult.method.${m}`)}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="c-handle">
                {needsHandle ? t(`consult.handle.${contactMethod}`) : t("consult.handleOptional")}
                {!needsHandle && <span className="font-normal text-ink-soft"> ({t("form.optional")})</span>}
              </Label>
              <Input
                id="c-handle"
                {...register("contactHandle")}
                placeholder={needsHandle ? t(`consult.handlePh.${contactMethod}`) : ""}
                disabled={!needsHandle}
              />
              <FieldError message={errors.contactHandle ? t("consult.errHandleRequired") : undefined} />
            </div>
            <div>
              <Label htmlFor="c-lang">{t("form.preferredLanguage")}</Label>
              <Select id="c-lang" {...register("preferredLanguage")}>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Academic snapshot */}
        <Card className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t("consult.dataTitle")}</h2>
            <p className="mt-1 text-sm text-ink-soft">{t("consult.dataNote")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="c-country">{t("form.currentCountry")}</Label>
              <Input id="c-country" {...register("currentCountry")} />
              <FieldError message={err("currentCountry")} />
            </div>
            <div>
              <Label htmlFor="c-living">{t("form.livingInJapan")}</Label>
              <Select id="c-living" {...register("livingInJapan", { setValueAs: (v) => v === "true" || v === true })}>
                <option value="true">{t("form.yes")}</option>
                <option value="false">{t("form.no")}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="c-edu">{t("form.highestEducation")}</Label>
              <Select id="c-edu" {...register("highestEducation")}>
                {(["junior_high", "high_school", "language_school", "vocational_diploma", "associate", "bachelor", "master"] as const).map((e) => (
                  <option key={e} value={e}>{t(`form.edu.${e}`)}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="c-jlpt">{t("form.jlptLevel")}</Label>
              <Select id="c-jlpt" {...register("jlptLevel")}>
                <option value="none">{t("form.jlptNone")}</option>
                {(["N5", "N4", "N3", "N2", "N1"] as const).map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="c-field">{t("form.preferredField")}</Label>
              <Select id="c-field" {...register("preferredField")}>
                {(["it", "business", "engineering", "hospitality", "tourism", "care", "design", "other"] as const).map((f) => (
                  <option key={f} value={f}>{t(`fields.${f}`)}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="c-type">{t("form.schoolTypePreference")}</Label>
              <Select id="c-type" {...register("schoolTypePreference")}>
                <option value="either">{t("form.either")}</option>
                <option value="university">{t("form.schoolTypes.university")}</option>
                <option value="vocational_school">{t("form.schoolTypes.vocational_school")}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="c-budget">{t("form.budget")}</Label>
              <Select id="c-budget" {...register("tuitionBudgetJpy", { setValueAs: (v) => Number(v) })}>
                {[800000, 1000000, 1200000, 1400000, 1600000, 2000000, 3000000].map((b) => (
                  <option key={b} value={b}>~ ¥{b.toLocaleString()}</option>
                ))}
              </Select>
              <FieldError message={err("tuitionBudgetJpy")} />
            </div>
            <div>
              <Label htmlFor="c-start">{t("form.desiredStart")}</Label>
              <Input id="c-start" type="month" {...register("desiredStart")} />
            </div>
          </div>

          {shortlistNames.length > 0 && (
            <div className="rounded-xl bg-surface-soft p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {t("consult.shortlistTitle")}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {shortlistNames.map((n) => (
                  <li key={n}>
                    <Badge tone="neutral">{n}</Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-soft">{t("consult.shortlistNote")}</p>
            </div>
          )}
        </Card>

        {/* Message + consent */}
        <Card className="space-y-5 p-6">
          <div>
            <Label htmlFor="c-message">{t("consult.messageLabel")}</Label>
            <Textarea id="c-message" {...register("message")} placeholder={t("consult.messagePh")} />
            <FieldError message={err("message")} />
          </div>

          <div className="space-y-3 rounded-xl bg-surface-soft p-4">
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--mp-electric)]" {...register("consentToRecord")} />
              <span className="text-sm leading-relaxed text-ink">
                <strong>{t("consult.consentRecord")}</strong>
                <br />
                <span className="text-ink-soft">{t("consult.consentRecordNote")}</span>
              </span>
            </label>
            <FieldError message={errors.consentToRecord ? t("consult.errConsentRequired") : undefined} />
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--mp-electric)]" {...register("consentToContact")} />
              <span className="text-sm leading-relaxed text-ink">
                {t("consult.consentContact")}
              </span>
            </label>
          </div>

          <p className="text-xs leading-relaxed text-ink-soft">{t("consult.privacyNote")}</p>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "…" : t("consult.submit")}
          </Button>
        </Card>
      </form>
    </div>
  );
}
