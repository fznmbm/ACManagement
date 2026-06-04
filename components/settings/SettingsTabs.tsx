"use client";

import { useState } from "react";
import { Building2, Calendar, Receipt, Shield } from "lucide-react";
import AcademicSettings from "./AcademicSettings";
import CentreSettings from "./CentreSettings";
import FeeSettings from "./FeeSettings";
import FineSettings from "./FineSettings";
import PasswordSettings from "./PasswordSettings";
import UserManagement from "./UserManagement";
import OrphanedAuthCleanup from "@/components/admin/OrphanedAuthCleanup";

interface SettingsTabsProps {
  initialSettings: Record<string, any>;
  users: any[];
  currentUserId: string;
}

type TabId = "centre" | "academic" | "financial" | "security";

export default function SettingsTabs({
  initialSettings,
  users,
  currentUserId,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("centre");

  const tabs = [
    { id: "centre" as TabId, name: "Centre Info", icon: Building2 },
    { id: "academic" as TabId, name: "Academic", icon: Calendar },
    { id: "financial" as TabId, name: "Financial", icon: Receipt },
    { id: "security" as TabId, name: "Security & Users", icon: Shield },
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
        {activeTab === "centre" && (
          <CentreSettings settings={initialSettings} />
        )}

        {activeTab === "academic" && (
          <AcademicSettings settings={initialSettings} />
        )}

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
              <h3 className="text-lg font-semibold mb-1">Fine Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure fine types and default amounts
              </p>
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
              <h3 className="text-lg font-semibold mb-1">User Management</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage admin and teacher accounts
              </p>
              <UserManagement users={users} currentUserId={currentUserId} />
            </div>
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-1">Maintenance</h3>
              <p className="text-sm text-muted-foreground mb-4">
                System cleanup and maintenance tools
              </p>
              <OrphanedAuthCleanup />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
