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
components/
lib/
middleware.ts
next-env.d.ts
next.config.js
node_modules/
package-lock.json
package.json
postcss.config.js
styles/
supabase/
tailwind.config.ts
tsconfig.json
PROJECT_STRUCTURE.md (this file)
```

App directory (Next.js /app router)
```
app/
  layout.tsx
  page.tsx
  (auth)/
    layout.tsx
    login/
      page.tsx
  (dashboard)/
    layout.tsx
    attendance/
      page.tsx
      history/
        page.tsx
    classes/
      page.tsx
      [id]/
        page.tsx
        edit/
          page.tsx
      new/
        page.tsx
    curriculum-assessment/
      page.tsx
      assessments/
        page.tsx
        new/
          ...
      certificates/
        page.tsx
        generate/
        view/
      memorization/
        page.tsx
        new/
        track/
      subjects/
        page.tsx
        [id]/
        new/
    dashboard/
      page.tsx
    reports/
      page.tsx
    settings/
      page.tsx
    students/
      page.tsx
      [id]/
        page.tsx
        edit/
      new/
        page.tsx
  api/
    settings/
      centre/
        route.ts
```

components/
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
  settings/
    AcademicSettings.tsx
    CentreSettings.tsx
    GeneralSettings.tsx
    NotificationSettings.tsx
    SettingsTabs.tsx
    UserManagement.tsx
  students/
    EditStudentForm.tsx
    StudentForm.tsx
    StudentsHeader.tsx
    StudentsTable.tsx
  ui/
    ThemeToggle.tsx
```

lib/
```
lib/
  supabase/
    client.ts
    server.ts
  types/
    database.ts
  utils/
    gradeCalculator.ts
    helpers.ts
    pdfExport.ts
```

styles/
```
styles/
  globals.css
```

supabase/
```
supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
    003_seed.sql
    004_memorization_certificates.sql
```

Other important files
```
package.json       # project dependencies & scripts
next.config.js     # Next.js configuration
tailwind.config.ts # Tailwind config
tsconfig.json      # TypeScript config
postcss.config.js  # PostCSS config
```

Notes & next steps
- If you want a visual tree generated at the command line, run `tree /F` from the project root on Windows PowerShell (or `npx tree-cli` cross-platform).
- I can also scaffold missing README, CONTRIBUTING, or add detailed docs for each folder.
- Tell me if you want me to actually create placeholder files for any missing components/pages, or generate a `bin/setup` script.

Generated on: 2025-11-12
