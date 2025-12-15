# Project Structure for ACManagement (SchoolRegister)

**Generated:** December 15, 2025  
**Total Files:** 257  
**Workspace Root:** `f:\SchoolRegister`

---

## Root Level Files

```
.env.example                 - Environment variables template
.env.local                   - Local environment variables
GITHUB_RAW_LINKS.md          - Raw GitHub links for all files
GITHUB_RAW_LINKS copy.md     - Backup of raw links
middleware.ts                - Next.js middleware
next-env.d.ts                - Next.js auto-generated types
next.config.js               - Next.js configuration
package.json                 - NPM dependencies & scripts
package-lock.json            - NPM lock file
postcss.config.js            - PostCSS configuration
PROJECT_STRUCTURE.md         - This file
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
  robots.ts                  - Robots.txt configuration
  sitemap.ts                 - Sitemap configuration
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

#### `/app/(dashboard)` - Admin Dashboard Routes
```
app/(dashboard)/
  layout.tsx                 - Dashboard layout wrapper
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
  curriculum-assessment/
    page.tsx                 - Curriculum assessment
    assessments/
      page.tsx               - Assessments list
      new/
        page.tsx             - New assessment
    certificates/
      page.tsx               - Certificates list
      generate/
        page.tsx             - Generate certificate
      view/
        page.tsx             - View certificate
    memorization/
      page.tsx               - Memorization tracking
      new/
        page.tsx             - New memorization item
      track/
        page.tsx             - Track memorization
    subjects/
      page.tsx               - Subjects list
      new/
        page.tsx             - New subject
      [id]/
        page.tsx             - Subject detail
        edit/
          page.tsx           - Edit subject
  dashboard/
    page.tsx                 - Dashboard home
  events/
    page.tsx                 - Events management
    page.tsx.backup          - Backup of events page
    page.tsx.backup1         - Another backup of events page
  fees/
    page.tsx                 - Fees management
  fines/
    page.tsx                 - Fines management
  messages/
    page.tsx                 - Messages
    history/
      page.tsx               - Message history
  notifications/
    page.tsx                 - Notifications
  reports/
    page.tsx                 - Reports
  settings/
    page.tsx                 - Settings
  students/
    page.tsx                 - Students list
    link-parents/
      page.tsx               - Link parents
    new/
      page.tsx               - New student
    [id]/
      page.tsx               - Student detail
      edit/
        page.tsx             - Edit student
```

#### `/app/(parent)` - Parent Portal Routes
```
app/(parent)/
  layout.tsx                 - Parent layout wrapper
  parent/
    applications/
      page.tsx               - Parent applications
    children/
      page.tsx               - Parent children
    dashboard/
      page.tsx               - Parent dashboard
    events/
      page.tsx               - Parent events
      page.tsx.backup        - Backup of parent events
    finances/
      page.tsx               - Parent finances
    inbox/
      page.tsx               - Parent inbox
    messages/
      page.tsx               - Parent messages
    notifications/
      page.tsx               - Parent notifications
    profile/
      page.tsx               - Parent profile
    student/
      [id]/
        page.tsx             - Parent student detail
```

#### `/app/(public)` - Public Routes
```
app/(public)/
  layout.tsx                 - Public layout wrapper
  about/
    page.tsx                 - About page
  apply/
    page.tsx                 - Application form
    success/
      page.tsx               - Application success
  contact/
    page.tsx                 - Contact page
  cookies/
    page.tsx                 - Cookies page
  faq/
    page.tsx                 - FAQ page
  gallery/
    page.tsx                 - Gallery page
  home/
    page.tsx                 - Home page
  news/
    page.tsx                 - News page
  privacy/
    page.tsx                 - Privacy page
  programs/
    page.tsx                 - Programs page
  terms/
    page.tsx                 - Terms page
```

#### `/app/api` - API Routes
```
app/api/
  admin/
    cleanup-orphaned-auth/
      route.ts               - Cleanup orphaned auth
    create-parent-account/
      route.ts               - Create parent account
  alerts/
    check/
      route.ts               - Check alerts
  applications/
    submit/
      route.ts               - Submit application
    [id]/
      accept/
        route.ts             - Accept application
      reject/
        route.ts             - Reject application
      status/
        route.ts             - Application status
  contact/
    submit/
      route.ts               - Submit contact
      route.ts.backup        - Backup of submit contact
  cron/
    daily-alerts/
      route.ts               - Daily alerts cron
  debug/
    cookies/
      route.ts               - Debug cookies
  feedback/
    send/
      route.ts               - Send feedback
  fees/
    generate-invoices/
      route.ts               - Generate invoices
  messages/
    send/
      route.ts               - Send message
    templates/
      route.ts               - Message templates
  notifications/
    route.ts                 - Notifications
    read/
      route.ts               - Read notifications
  parent/
    fine/
      [fineId]/
        download/
          route.ts           - Download fine
    invoice/
      [invoiceId]/
        download/
          route.ts           - Download invoice
    send-login-details/
      route.ts               - Send login details
  settings/
    route.ts                 - Settings
    centre/
      route.ts               - Centre settings
