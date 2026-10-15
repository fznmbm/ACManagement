// components/settings/CentreSettings.tsx
"use client";

import { useState } from "react";
import {
  Save,
  Loader2,
  Building2,
  Phone,
  MapPin,
  Share2,
  Image as ImageIcon,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CentreSettingsProps {
  settings: Record<string, any>;
}

/**
 * A collapsible settings group. Collapsed by default on mobile (so the Centre
 * tab isn't one long scroll); on desktop (md+) the toggle is inert and content
 * is always shown. Collapsed inputs stay in the DOM, so they still save.
 */
function Group({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-left md:cursor-default"
      >
        <span className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 shrink-0" />
          {title}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform md:hidden ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div className={`${open ? "block" : "hidden"} px-4 pb-4 md:block`}>
        {children}
      </div>
    </div>
  );
}

export default function CentreSettings({ settings }: CentreSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const centreInfo = settings.centre_info || {};

  const [logoUrl, setLogoUrl] = useState(centreInfo.logo_url || "");
  const [sealUrl, setSealUrl] = useState(centreInfo.seal_url || "");

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const form = document.querySelector("form");
      if (!form) {
        throw new Error("Form not found");
      }

      const formDataObj = new FormData(form);
      const generalData: Record<string, any> = {};
      const operatingHours: Record<string, any> = {};

      [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ].forEach((day) => {
        operatingHours[`operating_${day}`] = false;
      });

      formDataObj.forEach((value, key) => {
        if (key.startsWith("operating_") || key.startsWith("hours_")) {
          if (key.startsWith("operating_")) {
            operatingHours[key] = true;
          } else {
            operatingHours[key] = value;
          }
        } else {
          generalData[key] = value;
        }
      });

      generalData.logo_url = logoUrl;
      generalData.seal_url = sealUrl;

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "centre_info", data: generalData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save general settings");
      }

      const hoursResponse = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "operating_hours",
          data: operatingHours,
        }),
      });

      if (!hoursResponse.ok) {
        const errorData = await hoursResponse.json();
        throw new Error(errorData.error || "Failed to save operating hours");
      }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Centre Information</h3>
        <p className="text-sm text-muted-foreground">
          Configure your centre details
        </p>
      </div>

      <form className="space-y-4">
        {/* Basic Information */}
        <Group title="Basic Information" icon={Building2} defaultOpen>
          <div>
            <label className="form-label">Centre Name</label>
            <input
              type="text"
              name="centre_name"
              defaultValue={centreInfo.centre_name}
              className="form-input"
              placeholder="Al Hikmah Institute"
            />
          </div>
        </Group>

        {/* Contact Information */}
        <Group title="Contact Information" icon={Phone}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Primary Phone</label>
              <input
                type="tel"
                name="phone"
                defaultValue={centreInfo.phone}
                className="form-input"
                placeholder="+44 7411 061242"
              />
            </div>
            <div>
              <label className="form-label">Secondary Phone</label>
              <input
                type="tel"
                name="phone_secondary"
                defaultValue={centreInfo.phone_secondary}
                className="form-input"
                placeholder="+44 7738 314404"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={centreInfo.email}
                className="form-input"
                placeholder="alhikmahinstitutecrawley@gmail.com"
              />
            </div>
            <div>
              <label className="form-label">Website</label>
              <input
                type="url"
                name="website"
                defaultValue={centreInfo.website}
                className="form-input"
                placeholder="https://www.al-hikmah.org"
              />
            </div>
          </div>
        </Group>

        {/* Address */}
        <Group title="Address" icon={MapPin}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Street Address</label>
              <input
                type="text"
                name="address"
                defaultValue={centreInfo.address}
                className="form-input"
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  defaultValue={centreInfo.city}
                  className="form-input"
                  placeholder="Crawley"
                />
              </div>
              <div>
                <label className="form-label">County</label>
                <input
                  type="text"
                  name="county"
                  defaultValue={centreInfo.county}
                  className="form-input"
                  placeholder="West Sussex"
                />
              </div>
              <div>
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  defaultValue={centreInfo.postal_code}
                  className="form-input"
                  placeholder="RH10 1AA"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Country</label>
              <select
                name="country"
                defaultValue={centreInfo.country || "UK"}
                className="form-input"
              >
                <option value="UK">United Kingdom</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="SA">Saudi Arabia</option>
                <option value="AE">United Arab Emirates</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </Group>

        {/* Social Media */}
        <Group title="Social Media Links" icon={Share2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Facebook</label>
              <input
                type="url"
                name="facebook"
                defaultValue={centreInfo.facebook}
                className="form-input"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <label className="form-label">Instagram</label>
              <input
                type="url"
                name="instagram"
                defaultValue={centreInfo.instagram}
                className="form-input"
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
          </div>
        </Group>

        {/* Logo & Branding */}
        <Group title="Logo & Branding" icon={ImageIcon}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Centre Logo */}
            <div className="space-y-3">
              <label className="form-label">Centre Logo</label>
              {logoUrl && (
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <img
                    src={logoUrl}
                    alt="Centre Logo"
                    className="h-20 w-20 object-contain"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Logo</p>
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="text-xs text-destructive hover:underline mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="form-input"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: PNG or SVG, 200×200px, transparent background
              </p>
            </div>

            {/* Official Seal */}
            <div className="space-y-3">
              <label className="form-label">Official Seal / Stamp</label>
              {sealUrl && (
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <img
                    src={sealUrl}
                    alt="Official Seal"
                    className="h-20 w-20 object-contain"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Seal</p>
                    <button
                      type="button"
                      onClick={() => setSealUrl("")}
                      className="text-xs text-destructive hover:underline mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              <input
                type="url"
                value={sealUrl}
                onChange={(e) => setSealUrl(e.target.value)}
                className="form-input"
                placeholder="https://example.com/seal.png"
              />
              <p className="text-xs text-muted-foreground">
                Used on certificates. Recommended: PNG, circular design,
                200×200px
              </p>
            </div>
          </div>
        </Group>

        {/* Operating Hours */}
        <Group title="Operating Hours" icon={Clock}>
          <div className="space-y-3">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => {
              const dayLower = day.toLowerCase();
              const operatingHours = settings.operating_hours || {};
              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2"
                >
                  <div className="w-28">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name={`operating_${dayLower}`}
                        defaultChecked={
                          operatingHours[`operating_${dayLower}`] !== undefined
                            ? operatingHours[`operating_${dayLower}`]
                            : day !== "Sunday"
                        }
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">{day}</span>
                    </label>
                  </div>
                  <input
                    type="time"
                    name={`hours_${dayLower}_start`}
                    defaultValue={
                      operatingHours[`hours_${dayLower}_start`] || "09:00"
                    }
                    className="form-input w-28 text-sm"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    type="time"
                    name={`hours_${dayLower}_end`}
                    defaultValue={
                      operatingHours[`hours_${dayLower}_end`] || "17:00"
                    }
                    className="form-input w-28 text-sm"
                  />
                </div>
              );
            })}
          </div>
        </Group>
      </form>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        {saved && (
          <span className="text-sm text-green-600">✓ Settings saved</span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
