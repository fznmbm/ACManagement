# Project Structure for ACManagement (SchoolRegister)

**Generated:** December 9, 2025  
**Total Files:** 227  
**Workspace Root:** `f:\SchoolRegister`

---

## Root Level Files

```
.env.example                 - Environment variables template
.gitignore                   - Git ignore configuration
Excellent.docx               - Document file
GITHUB_RAW_LINKS.md          - Raw GitHub links for all files
GITHUB_RAW_LINKS copy.md     - Backup of raw links
PROJECT_STRUCTURE.md         - This file
middleware.ts                - Next.js middleware
middleware copy.ts           - Middleware backup
next-env.d.ts                - Next.js auto-generated types
next.config.js               - Next.js configuration
package.json                 - NPM dependencies & scripts
package-lock.json            - NPM lock file
postcss.config.js            - PostCSS configuration
tailwind.config.ts           - Tailwind CSS configuration
tsconfig.json                - TypeScript configuration
vercel.json                  - Vercel deployment configuration
```

---

## Directory Structure

### `/app` - Next.js App Router

#### Root Level
```
app/
  layout.tsx                 - Root layout
  page.tsx                   - Root page
```

#### `/app/hooks`
```
app/hooks/
  useFines.ts                - Fines hook
```

#### `/app/(auth)` - Authentication Routes
```
app/(auth)/
  layout.tsx                 - Auth layout wrapper
  login/
    page.tsx                 - Login page
```

#### `/app/(public)` - Public Routes
```
app/(public)/
  layout.tsx                 - Public layout wrapper
  home/
    page.tsx                 - Home page
  about/
    page.tsx                 - About page
  contact/
    page.tsx                 - Contact page
  programs/
    page.tsx                 - Programs page
  apply/
    page.tsx                 - Application form page
    success/
      page.tsx               - Application success page
```

#### `/app/(dashboard)` - Admin Dashboard Routes
```
app/(dashboard)/
  layout.tsx                 - Dashboard layout wrapper
  dashboard/
    page.tsx                 - Dashboard home
  
  alerts/
    page.tsx                 - Alerts management
  
  applications/
    page.tsx                 - Applications list
    [id]/
      page.tsx               - Application detail
  
  attendance/
    page.tsx                 - Attendance marking
    history/
      page.tsx               - Attendance history
  
  classes/
    page.tsx                 - Classes list
    new/
      page.tsx               - Create new class
    [id]/
      page.tsx               - Class detail
      edit/
        page.tsx             - Edit class
      feedback/
        page.tsx             - Class feedback
  
  students/
    page.tsx                 - Students list
    new/
      page.tsx               - Create new student
    link-parents/
      page.tsx               - Link parents to students
    [id]/
      page.tsx               - Student detail
      edit/
        page.tsx             - Edit student
  
  fees/
    page.tsx                 - Fees management
  
  fines/
    page.tsx                 - Fines management
  
  messages/
    page.tsx                 - Messages list
    history/
      page.tsx               - Message history
  
  events/
    page.tsx                 - Events management
    page.tsx.backup          - Events backup
    page.tsx.backup1         - Events backup 2
  
  reports/
    page.tsx                 - Reports dashboard
  
  settings/
    page.tsx                 - Settings page
  
  notifications/
    page.tsx                 - Notifications page
  
  curriculum-assessment/
    page.tsx                 - Curriculum assessment home
    assessments/
      page.tsx               - Assessments list
      new/
        page.tsx             - Create assessment
    certificates/
      page.tsx               - Certificates list
      generate/
        page.tsx             - Generate certificate
      view/
        page.tsx             - View certificate
    subjects/
      page.tsx               - Subjects list
      new/
        page.tsx             - Create subject
      [id]/
        page.tsx             - Subject detail
        edit/
          page.tsx           - Edit subject
    memorization/
      page.tsx               - Memorization tracking
      new/
        page.tsx             - Create memorization item
      track/
        page.tsx             - Track memorization progress
```

