"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Save,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Users,
  User,
  GripVertical,
  X,
  Check,
} from "lucide-react";

interface Template {
  id: string;
  title: string;
  body: string;
  audience: "any" | "class" | "individual";
  is_active: boolean;
  sort_order: number;
}

interface CommSettings {
  greeting: string;
  sign_off: string;
}

export default function CommunicationSettings() {
  const supabase = createClient();

  const [settings, setSettings] = useState<CommSettings>({
    greeting: "Assalamu Alaikum",
    sign_off: "JazakAllahu Khairan",
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState<
    Omit<Template, "id" | "sort_order" | "is_active">
  >({
    title: "",
    body: "",
    audience: "any",
  });
  const [templateSaving, setTemplateSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, templatesRes] = await Promise.all([
        supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "communication_settings")
          .single(),
        supabase
          .from("message_templates")
          .select("*")
          .order("sort_order", { ascending: true }),
      ]);

      if (settingsRes.data?.setting_value) {
        const val =
          typeof settingsRes.data.setting_value === "string"
            ? JSON.parse(settingsRes.data.setting_value)
            : settingsRes.data.setting_value;
        setSettings({
          greeting: val.greeting || "",
          sign_off: val.sign_off || "",
        });
      }

      if (templatesRes.data) {
        setTemplates(templatesRes.data);
      }
    } catch (err) {
      console.error("Error fetching communication settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .update({
          setting_value: JSON.stringify(settings),
        })
        .eq("setting_key", "communication_settings");

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const saveTemplate = async (
    template: Omit<Template, "id" | "sort_order" | "is_active">,
  ) => {
    setTemplateSaving(true);
    try {
      const maxOrder = templates.reduce(
        (max, t) => Math.max(max, t.sort_order),
        0,
      );
      const { data, error } = await supabase
        .from("message_templates")
        .insert({
          ...template,
          sort_order: maxOrder + 1,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setTemplates((prev) => [...prev, data]);
      setIsAdding(false);
      setNewTemplate({ title: "", body: "", audience: "any" });
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Failed to save template");
    } finally {
      setTemplateSaving(false);
    }
  };

  const updateTemplate = async (template: Template) => {
    setTemplateSaving(true);
    try {
      const { error } = await supabase
        .from("message_templates")
        .update({
          title: template.title,
          body: template.body,
          audience: template.audience,
          is_active: template.is_active,
        })
        .eq("id", template.id);

      if (error) throw error;
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? template : t)),
      );
      setEditingTemplate(null);
    } catch (err) {
      console.error("Error updating template:", err);
      alert("Failed to update template");
    } finally {
      setTemplateSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Failed to delete template");
    }
  };

  const toggleActive = async (template: Template) => {
    const updated = { ...template, is_active: !template.is_active };
    await updateTemplate(updated);
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case "class":
        return "Whole class";
      case "individual":
        return "Individual";
      default:
        return "Any";
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "class":
        return <Users className="h-3.5 w-3.5" />;
      case "individual":
        return <User className="h-3.5 w-3.5" />;
      default:
        return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  const previewBody = (body: string) => {
    return body
      .replace(/\{greeting\}/g, settings.greeting || "{greeting}")
      .replace(/\{sign_off\}/g, settings.sign_off || "{sign_off}");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting & Sign-off */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Message defaults</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Default greeting and sign-off used in message templates. Templates use{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            {"{greeting}"}
          </code>{" "}
          and{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            {"{sign_off}"}
          </code>{" "}
          placeholders that get replaced with these values.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Greeting</label>
            <input
              type="text"
              value={settings.greeting}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, greeting: e.target.value }))
              }
              placeholder="e.g. Assalamu Alaikum"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sign-off</label>
            <input
              type="text"
              value={settings.sign_off}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, sign_off: e.target.value }))
              }
              placeholder="e.g. JazakAllahu Khairan"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save defaults"}
          </button>
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Templates */}
      <div className="border-t pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Message templates</h3>
            <p className="text-sm text-muted-foreground">
              Reusable templates for common messages. Available in the compose
              screen.
            </p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add template
            </button>
          )}
        </div>

        {/* Add new template form */}
        {isAdding && (
          <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3">New template</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Template name
                </label>
                <input
                  type="text"
                  value={newTemplate.title}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="e.g. Ramadan timetable change"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Audience
                </label>
                <select
                  value={newTemplate.audience}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      audience: e.target.value as
                        | "any"
                        | "class"
                        | "individual",
                    }))
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="any">Any (class or individual)</option>
                  <option value="class">Whole class only</option>
                  <option value="individual">Individual student only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Message body
                </label>
                <p className="text-xs text-muted-foreground mb-1">
                  Use{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    {"{greeting}"}
                  </code>{" "}
                  and{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    {"{sign_off}"}
                  </code>{" "}
                  for automatic greeting/sign-off. Use{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    [bracketed text]
                  </code>{" "}
                  for fields the admin fills in.
                </p>
                <textarea
                  value={newTemplate.body}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      body: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="{greeting}, your message here... {sign_off}."
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {newTemplate.body && (
                <div className="bg-background border border-border rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Preview
                  </p>
                  <p className="text-sm">{previewBody(newTemplate.body)}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveTemplate(newTemplate)}
                  disabled={
                    !newTemplate.title.trim() ||
                    !newTemplate.body.trim() ||
                    templateSaving
                  }
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  {templateSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save template
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTemplate({ title: "", body: "", audience: "any" });
                  }}
                  className="btn-outline text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template list */}
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg transition-colors ${
                template.is_active
                  ? "border-border bg-card"
                  : "border-border/50 bg-muted/20 opacity-60"
              }`}
            >
              {editingTemplate?.id === template.id ? (
                /* Inline edit form */
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Template name
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.title}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev ? { ...prev, title: e.target.value } : null,
                        )
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Audience
                    </label>
                    <select
                      value={editingTemplate.audience}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev
                            ? {
                                ...prev,
                                audience: e.target.value as
                                  | "any"
                                  | "class"
                                  | "individual",
                              }
                            : null,
                        )
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="any">Any (class or individual)</option>
                      <option value="class">Whole class only</option>
                      <option value="individual">
                        Individual student only
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Message body
                    </label>
                    <textarea
                      value={editingTemplate.body}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev ? { ...prev, body: e.target.value } : null,
                        )
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {editingTemplate.body && (
                    <div className="bg-background border border-border rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Preview
                      </p>
                      <p className="text-sm">
                        {previewBody(editingTemplate.body)}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateTemplate(editingTemplate)}
                      disabled={templateSaving}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      {templateSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save changes
                    </button>
                    <button
                      onClick={() => setEditingTemplate(null)}
                      className="btn-outline text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">
                          {template.title}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {getAudienceIcon(template.audience)}
                          {getAudienceLabel(template.audience)}
                        </span>
                        {!template.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {previewBody(template.body)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActive(template)}
                        className={`p-2 rounded-lg text-sm transition-colors ${
                          template.is_active
                            ? "hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600"
                            : "hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600"
                        }`}
                        title={
                          template.is_active
                            ? "Disable template"
                            : "Enable template"
                        }
                      >
                        {template.is_active ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingTemplate({ ...template })}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit template"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No templates yet</p>
              <p className="text-xs">
                Add your first template to speed up common messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
