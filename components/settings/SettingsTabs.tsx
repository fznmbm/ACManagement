// components/settings/SettingsTabs.tsx
"use client";

import { useState } from "react";
import {
  Settings,
  Calendar,
  Bell,
  Users,
  Building2,
  Shield,
  Coins,
  Receipt,
  FileText,
  Lock,
} from "lucide-react";
import GeneralSettings from "./GeneralSettings";
import AcademicSettings from "./AcademicSettings";
import NotificationSettings from "./NotificationSettings";
import UserManagement from "./UserManagement";
import CentreSettings from "./CentreSettings";
import FineSettings from "./FineSettings";
import FeeSettings from "./FeeSettings";
import ApplicationSettings from "@/components/settings/ApplicationSettings";
import PasswordSettings from "@/components/settings/PasswordSettings";
// Add this import with the other imports
import OrphanedAuthCleanup from "@/components/admin/OrphanedAuthCleanup";

interface SettingsTabsProps {
  initialSettings: Record<string, any>;
  users: any[];
  currentUserId: string;
}

type TabId =
  | "general"
  | "academic"
  | "notifications"
  | "users"
  | "centre"
  | "fines"
  | "fees"
  | "applications"
  | "password"
  | "maintenance"; // ← ADD THIS

export default function SettingsTabs({
  initialSettings,
  users,
  currentUserId,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const tabs = [
    { id: "general" as TabId, name: "General", icon: Settings },
    { id: "academic" as TabId, name: "Academic", icon: Calendar },
    { id: "notifications" as TabId, name: "Notifications", icon: Bell },
    { id: "users" as TabId, name: "Users", icon: Users },
    { id: "centre" as TabId, name: "Centre Info", icon: Building2 },
    { id: "fines" as TabId, name: "Fine Settings", icon: Coins }, // Add this
    { id: "fees" as TabId, name: "Fee Settings", icon: Receipt }, // Add this

    {
      id: "applications" as TabId,
      name: "Applications Settings",
      icon: FileText,
    }, // Add this
    { id: "password" as TabId, name: "Password & Security", icon: Lock },
    { id: "maintenance" as TabId, name: "Maintenance", icon: Shield }, // ← ADD THIS
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
                onClick={() => setActiveTab(tab.id)}
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
      <div className="p-6">
        {activeTab === "general" && (
          <GeneralSettings settings={initialSettings} />
        )}
        {activeTab === "academic" && (
          <AcademicSettings settings={initialSettings} />
        )}
        {activeTab === "notifications" && (
          <NotificationSettings settings={initialSettings} />
        )}
        {activeTab === "users" && (
          <UserManagement users={users} currentUserId={currentUserId} />
        )}
        {activeTab === "centre" && (
          <CentreSettings settings={initialSettings} />
        )}
        {activeTab === "fines" && <FineSettings />}
        {activeTab === "fees" && <FeeSettings />}
        {activeTab === "applications" && <ApplicationSettings />}
        {activeTab === "password" && <PasswordSettings />}
        {activeTab === "maintenance" && <OrphanedAuthCleanup />}{" "}
        {/* ← ADD THIS */}
      </div>
    </div>
  );
}
