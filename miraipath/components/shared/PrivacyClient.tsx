"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Download, Trash2, Server } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Badge, Button, Card } from "@/components/shared/ui";
import { deleteProfile, exportProfile, loadProfile } from "@/lib/store";
import { useSubmissionChannels } from "@/lib/deployment";

export default function PrivacyClient() {
  const { t, tList } = useI18n();
  const [hasProfile, setHasProfile] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const channels = useSubmissionChannels();

  useEffect(() => {
    setHasProfile(Boolean(loadProfile()));
  }, []);

  const handleExport = () => {
    const json = exportProfile();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "miraipath-profile-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    deleteProfile();
    setHasProfile(false);
    setDeleted(true);
    setConfirming(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Badge tone="positive">
        <ShieldCheck className="h-3 w-3" aria-hidden /> {t("privacy.badge")}
      </Badge>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{t("privacy.title")}</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">{t("privacy.intro")}</p>

      {/* Generated from the live deployment configuration — never hand-written,
          so this page can't contradict what the forms actually do. */}
      <Card className="mt-8 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Server className="h-4 w-4 text-electric" aria-hidden /> {t("privacy.deploymentTitle")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink">
          <li>• {t("privacy.channelProfileLocal")}</li>
          {channels.email === null && <li>• {t("privacy.deploymentChecking")}</li>}
          {channels.email === true && <li>• {t("privacy.channelFormsEmail")}</li>}
          {channels.database && <li>• {t("privacy.channelFormsDb")}</li>}
          {channels.email === false && !channels.database && (
            <li>• {t("privacy.channelFormsLocal")}</li>
          )}
        </ul>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink">{t("privacy.principlesTitle")}</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink">
          {tList("privacy.principles").map((p) => (
            <li key={p} className="flex gap-2.5">
              <span className="text-emerald-600" aria-hidden>✓</span> {p}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink">{t("privacy.neverTitle")}</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink">
          {tList("privacy.neverList").map((p) => (
            <li key={p} className="flex gap-2.5">
              <span className="text-red-500" aria-hidden>✕</span> {p}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink">{t("privacy.controlsTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("privacy.controlsBody")}</p>
        {deleted && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800" role="status">
            {t("privacy.deletedConfirm")}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport} disabled={!hasProfile}>
            <Download className="h-4 w-4" aria-hidden /> {t("privacy.export")}
          </Button>
          {!confirming ? (
            <Button variant="outline" onClick={() => setConfirming(true)} disabled={!hasProfile}>
              <Trash2 className="h-4 w-4" aria-hidden /> {t("privacy.delete")}
            </Button>
          ) : (
            <span className="flex items-center gap-2">
              <Button variant="danger" onClick={handleDelete}>
                {t("privacy.deleteConfirm")}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                {t("common.close")}
              </Button>
            </span>
          )}
        </div>
        {!hasProfile && !deleted && (
          <p className="mt-3 text-xs text-ink-soft">{t("privacy.noProfileNote")}</p>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink">{t("privacy.demoTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("privacy.demoBody")}</p>
      </Card>
    </div>
  );
}
