"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import {
  Building2,
  Calendar,
  Receipt,
  Shield,
  MessageCircle,
  Users,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import AcademicSettings from "./AcademicSettings";
import ApplicationSettings from "./ApplicationSettings";
import CentreSettings from "./CentreSettings";
import CommunicationSettings from "./CommunicationSettings";
import FeeSettings from "./FeeSettings";
import FineSettings from "./FineSettings";
import PasswordSettings from "./PasswordSettings";
import OrphanedAuthCleanup from "@/components/admin/OrphanedAuthCleanup";
import MessageLogCleanup from "@/components/admin/MessageLogCleanup";

interface SettingsTabsProps {
  initialSettings: Record<string, any>;
}

/**
 * A settings sub-section. On mobile it's a collapsible accordion row (collapsed
 * by default — so a tab with 2–3 sub-sections isn't one endless scroll). On
 * desktop (md+) the toggle is hidden and the content is always shown, so the
 * desktop layout is unchanged. `selfTitled` omits the desktop heading when the
 * child already renders its own (e.g. FineSettings).
 */
function Section({
  title,
  description,
  selfTitled,
  children,
}: {
  title: string;
  description?: string;
  selfTitled?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-4 first:pt-0 md:py-0">
      {/* Mobile accordion toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left md:hidden"
      >
        <span className="min-w-0">
          <span className="block font-semibold">{title}</span>
          {description && (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Desktop heading (omitted when the child self-titles) */}
      {!selfTitled && (
        <div className="hidden md:block">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
          )}
        </div>
      )}

      {/* Content: collapsed on mobile until opened; always shown on desktop */}
      <div className={`${open ? "block pt-4" : "hidden"} md:block md:pt-0`}>
        {children}
      </div>
    </div>
  );
}

type TabId = "centre" | "academic" | "communication" | "financial" | "security";

export default function SettingsTabs({ initialSettings }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("centre");
  const [dirty, setDirty] = useState(false);
  const { confirm } = useToast();

  // Warn before a full page close/navigation while there are unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Edits inside a tab bubble up here (inputs/selects/textareas). A Save/Update
  // click clears the flag so saving then switching doesn't nag.
  const markDirty = () => setDirty(true);
  const maybeClearOnSave = (e: React.MouseEvent) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (btn && /sav|update|create|add/i.test(btn.textContent || "")) {
      setTimeout(() => setDirty(false), 50);
    }
  };

  const switchTab = async (id: TabId) => {
    if (id === activeTab) return;
    if (
      dirty &&
      !(await confirm({
        title: "Unsaved changes",
        message:
          "You've edited this tab but haven't saved. Switch tabs and lose those changes?",
        confirmText: "Switch anyway",
        cancelText: "Stay",
        destructive: true,
      }))
    )
      return;
    setActiveTab(id);
    setDirty(false);
  };

  const tabs = [
    { id: "centre" as TabId, name: "Centre Info", icon: Building2 },
    { id: "academic" as TabId, name: "Academic", icon: Calendar },
    {
      id: "communication" as TabId,
      name: "Communication",
      icon: MessageCircle,
    },
    { id: "financial" as TabId, name: "Financial", icon: Receipt },
    { id: "security" as TabId, name: "Security", icon: Shield },
  ];
  return (
    <div
      suppressHydrationWarning
      className="bg-card border border-border rounded-lg overflow-hidden"
    >
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 md:px-6 md:py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div
        className="p-3 md:p-6"
        onInput={markDirty}
        onChange={markDirty}
        onClickCapture={maybeClearOnSave}
      >
        {activeTab === "centre" && (
          <CentreSettings settings={initialSettings} />
        )}

        {activeTab === "academic" && (
          <div className="divide-y divide-border md:space-y-8 md:divide-y-0">
            <Section
              title="Academic Settings"
              description="Configure academic year and grading preferences"
            >
              <AcademicSettings settings={initialSettings} />
            </Section>
            <Section
              title="Application Settings"
              description="Configure enrolment deadlines and application form settings"
            >
              <ApplicationSettings />
            </Section>
          </div>
        )}

        {activeTab === "communication" && <CommunicationSettings />}

        {activeTab === "financial" && (
          <div className="divide-y divide-border md:space-y-8 md:divide-y-0">
            <Section
              title="Fee Settings"
              description="Configure fee structures and payment terms"
            >
              <FeeSettings />
            </Section>
            <Section
              title="Fine Settings"
              description="Automatic fine amounts for late / absent attendance"
            >
              <FineSettings />
            </Section>
          </div>
        )}

        {activeTab === "security" && (
          <div className="divide-y divide-border md:space-y-8 md:divide-y-0">
            <Section
              title="Password & Security"
              description="Update your password and security preferences"
            >
              <PasswordSettings />
            </Section>
            <Section
              title="Staff accounts"
              description="Add, edit or remove staff logins on the Users page."
            >
              <Link
                href="/users"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
              >
                <Users className="h-4 w-4" />
                Manage staff accounts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Section>
            <Section
              title="Maintenance"
              description="Occasional cleanup tools — removing unused logins and clearing old message logs."
            >
              <div className="space-y-6">
                <OrphanedAuthCleanup />
                <MessageLogCleanup />
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
