# Shorthandians (shorthand-got-it)

Welcome to the Shorthandians Practitioner Portal! This project is a modern, highly interactive React application designed to help stenography students practice, measure, and improve their shorthand transcription speeds.

## 🛠️ Technology Stack
This project is built as a frontend-heavy Single Page Application (SPA).

*   **Framework:** React 19 (via Vite)
*   **Styling:** Tailwind CSS (v3.4) with custom interactive utilities.
*   **Icons:** Lucide React (`lucide-react`)
*   **Backend & Database:** Supabase (PostgreSQL, Auth, Storage) via `@supabase/supabase-js`.
*   **Rich Text & Documents:** 
    *   `react-quill` (For Rich text editing, primarily within the Admin Panel)
    *   `pdfjs-dist` (For rendering PDF shorthand references within the browser modules).
*   **Linting:** ESLint 9

## 📂 Project Structure
The application is structured modularly within the `src` directory, isolating landing pages, authentication, administrative panels, and the specialized practice modules.

```text
d:\My_Project\shorthand-got-it\
├── package.json               # Defines dependencies & dev scripts (React 19, Tailwind)
├── tailwind.config.js         # Configuration for Tailwind utility classes
├── vite.config.js             # Configuration for the Vite build tool
├── .env                       # Supabase connection credentials
└── src/
    ├── main.jsx                 # React root entry file 
    ├── index.css                # Base & Tailwind directive imports + custom utilities
    ├── supabaseClient.js        # Configures the active Supabase connection & Anon keys
    │
    ├── 1. Main Navigation & Routing App Structure:
    │   ├── App.jsx                  # The primary App router and root layout wrapper 
    │   ├── Navbar.jsx               # Main header navigation (Login/Logout/Support actions)
    │   └── ErrorBoundary.jsx        # Fallback UI wrapper for handling React crashes gracefully
    │
    ├── 2. Landing & Marketing Pages (Public):
    │   ├── HeroSection.jsx          # Top landing page banner & CTA
    │   ├── LiveDemoInteractive.jsx  # Interactive live typing demo for non-logged-in users
    │   ├── OfferingsSection.jsx     # Lists the available modules (Pitman/High Court currently active)
    │   ├── MobilePracticeSection.jsx# Advertising mobile compatibility 
    │   ├── AboutContactSection.jsx  # Contact forms and about info
    │   └── FAQSection.jsx           # Dropdown list of frequently asked questions
    │
    ├── 3. Authentication & Sessions:
    │   ├── AuthPage.jsx            # The main Login/Registration view
    │   ├── AuthFlow.jsx            # Underlying logic for handling logins and OTPs
    │   └── LoginRequiredModal.jsx  # Popup blocker when guests try to access premium links 
    │
    ├── 4. Student Portal Core (Protected):
    │   ├── StudentPerformanceDashboard.jsx # The main dynamic hub metrics (WPM gauges, etc.)
    │   ├── ResultAnalysisPage.jsx          # Post-test analysis summarizing mistakes/accuracy
    │   └── DetailedAnalysisPanel.jsx       # The strict word-by-word diffing logic for test scoring
    │
    ├── 5. Practice Modules (The Actual Tests):
    │   ├── TypingArena.jsx          # Heavy module for Standard Dictation (Audio testing logic)
    │   ├── HighCourtFormatting.jsx  # Specialized UI splitting a legal PDF & rich text editor
    │   ├── PitmanAPSModule.jsx      # Specialized UI splitting a shorthand image & transcription box
    │   └── StateExamModule.jsx      # Generic exam selection wrapper
    │
    └── 6. Admin Panel / Backend Interfaces:
        ├── AdminPanel.jsx           # Giant multi-tab admin view for managing exercises/uploads
        └── AdminUserManagement.jsx  # Admin tab specifically for adding/editing students (Provisioning)
```

## ✨ Core Functionality 

### 1. The Student Practice Portal
The core value of the application rests in the protected practice modules:
*   **Allahabad High Court Formatting:** A premium module designed for legal stenographers. It splits the screen between a reference PDF/Image (the dictation source) and a full rich-text editor, allowing users to format legal text identically to court requirements.
*   **Pitman Shorthand Exercise:** A portal designed for foundational shorthand reading. Students are presented with a shorthand image and a live transcription box to continuously practice translation and transcription.

### 2. Result Analysis & Performance Tracking
After a student submits a transcription test, the application utilizes a complex diffing algorithm (`DetailedAnalysisPanel.jsx`) to scrub their input against the baseline solution text.
*   It generates a detailed visual map of omitted, extra, and substituted words.
*   It calculates live WPM (Words Per Minute) and formatting accuracy metrics.
*   The `StudentPerformanceDashboard.jsx` then visualizes these metrics using dynamic radial gauges and progress trackers, maintaining a historical record of the student's mastery across tests.

### 3. Comprehensive Administrative Control
The `AdminPanel.jsx` acts as the command center for the application operators:
*   **Exercise Upload Pipeline:** Admins can quickly upload, format, and push new PDFs, Audio Files, and Text solutions to the Supabase database.
*   **Student Provisioning:** Security is maintained via an invite-only style system. `AdminUserManagement.jsx` allows admins to manually create, suspend, or manage student accounts from the dashboard without needing external database access.

## 🚀 Getting Started

1.  **Install Dependencies:** Run `npm install` (or `npm ci` for clean install).
2.  **Environment Variables:** Make sure you have a valid `.env` file containing your Supabase credentials (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
3.  **Run Development Server:** Use `npm run dev` to start the Vite local server and test the live application.
