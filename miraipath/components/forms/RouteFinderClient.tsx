"use client";

/**
 * Multi-step student route finder with progressive disclosure.
 * Validation: Zod + React Hook Form, per step. The profile is stored
 * locally (private by default) and drives the deterministic matcher.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { studentProfileSchema, type StudentProfileFormValues } from "@/lib/schemas";
import { loadProfile, saveProfile } from "@/lib/store";
import { uid, REGION_LABELS } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  Button,
  Card,
  Input,
  Select,
  Label,
  FieldError,
  Progress,
  Badge,
} from "@/components/shared/ui";
import type { StudentProfile, StudentPriority } from "@/types";

const STEP_FIELDS: (keyof StudentProfileFormValues)[][] = [
  ["currentCountry", "livingInJapan", "currentSchoolType", "expectedGraduation", "nationality", "preferredLanguage"],
  ["highestEducation", "previousMajor", "jlptLevel", "ejuTaken", "gpa", "attendancePercent"],
  ["preferredField", "preferredCareer", "schoolTypePreference", "preferredRegion", "desiredStart"],
  ["tuitionBudgetJpy", "familySupport", "desiredSalaryAspirationJpy", "priorities", "displayName"],
  ["allowInstitutionContact"],
];

const PRIORITY_KEYS: StudentPriority[] = [
  "low_cost",
  "speed",
  "prestige",
  "career_flexibility",
  "location",
  "scholarship",
];

export default function RouteFinderClient() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [invitedBy, setInvitedBy] = useState<string | null>(null);
  const totalSteps = STEP_FIELDS.length;

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentProfileFormValues>({
    resolver: zodResolver(studentProfileSchema),
    mode: "onTouched",
    defaultValues: {
      currentCountry: "Japan",
      livingInJapan: true,
      currentSchoolType: "language_school",
      preferredLanguage: "en",
      highestEducation: "high_school",
      jlptLevel: "N3",
      ejuTaken: "unknown",
      preferredField: "it",
      schoolTypePreference: "either",
      preferredRegion: "any",
      tuitionBudgetJpy: 1200000,
      familySupport: "unknown",
      desiredStart: "2027-04",
      priorities: [],
      allowInstitutionContact: false,
      displayName: "",
      nationality: "",
      previousMajor: "",
      preferredCareer: "",
      gpa: "",
      expectedGraduation: "",
    },
  });

  // Prefill from a previously saved profile; read invite param (share loop).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inv = params.get("invite");
    if (inv) setInvitedBy(inv.slice(0, 40));

    const existing = loadProfile();
    if (existing) {
      setValue("currentCountry", existing.currentCountry);
      setValue("livingInJapan", existing.livingInJapan);
      if (existing.currentSchoolType) setValue("currentSchoolType", existing.currentSchoolType);
      setValue("preferredLanguage", existing.preferredLanguage);
      setValue("highestEducation", existing.highestEducation);
      setValue("jlptLevel", existing.jlptLevel);
      setValue("ejuTaken", existing.ejuTaken === true ? "yes" : existing.ejuTaken === false ? "no" : "unknown");
      setValue("preferredField", existing.preferredField);
      setValue("schoolTypePreference", existing.schoolTypePreference);
      setValue("preferredRegion", existing.preferredRegion ?? "any");
      setValue("tuitionBudgetJpy", existing.tuitionBudgetJpy);
      if (existing.desiredStart) setValue("desiredStart", existing.desiredStart);
      setValue("priorities", existing.priorities);
      setValue("allowInstitutionContact", existing.allowInstitutionContact);
      if (existing.displayName) setValue("displayName", existing.displayName);
    }
  }, [setValue]);

  const priorities = watch("priorities");

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const onSubmit = (values: StudentProfileFormValues) => {
    const existing = loadProfile();
    const now = new Date().toISOString();
    const profile: StudentProfile = {
      id: existing?.id ?? uid("profile"),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      displayName: values.displayName || undefined,
      currentCountry: values.currentCountry,
      livingInJapan: values.livingInJapan,
      currentSchoolType: values.currentSchoolType,
      expectedGraduation: values.expectedGraduation || undefined,
      nationality: values.nationality || undefined,
      preferredLanguage: values.preferredLanguage,
      highestEducation: values.highestEducation,
      previousMajor: values.previousMajor || undefined,
      jlptLevel: values.jlptLevel,
      ejuTaken: values.ejuTaken === "yes" ? true : values.ejuTaken === "no" ? false : null,
      gpa: values.gpa || undefined,
      attendancePercent: values.attendancePercent,
      preferredField: values.preferredField,
      preferredCareer: values.preferredCareer || undefined,
      schoolTypePreference: values.schoolTypePreference,
      preferredRegion: values.preferredRegion,
      tuitionBudgetJpy: values.tuitionBudgetJpy,
      familySupport: values.familySupport,
      desiredStart: values.desiredStart,
      desiredSalaryAspirationJpy: values.desiredSalaryAspirationJpy,
      priorities: values.priorities,
      allowInstitutionContact: values.allowInstitutionContact,
    };
    saveProfile(profile);
    router.push("/results");
  };

  const err = (field: keyof StudentProfileFormValues) => {
    const e = errors[field];
    if (!e) return undefined;
    return t(`form.errors.${String(e.message)}`) !== `form.errors.${String(e.message)}`
      ? t(`form.errors.${String(e.message)}`)
      : t("form.errors.required");
  };

  const stepTitles = [
    t("form.step1Title"),
    t("form.step2Title"),
    t("form.step3Title"),
    t("form.step4Title"),
    t("form.step5Title"),
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Badge tone="caution">{t("common.demoDataBadge")}</Badge>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{t("form.title")}</h1>
      <p className="mt-2 text-ink-soft">{t("form.subtitle")}</p>

      {invitedBy && (
        <div className="mt-4 rounded-xl border border-electric/30 bg-electric/5 px-4 py-3 text-sm text-ink" role="status">
          {t("form.invitedBanner", { name: invitedBy })}
        </div>
      )}

      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-ink">
            {t("form.stepLabel", { current: step + 1, total: totalSteps })}: {stepTitles[step]}
          </span>
          <span className="tabular-nums text-ink-soft">{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / totalSteps) * 100} label={t("form.stepLabel", { current: step + 1, total: totalSteps })} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduced ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="mt-6 space-y-5 p-6">
              {step === 0 && (
                <>
                  <div>
                    <Label htmlFor="currentCountry">{t("form.currentCountry")}</Label>
                    <Input id="currentCountry" {...register("currentCountry")} />
                    <FieldError message={err("currentCountry")} />
                  </div>
                  <div>
                    <Label htmlFor="livingInJapan">{t("form.livingInJapan")}</Label>
                    <Select
                      id="livingInJapan"
                      {...register("livingInJapan", { setValueAs: (v) => v === "true" || v === true })}
                    >
                      <option value="true">{t("form.yes")}</option>
                      <option value="false">{t("form.no")}</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currentSchoolType">{t("form.currentSchoolType")}</Label>
                    <Select id="currentSchoolType" {...register("currentSchoolType")}>
                      <option value="language_school">{t("form.schoolTypes.language_school")}</option>
                      <option value="high_school">{t("form.schoolTypes.high_school")}</option>
                      <option value="university">{t("form.schoolTypes.university")}</option>
                      <option value="vocational_school">{t("form.schoolTypes.vocational_school")}</option>
                      <option value="not_in_school">{t("form.schoolTypes.not_in_school")}</option>
                      <option value="other">{t("form.schoolTypes.other")}</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expectedGraduation">{t("form.expectedGraduation")}</Label>
                    <Input id="expectedGraduation" type="month" {...register("expectedGraduation")} />
                  </div>
                  <div>
                    <Label htmlFor="nationality">
                      {t("form.nationality")} <span className="font-normal text-ink-soft">({t("form.optional")})</span>
                    </Label>
                    <Input id="nationality" {...register("nationality")} placeholder={t("form.nationalityPlaceholder")} />
                    <p className="mt-1 text-xs text-ink-soft">{t("form.nationalityNote")}</p>
                  </div>
                  <div>
                    <Label htmlFor="preferredLanguage">{t("form.preferredLanguage")}</Label>
                    <Select id="preferredLanguage" {...register("preferredLanguage")}>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                    </Select>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div>
                    <Label htmlFor="highestEducation">{t("form.highestEducation")}</Label>
                    <Select id="highestEducation" {...register("highestEducation")}>
                      <option value="junior_high">{t("form.edu.junior_high")}</option>
                      <option value="high_school">{t("form.edu.high_school")}</option>
                      <option value="language_school">{t("form.edu.language_school")}</option>
                      <option value="vocational_diploma">{t("form.edu.vocational_diploma")}</option>
                      <option value="associate">{t("form.edu.associate")}</option>
                      <option value="bachelor">{t("form.edu.bachelor")}</option>
                      <option value="master">{t("form.edu.master")}</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="previousMajor">
                      {t("form.previousMajor")} <span className="font-normal text-ink-soft">({t("form.optional")})</span>
                    </Label>
                    <Input id="previousMajor" {...register("previousMajor")} />
                  </div>
                  <div>
                    <Label htmlFor="jlptLevel">{t("form.jlptLevel")}</Label>
                    <Select id="jlptLevel" {...register("jlptLevel")}>
                      <option value="none">{t("form.jlptNone")}</option>
                      <option value="N5">N5</option>
                      <option value="N4">N4</option>
                      <option value="N3">N3</option>
                      <option value="N2">N2</option>
                      <option value="N1">N1</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ejuTaken">{t("form.ejuTaken")}</Label>
                    <Select id="ejuTaken" {...register("ejuTaken")}>
                      <option value="unknown">{t("form.ejuUnknown")}</option>
                      <option value="yes">{t("form.yes")}</option>
                      <option value="no">{t("form.no")}</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gpa">
                      {t("form.gpa")} <span className="font-normal text-ink-soft">({t("form.optional")})</span>
                    </Label>
                    <Input id="gpa" {...register("gpa")} placeholder="e.g. 3.2 / 4.0" />
                  </div>
                  <div>
                    <Label htmlFor="attendancePercent">
                      {t("form.attendance")} <span className="font-normal text-ink-soft">({t("form.optional")})</span>
                    </Label>
                    <Input
                      id="attendancePercent"
                      type="number"
                      min={0}
                      max={100}
                      {...register("attendancePercent", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                    />
                    <p className="mt-1 text-xs text-ink-soft">{t("form.attendanceNote")}</p>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <Label htmlFor="preferredField">{t("form.preferredField")}</Label>
                    <Select id="preferredField" {...register("preferredField")}>
                      {(["it", "business", "engineering", "hospitality", "tourism", "care", "design", "other"] as const).map((f) => (
                        <option key={f} value={f}>{t(`fields.${f}`)}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preferredCareer">
                      {t("form.preferredCareer")} <span className="font-normal text-ink-soft">({t("form.optional")})</span>
                    </Label>
                    <Input id="preferredCareer" {...register("preferredCareer")} placeholder={t("form.careerPlaceholder")} />
                  </div>
                  <div>
                    <Label htmlFor="schoolTypePreference">{t("form.schoolTypePreference")}</Label>
                    <Select id="schoolTypePreference" {...register("schoolTypePreference")}>
                      <option value="either">{t("form.either")}</option>
                      <option value="university">{t("form.schoolTypes.university")}</option>
                      <option value="vocational_school">{t("form.schoolTypes.vocational_school")}</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preferredRegion">{t("form.preferredRegion")}</Label>
                    <Select id="preferredRegion" {...register("preferredRegion")}>
                      <option value="any">{t("form.anyRegion")}</option>
                      {Object.entries(REGION_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {locale === "ja" ? label.ja : label.en}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="desiredStart">{t("form.desiredStart")}</Label>
                    <Input id="desiredStart" type="month" {...register("desiredStart")} />
                    <FieldError message={err("desiredStart")} />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <Label htmlFor="tuitionBudgetJpy">{t("form.budget")}</Label>
                    <Select
                      id="tuitionBudgetJpy"
                      {...register("tuitionBudgetJpy", { setValueAs: (v) => Number(v) })}
                    >
                      <option value={800000}>~ ¥800,000</option>
                      <option value={1000000}>~ ¥1,000,000</option>
                      <option value={1200000}>~ ¥1,200,000</option>
                      <option value={1400000}>~ ¥1,400,000</option>
                      <option value={1600000}>~ ¥1,600,000</option>
                      <option value={2000000}>~ ¥2,000,000</option>
                      <option value={3000000}>¥2,000,000 +</option>
                    </Select>
                    <p className="mt-1 text-xs text-ink-soft">{t("form.budgetNote")}</p>
                    <FieldError message={err("tuitionBudgetJpy")} />
                  </div>
                  <div>
                    <Label htmlFor="familySupport">{t("form.familySupport")}</Label>
                    <Select id="familySupport" {...register("familySupport")}>
                      <option value="unknown">{t("form.supportUnknown")}</option>
                      <option value="full">{t("form.supportFull")}</option>
                      <option value="partial">{t("form.supportPartial")}</option>
                      <option value="none">{t("form.supportNone")}</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="desiredSalaryAspirationJpy">
                      {t("form.salaryAspiration")} <span className="font-normal text-ink-soft">({t("form.optional")})</span>
                    </Label>
                    <Select
                      id="desiredSalaryAspirationJpy"
                      {...register("desiredSalaryAspirationJpy", {
                        setValueAs: (v) => (v === "" ? undefined : Number(v)),
                      })}
                    >
                      <option value="">—</option>
                      <option value={3000000}>~ ¥3,000,000 / {t("form.year")}</option>
                      <option value={4000000}>~ ¥4,000,000 / {t("form.year")}</option>
                      <option value={5000000}>~ ¥5,000,000 / {t("form.year")}</option>
                    </Select>
                    <p className="mt-1 text-xs text-ink-soft">{t("form.salaryNote")}</p>
                  </div>
                  <fieldset>
                    <legend className="mb-1.5 block text-sm font-medium text-ink">
                      {t("form.priorities")} <span className="font-normal text-ink-soft">({t("form.prioritiesMax")})</span>
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {PRIORITY_KEYS.map((p) => {
                        const selected = priorities?.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              const cur = priorities ?? [];
                              if (selected) {
                                setValue("priorities", cur.filter((x) => x !== p), { shouldValidate: true });
                              } else if (cur.length < 3) {
                                setValue("priorities", [...cur, p], { shouldValidate: true });
                              }
                            }}
                            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                              selected
                                ? "border-electric bg-electric/10 text-electric"
                                : "border-ink/15 text-ink-soft hover:bg-ink/5"
                            }`}
                          >
                            {t(`priorities.${p}`)}
                          </button>
                        );
                      })}
                    </div>
                    <FieldError message={errors.priorities ? t("form.errors.max3") : undefined} />
                  </fieldset>
                  <div>
                    <Label htmlFor="displayName">
                      {t("form.displayName")} <span className="font-normal text-ink-soft">({t("form.optional")})</span>
                    </Label>
                    <Input id="displayName" {...register("displayName")} placeholder={t("form.displayNamePlaceholder")} />
                    <p className="mt-1 text-xs text-ink-soft">{t("form.displayNameNote")}</p>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="rounded-xl bg-surface-soft p-4 text-sm leading-relaxed text-ink-soft">
                    <h3 className="mb-2 font-semibold text-ink">{t("form.privacyTitle")}</h3>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>{t("form.privacyPoint1")}</li>
                      <li>{t("form.privacyPoint2")}</li>
                      <li>{t("form.privacyPoint3")}</li>
                    </ul>
                  </div>
                  <label className="flex items-start gap-3 rounded-xl border border-ink/10 p-4">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[var(--mp-electric)]"
                      {...register("allowInstitutionContact")}
                    />
                    <span className="text-sm leading-relaxed text-ink">
                      <strong>{t("form.consentLabel")}</strong>
                      <br />
                      <span className="text-ink-soft">{t("form.consentNote")}</span>
                    </span>
                  </label>
                  <p className="text-xs text-ink-soft">{t("form.consentDefaultNote")}</p>
                </>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            {t("form.back")}
          </Button>
          {step < totalSteps - 1 ? (
            <Button type="button" onClick={next}>
              {t("form.next")}
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {t("form.submit")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