```

#### `/app/parent` - Parent Routes
```
app/parent/
  login/
    page.tsx                 - Parent login
  set-password/
    page.tsx                 - Set password
```

### `/components` - React Components

#### `/components/about`
```
components/about/
  StaffSection.tsx           - Staff section component
```

#### `/components/admin`
```
components/admin/
  OrphanedAuthCleanup.tsx    - Orphaned auth cleanup component
```

#### `/components/alerts`
```
components/alerts/
  AlertManagement.tsx        - Alert management component
```

#### `/components/applications`
```
components/applications/
  AcademicYearSelector.tsx   - Academic year selector
  ApplicationActions.tsx     - Application actions
  ApplicationsHeader.tsx     - Applications header
  ApplicationsTable.tsx      - Applications table
```

#### `/components/attendance`
```
components/attendance/
  AttendanceFilters.tsx      - Attendance filters
  AttendanceHistoryTable.tsx - Attendance history table
  AttendanceMarkingInterface.tsx - Attendance marking interface
```

#### `/components/classes`
```
components/classes/
  ClassesHeader.tsx          - Classes header
  ClassesTable.tsx           - Classes table
  ClassForm.tsx              - Class form
  EditClassForm.tsx          - Edit class form
```

#### `/components/curriculum`
```
components/curriculum/
  AssessmentForm.tsx         - Assessment form
  AssessmentsList.tsx        - Assessments list
  CertificateForm.tsx        - Certificate form
  CertificatePreview.tsx     - Certificate preview
  CertificatesList.tsx       - Certificates list
  CertificateViewClient.tsx  - Certificate view client
  CurriculumTopics.tsx       - Curriculum topics
  EditSubjectForm.tsx        - Edit subject form
  MemorizationItemForm.tsx   - Memorization item form
  MemorizationLibrary.tsx    - Memorization library
  StudentMemorizationTracker.tsx - Student memorization tracker
  SubjectForm.tsx            - Subject form
  SubjectsTable.tsx          - Subjects table
```

#### `/components/events`
```
components/events/
  EventRSVPConfig.tsx        - Event RSVP config
  EventRSVPManagement.tsx    - Event RSVP management
  ParentEventRSVP.tsx        - Parent event RSVP
  WhatsAppEventModal.tsx     - WhatsApp event modal
```

#### `/components/feedback`
```
components/feedback/
  EndOfClassFeedback.tsx     - End of class feedback
```

#### `/components/fees`
```
components/fees/
  FeeIndicator.tsx           - Fee indicator
  FeePaymentModal.tsx        - Fee payment modal
  FeeStructureForm.tsx       - Fee structure form
  QuarterSettings.tsx        - Quarter settings
  StudentFeeAssignment.tsx   - Student fee assignment
```

#### `/components/fines`
```
components/fines/
  FineCollectionModal.tsx    - Fine collection modal
  FineIndicator.tsx          - Fine indicator
```

#### `/components/layout`
```
components/layout/
  CookieConsent.tsx          - Cookie consent
  Header.tsx                 - Header component
  PublicMobileMenu.tsx       - Public mobile menu
  Sidebar.tsx                - Sidebar component
```

#### `/components/messages`
```
components/messages/
  ClassMessageForm.tsx       - Class message form
  StudentMessageForm.tsx     - Student message form
```

#### `/components/notifications`
```
components/notifications/
  ParentNotificationCenter.tsx - Parent notification center
  WhatsAppNotificationModal.tsx - WhatsApp notification modal
```

#### `/components/parent`
```
components/parent/
  ParentDashboard copy.tsx   - Backup of parent dashboard
  ParentDashboard.tsx        - Parent dashboard
  tabs/
    AttendanceTab.tsx        - Attendance tab
    CertificatesTab.tsx      - Certificates tab
    FeesTab.tsx              - Fees tab
    FinesTab.tsx             - Fines tab
    GradesTab.tsx            - Grades tab
    MemorizationTab.tsx      - Memorization tab
```

#### `/components/providers`
```
components/providers/
  ThemeProvider.tsx          - Theme provider
```

#### `/components/public`
```
components/public/
  ApplicationForm.tsx        - Application form
  ContactForm.tsx            - Contact form
```

#### `/components/reports`
```
components/reports/
  AcademicReportGenerator.tsx - Academic report generator
  AttendanceReportGenerator.tsx - Attendance report generator
  CertificateReportGenerator.tsx - Certificate report generator
  ClassReportGenerator.tsx   - Class report generator
  LowAttendanceReportGenerator.tsx - Low attendance report generator
  MemorizationReportGenerator.tsx - Memorization report generator
  ReportsDashboard.tsx       - Reports dashboard
  StudentReportGenerator.tsx - Student report generator