#### `/app/(parent)` - Parent Portal Routes
```
app/(parent)/
  layout.tsx                 - Parent portal layout wrapper
  parent/
    profile/
      page.tsx               - Parent profile
    dashboard/
      page.tsx               - Parent dashboard
    children/
      page.tsx               - Child list
    student/
      [id]/
        page.tsx             - Child detail/progress
    finances/
      page.tsx               - Finances & fees view
    applications/
      page.tsx               - Applications view
    messages/
      page.tsx               - Messages
    notifications/
      page.tsx               - Notifications
    events/
      page.tsx               - Events
      page.tsx.backup        - Events backup
    inbox/
      page.tsx               - Inbox
```

#### `/app/parent` - Legacy Parent Routes
```
app/parent/
  login/
    page.tsx                 - Parent login
  set-password/
    page.tsx                 - Set password page
```

#### `/app/api` - API Routes

##### Admin
```
app/api/admin/
  create-parent-account/
    route.ts                 - Create parent account endpoint
```

##### Alerts
```
app/api/alerts/
  check/
    route.ts                 - Check alerts endpoint
```

##### Applications
```
app/api/applications/
  submit/
    route.ts                 - Submit application
  [id]/
    accept/
      route.ts               - Accept application
    reject/
      route.ts               - Reject application
    status/
      route.ts               - Get application status
```

##### Contact
```
app/api/contact/
  submit/
    route.ts                 - Submit contact form
```

##### Cron Jobs
```
app/api/cron/
  daily-alerts/
    route.ts                 - Daily alerts cron job
```

##### Debug
```
app/api/debug/
  cookies/
    route.ts                 - Debug cookies endpoint
```

##### Feedback
```
app/api/feedback/
  send/
    route.ts                 - Send feedback endpoint
```

##### Fees
```
app/api/fees/
  generate-invoices/
    route.ts                 - Generate invoices
    route copy.ts            - Generate invoices backup
```

##### Messages
```
app/api/messages/
  send/
    route.ts                 - Send message endpoint
  templates/
    route.ts                 - Message templates endpoint
```

##### Notifications
```
app/api/notifications/
  route.ts                   - Get/create notifications
  read/
    route.ts                 - Mark notification as read
```

##### Parent API
```
app/api/parent/
  send-login-details/
    route.ts                 - Send login details to parent
  invoice/
    [invoiceId]/
      download/
        route.ts             - Download invoice
  fine/
    [fineId]/
      download/
        route.ts             - Download fine
```

##### Settings
```
app/api/settings/
  route.ts                   - Get/update settings
  centre/
    route.ts                 - Centre settings
```

---

### `/components` - React Components

#### Layout Components
```
components/layout/
  Header.tsx                 - Header/navigation component
  Sidebar.tsx                - Sidebar component
```

#### Providers & UI
```
components/providers/
  ThemeProvider.tsx          - Theme provider wrapper

components/ui/
  ThemeToggle.tsx            - Dark/light theme toggle
```

#### Alerts
```
components/alerts/
  AlertManagement.tsx        - Alert management component
```

#### Applications
```
components/applications/
  ApplicationsHeader.tsx      - Applications header
  ApplicationsTable.tsx       - Applications table
  ApplicationActions.tsx      - Application action buttons
  AcademicYearSelector.tsx    - Academic year selector
```

#### Attendance
```
components/attendance/
  AttendanceFilters.tsx       - Attendance filters
  AttendanceMarkingInterface.tsx - Attendance marking UI
  AttendanceHistoryTable.tsx   - Attendance history table
```

#### Classes
```
components/classes/
  ClassesHeader.tsx           - Classes header
  ClassesTable.tsx            - Classes table
  ClassForm.tsx               - Create class form
  EditClassForm.tsx           - Edit class form
```

#### Curriculum & Assessment
```
components/curriculum/
  AssessmentForm.tsx          - Assessment form
  AssessmentsList.tsx         - Assessments list
  CertificateForm.tsx         - Certificate form
  CertificatePreview.tsx      - Certificate preview
  CertificatesList.tsx        - Certificates list
  CertificateViewClient.tsx   - Certificate viewer
  CurriculumTopics.tsx        - Curriculum topics
  EditSubjectForm.tsx         - Edit subject form
  MemorizationItemForm.tsx    - Memorization item form
  MemorizationLibrary.tsx     - Memorization library
  StudentMemorizationTracker.tsx - Track student memorization
  SubjectForm.tsx             - Create subject form
  SubjectsTable.tsx           - Subjects table
```

