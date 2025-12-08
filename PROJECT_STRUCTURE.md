# Project Structure for ACManagement (SchoolRegister)

This file documents the current project structure and all files/folders. Regenerated from the workspace on December 7, 2025.

## Root Configuration Files

```
.env.example
.gitignore
Excellent.docx
GITHUB_RAW_LINKS.md
PROJECT_STRUCTURE.md
middleware.ts
middleware copy.ts
next-env.d.ts
next.config.js
package-lock.json
package.json
postcss.config.js
tailwind.config.ts
tsconfig.json
vercel.json
```

## Styles

```
styles/
  globals.css
```

## Types

```
types/
  fees.ts
  fees copy.ts
  fines.ts
  fines copy.ts
```

## Logos / Assets

```
logo/
  ahlogo.jpg
  ahseal.png
```

## Supabase Migrations

```
supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
    003_seed.sql
    004_memorization_certificates.sql
    005_fine-setup.sql
    006_fee_management.sql
    007_applications_and_parent_portal.sql
    008_messages system.sql
    009_notification_system.sql
    010_automated_alerts.sql
```

## App Directory (Next.js App Router)

### Root Pages
```
app/
  layout.tsx
  page.tsx
  hooks/
    useFines.ts
```

### Public Routes
```
app/(public)/
  layout.tsx
  home/page.tsx
  about/page.tsx
  contact/page.tsx
  programs/page.tsx
  apply/
    page.tsx
    success/page.tsx
```

### Auth Routes
```
app/(auth)/
  layout.tsx
  login/page.tsx
```

### Parent Routes
```
app/(parent)/
  layout.tsx
  parent/
    profile/page.tsx
    dashboard/page.tsx
    children/page.tsx
    finances/page.tsx
    applications/page.tsx
    student/[id]/page.tsx
    messages/page.tsx
    notifications/page.tsx
    events/page.tsx
```

### Legacy Parent Routes
```
app/parent/
  login/page.tsx
  set-password/page.tsx
```

### Dashboard Routes
```
app/(dashboard)/
  layout.tsx
  dashboard/page.tsx
  attendance/
    page.tsx
    history/page.tsx
  classes/
    page.tsx
    new/page.tsx
    [id]/
      page.tsx
      edit/page.tsx
      feedback/page.tsx
  students/
    page.tsx
    new/page.tsx
    link-parents/page.tsx
    [id]/
      page.tsx
      edit/page.tsx
  fees/page.tsx
  fines/page.tsx
  messages/page.tsx
  messages/history/page.tsx
  events/page.tsx
  reports/page.tsx
  settings/page.tsx
  alerts/page.tsx
  applications/
    page.tsx
    [id]/page.tsx
```

### Curriculum Assessment Routes
```
app/(dashboard)/curriculum-assessment/
  page.tsx
  assessments/
    page.tsx
    new/page.tsx
  certificates/
    page.tsx
    generate/page.tsx
    view/page.tsx
  subjects/
    page.tsx
    new/page.tsx
    [id]/
      page.tsx
      edit/page.tsx
  memorization/
    page.tsx
    new/page.tsx
    track/page.tsx
```

### API Routes
```
app/api/
  admin/
    create-parent-account/route.ts
  alerts/
    check/route.ts
  applications/
    submit/route.ts
    [id]/
      accept/route.ts
      reject/route.ts
      status/route.ts
  contact/
    submit/route.ts
  cron/
    daily-alerts/route.ts
  debug/
    cookies/route.ts
  feedback/
    send/route.ts
  fees/
    generate-invoices/
      route.ts
      route copy.ts
  messages/
    send/route.ts
    templates/route.ts
  notifications/
    route.ts
    read/route.ts
  parent/
    send-login-details/route.ts
    invoice/[invoiceId]/download/route.ts
    fine/[fineId]/download/route.ts
  settings/
    route.ts
    centre/route.ts
```

## Components

### Layout Components
```
components/
  layout/
    Header.tsx
    Sidebar.tsx
  providers/
    ThemeProvider.tsx
  ui/
    ThemeToggle.tsx
```

### Alerts & Notifications
```
components/
  alerts/
    AlertManagement.tsx
  notifications/
    ParentNotificationCenter.tsx
```

### Attendance Components
```
components/
  attendance/
    AttendanceFilters.tsx
    AttendanceHistoryTable.tsx
    AttendanceMarkingInterface.tsx
```

### Applications Components
```
components/
  applications/
    ApplicationsHeader.tsx
    ApplicationsTable.tsx
    ApplicationActions.tsx
    AcademicYearSelector.tsx
```

