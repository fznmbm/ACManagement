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
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
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
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-1">Academic Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure academic year and grading preferences
              </p>
              <AcademicSettings settings={initialSettings} />
            </div>
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-1">
                Application Settings
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure enrolment deadlines and application form settings
              </p>
              <ApplicationSettings />
            </div>
          </div>
        )}

        {activeTab === "communication" && <CommunicationSettings />}

        {activeTab === "financial" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-1">Fee Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure fee structures and payment terms
              </p>
              <FeeSettings />
            </div>
            <div className="border-t pt-8">
              <FineSettings />
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Password & Security
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Update your password and security preferences
              </p>
              <PasswordSettings />
            </div>
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-1">Staff accounts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add, edit or remove staff logins on the Users page.
              </p>
              <Link
                href="/users"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
              >
                <Users className="h-4 w-4" />
                Manage staff accounts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-1">Maintenance</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Occasional cleanup tools — removing unused logins and clearing
                old message logs.
              </p>
              <div className="space-y-6">
                <OrphanedAuthCleanup />
                <MessageLogCleanup />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