#### Events
```
components/events/
  EventRSVPConfig.tsx         - Event RSVP configuration
  EventRSVPManagement.tsx     - RSVP management
  ParentEventRSVP.tsx         - Parent event RSVP
  WhatsAppEventModal.tsx      - WhatsApp event modal
```

#### Feedback
```
components/feedback/
  EndOfClassFeedback.tsx      - End of class feedback form
```

#### Fees
```
components/fees/
  FeeIndicator.tsx            - Fee indicator component
  FeePaymentModal.tsx         - Fee payment modal
  FeeStructureForm.tsx        - Fee structure form
  QuarterSettings.tsx         - Quarter settings
  StudentFeeAssignment.tsx    - Assign fees to students
```

#### Fines
```
components/fines/
  FineCollectionModal.tsx     - Fine collection modal
  FineIndicator.tsx           - Fine indicator component
```

#### Messages
```
components/messages/
  ClassMessageForm.tsx        - Send message to class
  StudentMessageForm.tsx      - Send message to student
```

#### Notifications
```
components/notifications/
  ParentNotificationCenter.tsx - Parent notification center
  WhatsAppNotificationModal.tsx - WhatsApp notification modal
```

#### Parent Portal
```
components/parent/
  ParentDashboard.tsx         - Parent dashboard
  ParentDashboard copy.tsx    - Dashboard backup
  tabs/
    AttendanceTab.tsx         - Attendance tab
    AttendanceTab copy.tsx    - Attendance tab backup
    CertificatesTab.tsx       - Certificates tab
    FeesTab.tsx               - Fees tab
    FinesTab.tsx              - Fines tab
    GradesTab.tsx             - Grades tab
    MemorizationTab.tsx       - Memorization tab
```

#### Public Components
```
components/public/
  ApplicationForm.tsx         - Public application form
  ContactForm.tsx             - Contact form
```

#### Reports
```
components/reports/
  AcademicReportGenerator.tsx     - Academic report
  AttendanceReportGenerator.tsx    - Attendance report
  CertificateReportGenerator.tsx   - Certificate report
  ClassReportGenerator.tsx         - Class report
  LowAttendanceReportGenerator.tsx - Low attendance report
  MemorizationReportGenerator.tsx  - Memorization report
  ReportsDashboard.tsx            - Reports dashboard
  StudentReportGenerator.tsx       - Student report
```

#### Settings
```
components/settings/
  AcademicSettings.tsx        - Academic settings
  ApplicationSettings.tsx      - Application settings
  CentreSettings.tsx          - Centre settings
  FeeSettings.tsx             - Fee settings
  FeeSettings copy.tsx        - Fee settings backup
  FineSettings.tsx            - Fine settings
  GeneralSettings.tsx         - General settings
  NotificationSettings.tsx    - Notification settings
  SettingsTabs.tsx            - Settings tabs container
  UserManagement.tsx          - User management
```

#### Students
```
components/students/
  EditStudentForm.tsx         - Edit student form
  FinancialImpactWarning.tsx  - Financial warning component
  StudentActionButtons.tsx    - Student action buttons
  StudentDeletionModal.tsx    - Student deletion modal
  StudentFeeHistory.tsx       - Student fee history
  StudentForm.tsx             - Create/edit student form
  StudentProfileClient.tsx    - Student profile view
  StudentsHeader.tsx          - Students header
  StudentsTable.tsx           - Students table
  StudentStatusBadge.tsx      - Status badge component
  StudentStatusChangeModal.tsx - Status change modal
```

---

### `/hooks` - React Hooks

```
hooks/
  useCustomQuarters.ts        - Custom quarters hook
  useFees.ts                  - Fees management hook
  useFines.ts                 - Fines management hook
  useParentNotifications.ts   - Parent notifications hook
  useParentNotifications copy.ts - Notifications backup
  useStudentManagement.ts     - Student management hook
  useUnifiedNotifications.ts  - Unified notifications hook
```

---

### `/lib` - Utilities & Libraries

#### Supabase
```
lib/supabase/
  client.ts                   - Supabase client-side setup
  server.ts                   - Supabase server-side setup
```

#### Email
```
lib/email/
  resend.ts                   - Resend email service
  send-application-email.ts   - Send application emails
  templates/
    application-accepted.tsx  - Application accepted template
    application-received.tsx  - Application received template
    application-rejected.tsx  - Application rejected template
```

