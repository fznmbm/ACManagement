"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface ApplicationSettings {
  academic_year: string;
  minimum_age: number;
  current_terms_version: string;
}

interface ApplicationFormProps {
  settings: ApplicationSettings;
}

export default function ApplicationForm({ settings }: ApplicationFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data state
  const [formData, setFormData] = useState({
    // Student Information
    child_first_name: "",
    child_last_name: "",
    child_arabic_name: "",
    date_of_birth: "",
    gender: "",

    // Parent/Guardian Information
    parent_name: "",
    parent_relationship: "",
    parent_phone: "",
    parent_phone_alternate: "",
    parent_email: "",

    // Address
    address: "",
    city: "",
    postal_code: "",

    // Additional Information
    medical_conditions: "",
    special_requirements: "",
    can_read_write_english: true,

    // Photo Consent
    photo_consent: "",

    // Terms & Conditions
    terms_accepted: false,
    parent_declaration_accepted: false,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Student Information
      if (!formData.child_first_name.trim())
        newErrors.child_first_name = "First name is required";
      if (!formData.child_last_name.trim())
        newErrors.child_last_name = "Last name is required";
      if (!formData.date_of_birth)
        newErrors.date_of_birth = "Date of birth is required";
      if (!formData.gender) newErrors.gender = "Gender is required";

      // Age validation
      if (formData.date_of_birth) {
        const birthDate = new Date(formData.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        if (age < settings.minimum_age) {
          newErrors.date_of_birth = `Child must be at least ${settings.minimum_age} years old`;
        }
      }
    }

    if (step === 2) {
      // Parent/Guardian Information
      if (!formData.parent_name.trim())
        newErrors.parent_name = "Parent/Guardian name is required";
      if (!formData.parent_relationship)
        newErrors.parent_relationship = "Relationship is required";
      if (!formData.parent_phone.trim())
        newErrors.parent_phone = "Phone number is required";
      if (!formData.parent_email.trim())
        newErrors.parent_email = "Email is required";

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.parent_email && !emailRegex.test(formData.parent_email)) {
        newErrors.parent_email = "Invalid email address";
      }

      // Address
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.postal_code.trim())
        newErrors.postal_code = "Postal code is required";
      // English literacy check
      if (!formData.can_read_write_english) {
        newErrors.can_read_write_english =
          "Child should be able to read and write English. This is required for admission.";
      }
    }

    if (step === 3) {
      // Photo Consent
      if (!formData.photo_consent)
        newErrors.photo_consent = "Please select a consent option";
    }

    if (step === 4) {
      // Terms & Conditions
      if (!formData.terms_accepted)
        newErrors.terms_accepted = "You must accept the terms and conditions";
      if (!formData.parent_declaration_accepted)
        newErrors.parent_declaration_accepted =
          "You must accept the declaration";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          academic_year: settings.academic_year,
          terms_version: settings.current_terms_version,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to success page with application number
        router.push(`/apply/success?app_number=${data.application_number}`);
      } else {
        setErrors({ submit: data.error || "Failed to submit application" });
      }
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`flex items-center ${
                step < totalSteps ? "flex-1" : ""
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  step === currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : step < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-background text-muted-foreground"
                }`}
              >
                {step < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  step
                )}
              </div>
              {step < totalSteps && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    step < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Student</span>
          <span>Parent</span>
          <span>Consent</span>
          <span>Terms</span>
          <span>Review</span>
        </div>
      </div>

      {/* Form Steps */}
      <div className="bg-card border rounded-lg p-8">
        {/* Step 1: Student Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Student Information</h2>
              <p className="text-muted-foreground">
                Please provide details about the student
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.child_first_name}
                  onChange={(e) =>
                    updateFormData("child_first_name", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                    errors.child_first_name ? "border-destructive" : ""
                  }`}
                />
                {errors.child_first_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.child_first_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.child_last_name}
                  onChange={(e) =>
                    updateFormData("child_last_name", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                    errors.child_last_name ? "border-destructive" : ""
                  }`}
                />
                {errors.child_last_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.child_last_name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Arabic Name (Optional)
              </label>
              <input
                type="text"
                value={formData.child_arabic_name}
                onChange={(e) =>
                  updateFormData("child_arabic_name", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="e.g., أحمد"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Date of Birth <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    updateFormData("date_of_birth", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                    errors.date_of_birth ? "border-destructive" : ""
                  }`}
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.date_of_birth}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Student must be {settings.minimum_age} years or older
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Gender <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateFormData("gender", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                    errors.gender ? "border-destructive" : ""
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Parent/Guardian Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Parent/Guardian Information
              </h2>
              <p className="text-muted-foreground">
                Please provide your contact details
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.parent_name}
                  onChange={(e) =>
                    updateFormData("parent_name", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                    errors.parent_name ? "border-destructive" : ""
                  }`}
                />
                {errors.parent_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.parent_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Relationship to Student{" "}
                  <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.parent_relationship}
                  onChange={(e) =>
                    updateFormData("parent_relationship", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                    errors.parent_relationship ? "border-destructive" : ""
                  }`}
                >
                  <option value="">Select relationship</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
                {errors.parent_relationship && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.parent_relationship}
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number (Primary){" "}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) =>
                    updateFormData("parent_phone", e.target.value)
                  }
                  placeholder="07123456789"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                    errors.parent_phone ? "border-destructive" : ""
                  }`}
                />
                {errors.parent_phone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.parent_phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number (Alternate)
                </label>
                <input
                  type="tel"
                  value={formData.parent_phone_alternate}
                  onChange={(e) =>
                    updateFormData("parent_phone_alternate", e.target.value)
                  }
                  placeholder="07987654321"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={formData.parent_email}
                onChange={(e) => updateFormData("parent_email", e.target.value)}
                placeholder="example@email.com"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                  errors.parent_email ? "border-destructive" : ""
                }`}
              />
              {errors.parent_email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.parent_email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Address <span className="text-destructive">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                  errors.address ? "border-destructive" : ""
                }`}
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  City <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                    errors.city ? "border-destructive" : ""
                  }`}
                />
                {errors.city && (
                  <p className="text-sm text-destructive mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Postal Code <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) =>
                    updateFormData("postal_code", e.target.value)
                  }
                  placeholder="RH10 1XX"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                    errors.postal_code ? "border-destructive" : ""
                  }`}
                />
                {errors.postal_code && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.postal_code}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Medical Conditions / Allergies
              </label>
              <textarea
                value={formData.medical_conditions}
                onChange={(e) =>
                  updateFormData("medical_conditions", e.target.value)
                }
                rows={3}
                placeholder="Please list any medical conditions or allergies we should be aware of"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Special Requirements
              </label>
              <textarea
                value={formData.special_requirements}
                onChange={(e) =>
                  updateFormData("special_requirements", e.target.value)
                }
                rows={3}
                placeholder="Any additional information or special requirements"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_read_write_english}
                  onChange={(e) =>
                    updateFormData("can_read_write_english", e.target.checked)
                  }
                  className="mt-1 mr-3"
                />
                <span className="text-sm">
                  I confirm that my child can read and write English fluently.
                  <span className="text-muted-foreground">
                    {" "}
                    (Required as per Terms & Conditions)
                  </span>
                </span>
              </label>
            </div>
            {errors.can_read_write_english && (
              <p className="text-sm text-destructive mt-2">
                {errors.can_read_write_english}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Photo/Video Consent */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Photo & Video Consent</h2>
              <p className="text-muted-foreground">
                We would like permission to take photos/videos of your child for
                our publicity
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="text-sm mb-4">Photos and videos may be used for:</p>
              <ul className="text-sm space-y-2 mb-6">
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Printed and online publicity materials</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Social media posts (Facebook, Instagram, etc.)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Fundraising and promotional activities</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Website and newsletters</span>
                </li>
              </ul>

              <div className="space-y-3">
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-background transition-colors">
                  <input
                    type="radio"
                    name="photo_consent"
                    value="both"
                    checked={formData.photo_consent === "both"}
                    onChange={(e) =>
                      updateFormData("photo_consent", e.target.value)
                    }
                    className="mr-3"
                  />
                  <span className="font-medium">
                    Photographs and Video - I give permission for both
                  </span>
                </label>

                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-background transition-colors">
                  <input
                    type="radio"
                    name="photo_consent"
                    value="photographs"
                    checked={formData.photo_consent === "photographs"}
                    onChange={(e) =>
                      updateFormData("photo_consent", e.target.value)
                    }
                    className="mr-3"
                  />
                  <span className="font-medium">Photographs only</span>
                </label>

                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-background transition-colors">
                  <input
                    type="radio"
                    name="photo_consent"
                    value="video"
                    checked={formData.photo_consent === "video"}
                    onChange={(e) =>
                      updateFormData("photo_consent", e.target.value)
                    }
                    className="mr-3"
                  />
                  <span className="font-medium">Video only</span>
                </label>

                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-background transition-colors">
                  <input
                    type="radio"
                    name="photo_consent"
                    value="none"
                    checked={formData.photo_consent === "none"}
                    onChange={(e) =>
                      updateFormData("photo_consent", e.target.value)
                    }
                    className="mr-3"
                  />
                  <span className="font-medium">
                    None - I do not give permission
                  </span>
                </label>
              </div>

              {errors.photo_consent && (
                <p className="text-sm text-destructive mt-2">
                  {errors.photo_consent}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              You can withdraw this consent at any time by contacting us. This
              will not affect your child's enrollment.
            </p>
          </div>
        )}

        {/* Step 4: Terms & Conditions */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Terms & Conditions</h2>
              <p className="text-muted-foreground">
                Please read and accept the terms and conditions
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-4">
                Al Hikmah Institute Crawley - Terms and Conditions
              </h3>
              <ol className="space-y-3 text-sm">
                <li>1. Applicants must be seven years or older.</li>
                <li>2. Must be able to read and write English fluently.</li>
                <li>
                  3. Children should arrive at class at least five minutes
                  before the scheduled time.
                </li>
                <li>
                  4. Late arrivals beyond the scheduled time will incur a £5
                  penalty charge.
                </li>
                <li>
                  5. Attendance is mandatory for every class, except in the case
                  of medical reasons.
                </li>
                <li>
                  6. If a student is absent, a £10 penalty will apply unless a
                  valid medical reason is provided.
                </li>
                <li>
                  7. If a child is absent for more than two classes without a
                  valid reason (e.g., medical), their enrollment will be
                  terminated.
                </li>
                <li>
                  8. Classes will be held only during school term times. (No
                  classes during school holidays or the month of Ramadan.)
                </li>
                <li>9. Holidays cannot be taken during term time.</li>
                <li>10. Parents must attend regular parent meetings.</li>
                <li>
                  11. Parents must check their child's notebook regularly and
                  acknowledge it with their signature.
                </li>
              </ol>
              <p className="mt-4 text-sm italic">
                May Allah help all of us to succeed in this Noble Course
              </p>
            </div>

            <div className="space-y-4">
              <div
                className={`p-4 border-2 rounded-lg ${
                  errors.terms_accepted ? "border-destructive" : ""
                }`}
              >
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.terms_accepted}
                    onChange={(e) =>
                      updateFormData("terms_accepted", e.target.checked)
                    }
                    className="mt-1 mr-3"
                  />
                  <span className="text-sm">
                    <strong>I accept the Terms and Conditions</strong>
                    <br />
                    <span className="text-muted-foreground">
                      I have read and agree to comply with all the rules and
                      regulations of Al Hikmah Institute Crawley
                    </span>
                  </span>
                </label>
                {errors.terms_accepted && (
                  <p className="text-sm text-destructive mt-2">
                    {errors.terms_accepted}
                  </p>
                )}
              </div>

              <div
                className={`p-4 border-2 rounded-lg ${
                  errors.parent_declaration_accepted ? "border-destructive" : ""
                }`}
              >
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.parent_declaration_accepted}
                    onChange={(e) =>
                      updateFormData(
                        "parent_declaration_accepted",
                        e.target.checked
                      )
                    }
                    className="mt-1 mr-3"
                  />
                  <span className="text-sm">
                    <strong>Parent/Guardian Declaration</strong>
                    <br />
                    <span className="text-muted-foreground">
                      I hereby declare that the above information is true and
                      correct and I give permission for my child to attend the
                      Islamic class
                    </span>
                  </span>
                </label>
                {errors.parent_declaration_accepted && (
                  <p className="text-sm text-destructive mt-2">
                    {errors.parent_declaration_accepted}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Review Your Application
              </h2>
              <p className="text-muted-foreground">
                Please review all information before submitting
              </p>
            </div>

            {/* Student Info Summary */}
            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                Student Information
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </button>
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Name:</dt>
                <dd className="font-medium">
                  {formData.child_first_name} {formData.child_last_name}
                </dd>

                {formData.child_arabic_name && (
                  <>
                    <dt className="text-muted-foreground">Arabic Name:</dt>
                    <dd className="font-medium">
                      {formData.child_arabic_name}
                    </dd>
                  </>
                )}

                <dt className="text-muted-foreground">Date of Birth:</dt>
                <dd className="font-medium">
                  {new Date(formData.date_of_birth).toLocaleDateString("en-GB")}
                </dd>

                <dt className="text-muted-foreground">Gender:</dt>
                <dd className="font-medium capitalize">{formData.gender}</dd>
              </dl>
            </div>

            {/* Parent Info Summary */}
            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                Parent/Guardian Information
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </button>
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Name:</dt>
                <dd className="font-medium">{formData.parent_name}</dd>

                <dt className="text-muted-foreground">Relationship:</dt>
                <dd className="font-medium">{formData.parent_relationship}</dd>

                <dt className="text-muted-foreground">Phone:</dt>
                <dd className="font-medium">{formData.parent_phone}</dd>

                <dt className="text-muted-foreground">Email:</dt>
                <dd className="font-medium">{formData.parent_email}</dd>

                <dt className="text-muted-foreground">Address:</dt>
                <dd className="font-medium">
                  {formData.address}, {formData.city}, {formData.postal_code}
                </dd>
              </dl>
            </div>

            {/* Consent Summary */}
            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                Consents & Declarations
                <div className="space-x-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-sm text-primary hover:underline"
                  >
                    Edit Consent
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="text-sm text-primary hover:underline"
                  >
                    Edit Terms
                  </button>
                </div>
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span>
                    Photo/Video Consent:{" "}
                    <strong className="capitalize">
                      {formData.photo_consent}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span>Terms & Conditions Accepted</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span>Parent Declaration Accepted</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                  <span>English Literacy Confirmed</span>
                </div>
              </dl>
            </div>

            {errors.submit && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 border-2 border-muted-foreground/30 rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          )}

          <div className="ml-auto">
            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <CheckCircle2 className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
