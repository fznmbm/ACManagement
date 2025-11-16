// components/settings/CentreSettings.tsx
"use client";

import { useState } from "react";
import {
  Save,
  Loader2,
  Upload,
  Building2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CentreSettingsProps {
  settings: Record<string, any>;
}

export default function CentreSettings({ settings }: CentreSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const centreInfo = settings.centre_info || {
    name: "Al-Noor Islamic Centre",
    arabic_name: "مركز النور الإسلامي",
  };

  const [logoUrl, setLogoUrl] = useState(centreInfo.logo_url || "");
  const [sealUrl, setSealUrl] = useState(centreInfo.seal_url || "");

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      // Get all form values from the DOM
      const form = document.querySelector("form") || document.body;
      const formElements = form.querySelectorAll("input, select, textarea");

      // Collect all form data
      const formData = {
        ...centreInfo,
        logo_url: logoUrl,
        seal_url: sealUrl,
      };

      // Collect all form field values
      formElements.forEach((element: any) => {
        if (element.name) {
          formData[element.name] = element.value;
        }
      });

      // Save to database (you'll need to implement the actual save logic)
      const response = await fetch("/api/settings/centre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save");

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Centre Information</h3>
        <p className="text-sm text-muted-foreground">
          Configure your madrasa or Islamic centre details
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-4 flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Basic Information</span>
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Centre Name (English)</label>
                <input
                  type="text"
                  defaultValue={centreInfo.name}
                  className="form-input"
                  placeholder="Al-Noor Islamic Centre"
                />
              </div>
              <div>
                <label className="form-label">Centre Name (Arabic)</label>
                <input
                  type="text"
                  defaultValue={centreInfo.arabic_name}
                  className="form-input rtl"
                  placeholder="مركز النور الإسلامي"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                defaultValue={centreInfo.description}
                placeholder="Brief description of your centre..."
              />
            </div>

            <div>
              <label className="form-label">Registration Number</label>
              <input
                type="text"
                defaultValue={centreInfo.registration_number}
                className="form-input"
                placeholder="Charity/Organization registration number"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-4 flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Contact Information</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Primary Phone</label>
              <input
                type="tel"
                defaultValue={centreInfo.phone}
                className="form-input"
                placeholder="+44 20 1234 5678"
              />
            </div>
            <div>
              <label className="form-label">Secondary Phone</label>
              <input
                type="tel"
                defaultValue={centreInfo.phone_secondary}
                className="form-input"
                placeholder="+44 20 8765 4321"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                defaultValue={centreInfo.email}
                className="form-input"
                placeholder="info@alnoor.org"
              />
            </div>
            <div>
              <label className="form-label">Website</label>
              <input
                type="url"
                defaultValue={centreInfo.website}
                className="form-input"
                placeholder="https://www.alnoor.org"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-4 flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Address</span>
          </h4>
          <div className="space-y-4">
            <div>
              <label className="form-label">Street Address</label>
              <input
                type="text"
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
                  defaultValue={centreInfo.city}
                  className="form-input"
                  placeholder="London"
                />
              </div>
              <div>
                <label className="form-label">County/State</label>
                <input
                  type="text"
                  defaultValue={centreInfo.county}
                  className="form-input"
                  placeholder="Greater London"
                />
              </div>
              <div>
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  defaultValue={centreInfo.postal_code}
                  className="form-input"
                  placeholder="SW1A 1AA"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Country</label>
              <select className="form-input">
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
        </div>

        {/* Social Media */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-4">Social Media Links</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Facebook</label>
              <input
                type="url"
                defaultValue={centreInfo.facebook}
                className="form-input"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <label className="form-label">Twitter/X</label>
              <input
                type="url"
                defaultValue={centreInfo.twitter}
                className="form-input"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            <div>
              <label className="form-label">Instagram</label>
              <input
                type="url"
                defaultValue={centreInfo.instagram}
                className="form-input"
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
            <div>
              <label className="form-label">YouTube</label>
              <input
                type="url"
                defaultValue={centreInfo.youtube}
                className="form-input"
                placeholder="https://youtube.com/yourchannel"
              />
            </div>
          </div>
        </div>

        {/* Logo & Branding */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-4">Logo & Branding</h4>

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
                Recommended: PNG or SVG, 200x200px, transparent background
              </p>
            </div>

            {/* Official Seal */}
            <div className="space-y-3">
              <label className="form-label">Official Seal/Stamp</label>

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
                200x200px
              </p>
            </div>
          </div>

          {/* Primary Color - Keep this existing part */}
          <div className="mt-6">
            <label className="form-label">Primary Color</label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                defaultValue="#22c55e"
                className="h-10 w-20 rounded border border-input cursor-pointer"
              />
              <input
                type="text"
                defaultValue="#22c55e"
                className="form-input flex-1"
                placeholder="#22c55e"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Used for buttons, links, and highlights
            </p>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-4">Operating Hours</h4>
          <div className="space-y-3">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-32">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      defaultChecked={day !== "Sunday"}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">{day}</span>
                  </label>
                </div>
                <input
                  type="time"
                  defaultValue="09:00"
                  className="form-input w-32 text-sm"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="time"
                  defaultValue="17:00"
                  className="form-input w-32 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        {saved && (
          <span className="text-sm text-green-600">
            ✓ Settings saved successfully!
          </span>
        )}
        <button
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