### Classes Components
```
components/
  classes/
    ClassesHeader.tsx
    ClassesTable.tsx
    ClassForm.tsx
    EditClassForm.tsx
```

### Curriculum Components
```
components/
  curriculum/
    AssessmentForm.tsx
    AssessmentsList.tsx
    CertificateForm.tsx
    CertificatePreview.tsx
    CertificatesList.tsx
    CertificateViewClient.tsx
    CurriculumTopics.tsx
    EditSubjectForm.tsx
    MemorizationItemForm.tsx
    MemorizationLibrary.tsx
    StudentMemorizationTracker.tsx
    SubjectForm.tsx
    SubjectsTable.tsx
```

### Fees & Fines Components
```
components/
  fees/
    FeeIndicator.tsx
    FeePaymentModal.tsx
    FeeStructureForm.tsx
    QuarterSettings.tsx
    StudentFeeAssignment.tsx
  fines/
    FineCollectionModal.tsx
    FineIndicator.tsx
```

### Feedback Components
```
components/
  feedback/
    EndOfClassFeedback.tsx
```

### Messages Components
```
components/
  messages/
    ClassMessageForm.tsx
    StudentMessageForm.tsx
```

### Public Components
```
components/
  public/
    ApplicationForm.tsx
    ContactForm.tsx
```

### Reports Components
```
components/
  reports/
    AcademicReportGenerator.tsx
    AttendanceReportGenerator.tsx
    CertificateReportGenerator.tsx
    ClassReportGenerator.tsx
    LowAttendanceReportGenerator.tsx
    MemorizationReportGenerator.tsx
    ReportsDashboard.tsx
    StudentReportGenerator.tsx
```

### Settings Components
```
components/
  settings/
    AcademicSettings.tsx
    ApplicationSettings.tsx
    CentreSettings.tsx
    FeeSettings.tsx
    FeeSettings copy.tsx
    FineSettings.tsx
    GeneralSettings.tsx
    NotificationSettings.tsx
    SettingsTabs.tsx
    UserManagement.tsx
```

### Students Components
```
components/
  students/
    EditStudentForm.tsx
    FinancialImpactWarning.tsx
    StudentActionButtons.tsx
    StudentDeletionModal.tsx
    StudentFeeHistory.tsx
    StudentForm.tsx
    StudentProfileClient.tsx
    StudentsHeader.tsx
    StudentsTable.tsx
    StudentStatusBadge.tsx
    StudentStatusChangeModal.tsx
```

### Parent Components
```
components/
  parent/
    ParentDashboard.tsx
    ParentDashboard copy.tsx
    tabs/
      AttendanceTab.tsx
      AttendanceTab copy.tsx
      CertificatesTab.tsx
      FeesTab.tsx
      FinesTab.tsx
      GradesTab.tsx
      MemorizationTab.tsx
```

## Hooks

```
hooks/
  useCustomQuarters.ts
  useFees.ts
  useFines.ts
  useParentNotifications.ts
  useParentNotifications copy.ts
  useStudentManagement.ts
```

## Lib / Utilities

### Email
```
lib/
  email/
    resend.ts
    send-application-email.ts
    templates/
      application-accepted.tsx
      application-received.tsx
      application-rejected.tsx
```

### PDF
```
lib/
  pdf/
    invoice-generator.ts
```

### Supabase
```
lib/
  supabase/
    client.ts
    server.ts
```

### Types
```
lib/
  types/
    database.ts
```

### Utils
```
lib/
  utils/
    gradeCalculator.ts
    helpers.ts
    pdfExport.ts
    quarterInvoiceGenerator.ts
```

## Summary

- **Total files:** 212 (including copies and duplicate/backup files)
- **Production files:** ~195 (excluding `* copy.*` files)
- **Key technologies:** Next.js (app router), TypeScript/TSX, Supabase, Tailwind CSS, React
- **Main sections:** App routes, Components, Hooks, Lib utilities, Supabase migrations, Types, Styles

## Notes

- Copy files (e.g., `* copy.ts`, `* copy.tsx`) are included in the count but are typically backups.
- New migrations added: `008_messages system.sql`, `009_notification_system.sql`, `010_automated_alerts.sql`
- New parent dashboard routes and messaging/notification features added since last update.
- New hooks: `useParentNotifications.ts` and copy.
- New components: Feedback, Notifications, Messages, Alerts components added.

Generated on: December 7, 2025
