"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { institutionLeadSchema, type InstitutionLeadFormValues } from "@/lib/schemas";
import { submitInstitutionLead } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Button, Card, Input, Select, Textarea, Label, FieldError } from "@/components/shared/ui";

export default function LeadForm() {
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState<null | "supabase" | "local">(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionLeadFormValues>({
    resolver: zodResolver(institutionLeadSchema),
    defaultValues: {
      institutionType: "university",
      preferredPilotType: "listing",
      phone: "",
    },
  });

  const err = (field: keyof InstitutionLeadFormValues) => {
    const e = errors[field];
    if (!e) return undefined;
    const key = `form.errors.${String(e.message)}`;
    const translated = t(key);
    return translated === key ? t("form.errors.required") : translated;
  };

  const onSubmit = async (values: InstitutionLeadFormValues) => {
    const result = await submitInstitutionLead({
      ...values,
      phone: values.phone || undefined,
    });
    setSubmitted(result.mode);
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center" role="status">
        <p className="text-2xl" aria-hidden>🎉</p>
        <h3 className="mt-2 text-xl font-bold text-ink">{t("inst.formSuccessTitle")}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          {t("inst.formSuccessBody")}
          {submitted === "local" && (
            <span className="mt-2 block text-xs text-amber-700">{t("inst.formLocalNote")}</span>
          )}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="lf-name">{t("inst.fInstitutionName")}</Label>
          <Input id="lf-name" {...register("institutionName")} />
          <FieldError message={err("institutionName")} />
        </div>
        <div>
          <Label htmlFor="lf-type">{t("inst.fInstitutionType")}</Label>
          <Select id="lf-type" {...register("institutionType")}>
            <option value="university">{t("form.schoolTypes.university")}</option>
            <option value="junior_college">{t("inst.typeJuniorCollege")}</option>
            <option value="vocational_school">{t("form.schoolTypes.vocational_school")}</option>
            <option value="professional_training_college">{t("inst.typeProfessional")}</option>
            <option value="language_school">{t("form.schoolTypes.language_school")}</option>
            <option value="other">{t("form.schoolTypes.other")}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="lf-dept">{t("inst.fDepartment")}</Label>
          <Input id="lf-dept" {...register("department")} placeholder={t("inst.fDepartmentPh")} />
          <FieldError message={err("department")} />
        </div>
        <div>
          <Label htmlFor="lf-contact">{t("inst.fContactName")}</Label>
          <Input id="lf-contact" {...register("contactName")} />
          <FieldError message={err("contactName")} />
        </div>
        <div>
          <Label htmlFor="lf-role">{t("inst.fRole")}</Label>
          <Input id="lf-role" {...register("role")} placeholder={t("inst.fRolePh")} />
          <FieldError message={err("role")} />
        </div>
        <div>
          <Label htmlFor="lf-email">{t("inst.fEmail")}</Label>
          <Input id="lf-email" type="email" {...register("workEmail")} />
          <FieldError message={err("workEmail")} />
        </div>
        <div>
          <Label htmlFor="lf-phone">
            {t("inst.fPhone")} <span className="font-normal text-ink-soft">({t("form.optional")})</span>
          </Label>
          <Input id="lf-phone" type="tel" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="lf-year">{t("inst.fTargetYear")}</Label>
          <Select id="lf-year" {...register("targetAcademicYear")}>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
            <option value="2027-2028">2027–2028</option>
          </Select>
          <FieldError message={err("targetAcademicYear")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="lf-goals">{t("inst.fGoals")}</Label>
          <Textarea id="lf-goals" {...register("recruitmentGoals")} placeholder={t("inst.fGoalsPh")} />
          <FieldError message={err("recruitmentGoals")} />
        </div>
        <div>
          <Label htmlFor="lf-nat">{t("inst.fNationalities")}</Label>
          <Input id="lf-nat" {...register("targetNationalities")} placeholder={t("inst.fNationalitiesPh")} />
          <FieldError message={err("targetNationalities")} />
        </div>
        <div>
          <Label htmlFor="lf-programs">{t("inst.fPrograms")}</Label>
          <Input id="lf-programs" {...register("programsToPromote")} placeholder={t("inst.fProgramsPh")} />
          <FieldError message={err("programsToPromote")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="lf-challenge">{t("inst.fChallenge")}</Label>
          <Textarea id="lf-challenge" {...register("currentChallenge")} placeholder={t("inst.fChallengePh")} />
          <FieldError message={err("currentChallenge")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="lf-pilot">{t("inst.fPilotType")}</Label>
          <Select id="lf-pilot" {...register("preferredPilotType")}>
            <option value="listing">{t("inst.pilotListing")}</option>
            <option value="events">{t("inst.pilotEvents")}</option>
            <option value="introductions">{t("inst.pilotIntroductions")}</option>
            <option value="insights">{t("inst.pilotInsights")}</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "…" : t("inst.fSubmit")}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">{t("inst.fPrivacyNote")}</p>
        </div>
      </form>
    </Card>
  );
}