#### PDF
```
lib/pdf/
  invoice-generator.ts        - PDF invoice generator
```

#### Types
```
lib/types/
  database.ts                 - Database types
```

#### Utils
```
lib/utils/
  gradeCalculator.ts          - Grade calculation utilities
  helpers.ts                  - General helper functions
  pdfExport.ts                - PDF export utilities
  quarterInvoiceGenerator.ts  - Quarter invoice generation
  whatsappMessages.ts         - WhatsApp messaging utilities
  whatsappNotifications.ts    - WhatsApp notification utilities
```

---

### `/supabase` - Database Migrations

```
supabase/migrations/
  001_initial_schema.sql              - Initial database schema
  002_rls_policies.sql                - Row-level security policies
  003_seed.sql                        - Seed data
  004_memorization_certificates.sql   - Memorization & certificates
  005_fine-setup.sql                  - Fine system setup
  006_fee_management.sql              - Fee management system
  007_applications_and_parent_portal.sql - Applications & parent portal
  008_messages system.sql             - Messaging system
  009_notification_system.sql         - Notification system
  010_automated_alerts.sql            - Automated alerts
  011_event_rsvp_system.sql           - Event RSVP system
```

---

### `/types` - TypeScript Type Definitions

```
types/
  fees.ts                     - Fee types
  fees copy.ts                - Fee types backup
  fines.ts                    - Fine types
  fines copy.ts               - Fine types backup
```

---

### `/styles` - Stylesheets

```
styles/
  globals.css                 - Global styles
```

---

### `/logo` - Assets

```
logo/
  ahlogo.jpg                  - School logo (JPG)
  ahseal.png                  - School seal (PNG)
```

---

## Summary

- **Framework:** Next.js (App Router)
- **Language:** TypeScript/TSX
- **Backend:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + PostCSS
- **Integrations:** Resend (email), WhatsApp messaging
- **Total Files:** 227 (including backups and copies)
- **Key Features:** 
  - Admin dashboard for staff
  - Parent portal for viewing child progress
  - Student & class management
  - Attendance tracking
  - Fee & fine management
  - Event management with RSVP
  - Notifications (email, WhatsApp)
  - Curriculum & assessment
  - Reporting system

---

**Last Updated:** December 9, 2025

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
# Project Structure for ACManagement (SchoolRegister)

This file documents the current project structure and all files/folders. Regenerated from the workspace on December 8, 2025.

## Root Configuration Files

```
vercel.json
tsconfig.json
tailwind.config.ts
PROJECT_STRUCTURE.md
postcss.config.js
package.json
package-lock.json
next.config.js
middleware.ts
middleware copy.ts
.gitignore
.env.example
GITHUB_RAW_LINKS.md
GITHUB_RAW_LINKS copy.md
Excellent.docx
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
    011_event_rsvp_system.sql
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
    inbox/page.tsx
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
    WhatsAppNotificationModal.tsx
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

### Events & Messaging
```
components/
  events/
    EventRSVPConfig.tsx
    WhatsAppEventModal.tsx
  messages/
    ClassMessageForm.tsx
    StudentMessageForm.tsx
```

### Feedback Components
```
components/
  feedback/
    EndOfClassFeedback.tsx
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
  useUnifiedNotifications.ts
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
    whatsappNotifications.ts
    whatsappMessages.ts
    quarterInvoiceGenerator.ts
    helpers.ts
    gradeCalculator.ts
    pdfExport.ts
```

## Summary

- **Total files:** 222 (including copies and duplicate/backup files)
- **Production files:** ~205 (excluding `* copy.*` files)
- **Key technologies:** Next.js (app router), TypeScript/TSX, Supabase, Tailwind CSS, React
- **Main sections:** App routes, Components, Hooks, Lib utilities, Supabase migrations, Types, Styles

## Notes

- Copy files (e.g., `* copy.ts`, `* copy.tsx`) are included in the count but are typically backups.
- New migrations: `011_event_rsvp_system.sql` added for event RSVP features.
- New hooks: `useUnifiedNotifications.ts` and `useParentNotifications.ts`.
- New components: WhatsApp notifications, events RSVP components, message/inbox screens.

Generated on: December 8, 2025