```

#### `/components/settings`
```
components/settings/
  AcademicSettings.tsx       - Academic settings
  ApplicationSettings.tsx    - Application settings
  CentreSettings.tsx         - Centre settings
  FeeSettings copy.tsx       - Backup of fee settings
  FeeSettings.tsx            - Fee settings
  FineSettings.tsx           - Fine settings
  GeneralSettings.tsx        - General settings
  NotificationSettings.tsx   - Notification settings
  SettingsTabs.tsx           - Settings tabs
  UserManagement.tsx         - User management
```

#### `/components/students`
```
components/students/
  EditStudentForm.tsx        - Edit student form
  FinancialImpactWarning.tsx - Financial impact warning
  StudentActionButtons.tsx   - Student action buttons
  StudentDeletionModal.tsx   - Student deletion modal
  StudentFeeHistory.tsx      - Student fee history
  StudentForm.tsx            - Student form
  StudentProfileClient.tsx   - Student profile client
  StudentsHeader.tsx         - Students header
  StudentsTable.tsx          - Students table
  StudentStatusBadge.tsx     - Student status badge
  StudentStatusChangeModal.tsx - Student status change modal
```

#### `/components/ui`
```
components/ui/
  ThemeToggle.tsx            - Theme toggle
  ThemeToggle.tsx.backup     - Backup of theme toggle
```

### `/hooks` - Custom React Hooks
```
hooks/
  useCustomQuarters.ts       - Custom quarters hook
  useFees.ts                 - Fees hook
  useFines.ts                - Fines hook
  useParentNotifications copy.ts - Backup of parent notifications hook
  useParentNotifications.ts  - Parent notifications hook
  useStudentManagement.ts    - Student management hook
  useUnifiedNotifications.ts - Unified notifications hook
```

### `/lib` - Utility Libraries

#### `/lib/email`
```
lib/email/
  resend.ts                  - Resend email utility
  send-application-email.ts  - Send application email
  templates/
    application-accepted.tsx - Application accepted template
    application-received.tsx - Application received template
    application-rejected.tsx - Application rejected template
```

#### `/lib/pdf`
```
lib/pdf/
  invoice-generator.ts       - Invoice generator
```

#### `/lib/supabase`
```
lib/supabase/
  client.ts                  - Supabase client
  server.ts                  - Supabase server
```

#### `/lib/types`
```
lib/types/
  database.ts                - Database types
```

#### `/lib/utils`
```
lib/utils/
  gradeCalculator.ts         - Grade calculator
  helpers.ts                 - Helper functions
  pdfExport.ts               - PDF export utility
  quarterInvoiceGenerator.ts - Quarter invoice generator
  whatsappMessages.ts        - WhatsApp messages
  whatsappNotifications.ts   - WhatsApp notifications
```

### `/public` - Static Assets

#### `/public/gallery`
```
public/gallery/
  classroom-1.jpg            - Classroom image 1
  classroom-2.jpg            - Classroom image 2
  classroom-3.jpg            - Classroom image 3
  classroom-4.jpg            - Classroom image 4
  classroom-5.jpg            - Classroom image 5
  classroom-6.jpg            - Classroom image 6
  event-1.jpg                - Event image 1
  event-2.jpg                - Event image 2
  event-3.jpg                - Event image 3
  event-4.jpg                - Event image 4
  event-5.jpg                - Event image 5
  event-6.jpg                - Event image 6
```

#### `/public/logo`
```
public/logo/
  ahlogo_web.png             - Web logo
  ahlogo_web_nobg.png        - Web logo without background
  ahseal.png                 - Seal logo
  logo.png                   - Main logo
  og-image.png               - Open graph image
```

#### `/public/staff`
```
public/staff/
  headteacher.jpg            - Headteacher image
  teacher-1.jpg              - Teacher 1 image
  teacher-2.jpg              - Teacher 2 image
```

### `/styles` - Stylesheets
```
styles/
  globals.css                - Global CSS styles
```

### `/supabase` - Supabase Configuration

#### `/supabase/migrations`
```
supabase/migrations/
  001_initial_schema.sql    - Initial schema migration
  002_rls_policies.sql      - RLS policies migration
  003_seed.sql              - Seed data migration
  004_memorization_certificates.sql - Memorization certificates migration
  005_fine-setup.sql        - Fine setup migration
  006_fee_management.sql    - Fee management migration
  007_applications_and_parent_portal.sql - Applications and parent portal migration
  008_messages system.sql   - Messages system migration
  009_notification_system.sql - Notification system migration
  010_automated_alerts.sql  - Automated alerts migration
  011_event_rsvp_system.sql - Event RSVP system migration
```

### `/types` - TypeScript Type Definitions
```
types/
  fees copy.ts               - Backup of fees types
  fees.ts                    - Fees types
  fines copy.ts              - Backup of fines types
  fines.ts                   - Fines types
```
