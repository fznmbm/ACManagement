# Project Structure for ACManagement (SchoolRegister)

This file documents the current project structure and short descriptions for the main folders/files.

Root
```
.fenv.example
.env.local
.git/
.gitignore
.next/
app/
# Project Structure for ACManagement (SchoolRegister)

This file documents the current project structure and short descriptions for the main folders/files. It was regenerated from the workspace tree on 2025-11-21.

Root
```
.env.example
.env.local
.git/
.gitignore
.next/
app/
components/
Excellent.docx
GITHUB_RAW_LINKS.md
hooks/
lib/
logo/
middleware.ts
next-env.d.ts
next.config.js
node_modules/
package-lock.json
package.json
postcss.config.js
PROJECT_STRUCTURE.md
styles/
supabase/
tailwind.config.ts
tsconfig.json
types/
```

App directory (Next.js /app router)
```
app/
  layout.tsx
  page.tsx
  hooks/
    useFines.ts
  api/
    settings/
      route.ts
    fees/
      generate-invoices/
        route.ts
  (auth)/
    layout.tsx
    login/
      page.tsx
  (dashboard)/
    layout.tsx
    dashboard/
      page.tsx
    attendance/
      page.tsx
      history/
        page.tsx
    classes/
      page.tsx
      new/
        page.tsx
      [id]/
        page.tsx
        edit/
          page.tsx
    curriculum-assessment/
      page.tsx
      assessments/
        page.tsx
        new/
          page.tsx
      certificates/
        page.tsx
        generate/
          page.tsx
        view/
          page.tsx
      memorization/
        page.tsx
        new/
          page.tsx
        track/
          page.tsx
      subjects/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
          edit/
            page.tsx
    dashboard/
      page.tsx
    reports/
      page.tsx
    fees/
      page.tsx
    fines/
      page.tsx
    settings/
      page.tsx
    students/
      page.tsx
      new/
        page.tsx
      [id]/
        page.tsx
        edit/
          page.tsx
```

Components
```
components/
  attendance/
    AttendanceFilters.tsx
    AttendanceHistoryTable.tsx
    AttendanceMarkingInterface.tsx
  classes/
    ClassesHeader.tsx
    ClassesTable.tsx
    ClassForm.tsx
    EditClassForm.tsx
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
  layout/
    Header.tsx
    Sidebar.tsx
  providers/
    ThemeProvider.tsx
  reports/
    AttendanceReportGenerator.tsx
    ClassReportGenerator.tsx
    ReportsDashboard.tsx
    StudentReportGenerator.tsx
    MemorizationReportGenerator.tsx
    CertificateReportGenerator.tsx
    LowAttendanceReportGenerator.tsx
  settings/
    AcademicSettings.tsx
    CentreSettings.tsx
    GeneralSettings.tsx
    NotificationSettings.tsx
    SettingsTabs.tsx
    UserManagement.tsx
    FeeSettings.tsx
    FineSettings.tsx
  students/
    EditStudentForm.tsx
    StudentForm.tsx
    StudentProfileClient.tsx
    StudentsHeader.tsx
    StudentsTable.tsx
    StudentActionButtons.tsx
    StudentDeletionModal.tsx
    StudentFeeHistory.tsx
    StudentStatusBadge.tsx
    StudentStatusChangeModal.tsx
    FinancialImpactWarning.tsx
  fines/
    FineCollectionModal.tsx
    FineIndicator.tsx
  fees/
    FeeIndicator.tsx
    FeePaymentModal.tsx
    QuarterSettings.tsx
    StudentFeeAssignment.tsx
  ui/
    ThemeToggle.tsx
```

Hooks
```
hooks/
  useFines.ts
  useFees.ts
  useStudentManagement.ts
```

Lib
```
lib/
  supabase/
    client.ts
    server.ts
  types/
    database.ts
  utils/
    pdfExport.ts
    helpers.ts
    gradeCalculator.ts
```

Supabase migrations
```
supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
    003_seed.sql
    004_memorization_certificates.sql
    005_fine-setup.sql
    006_fee_management.sql
```

Types
```
types/
  fees.ts
  fines.ts
```

Styles
```
styles/
  globals.css
```

Other important files
```
package.json       # project dependencies & scripts
next.config.js     # Next.js configuration
tailwind.config.ts # Tailwind config
tsconfig.json      # TypeScript config
postcss.config.js  # PostCSS config
middleware.ts      # custom Next.js middleware
GITHUB_RAW_LINKS.md
Excellent.docx     # document present in repo root
```

Notes & next steps
- If you want a visual tree generated at the command line, run `tree /F` from the project root on Windows PowerShell (or `npx tree-cli` cross-platform).
- I can scaffold missing README, CONTRIBUTING, or add detailed docs for each folder.
- I can also create a JSON or CSV export of the file list and raw GitHub links if you want to use them programmatically.

Generated on: 2025-11-21
