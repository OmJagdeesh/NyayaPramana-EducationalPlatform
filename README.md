# Nyaya Pramana

Nyaya Pramana is an interactive web platform designed to introduce students to the Indian Knowledge System (IKS), specifically focusing on the Nyaya school of epistemology. It translates traditional philosophical concepts into a serious gaming environment to make learning cognitive skills engaging and accessible.

## Purpose

The project aligns with the National Education Policy (NEP) 2020 objectives by integrating native logic frameworks into modern education. Rather than just memorizing definitions, students learn how to evaluate knowledge and form logical conclusions through three primary pramanas (means of valid knowledge):
- **Pratyaksa** (Perception): Gathering direct evidence through observation.
- **Anumana** (Inference): Drawing logical conclusions from available data.
- **Sabda** (Testimony): Evaluating the reliability of expert sources.

By turning these concepts into core game mechanics (e.g., investigating scenes, ordering logical sequences, identifying reliable testimonials), the platform helps build fundamental critical thinking and analytical skills.

## Target Audience

1. **Students**: The primary users. The platform gives them gamified challenges, a leveling system, and leaderboards to keep them engaged while they practice reasoning skills.
2. **Educators/Teachers**: Teachers get a dedicated dashboard to track student performance, create custom quizzes, distribute class codes, and download detailed analytical reports (PDFs) on how their students are grasping different cognitive metrics.

## Features

- **Role-Based Workflows**: Separate, tailored dashboards for Students and Teachers with deep cognitive insights.
- **Game Engine & Guru Hints**: Custom game modes based on the three pramanas, coupled with a real-time hint tracking system (Guru) which penalizes and logs interventions.
- **Assessments & Cognitive Profiling**: Mandatory unskippable Pre-tests and Post-tests accurately calculate raw learning deltas, presented on the Student Dashboard via interactive Radar Charts.
- **Reflection Journaling**: Post-game contextual reflection prompts encourage metacognition, saved securely for teacher review.
- **Classroom Management & Analytics**: Teachers can create custom games, and students can instantly join them via 6-character game codes.
- **Comprehensive Reporting**: Educators can generate one-click visual PDF Effectiveness Reports and export mass CSV dumps from the Research dataset.
- **Leaderboards**: Both Global and localized Class-scoped leaderboards rank students securely.
- **IKS Ecosystem**: A built-in immersive IKS Framework encyclopedia and Documentation tab guides the user experience.

## Local Development

Ensure you have Node.js (v18+) installed.

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. To run the development server (frontend and backend concurrently):
   ```bash
   npm run dev:full
   ```

3. To build and run in a production-like environment:
   ```bash
   npm run build
   npm start
   ```

**Note on Deployment**: This application uses a local SQLite database (`nyaya_pramana.db`). Ensure you use a hosting provider with persistent storage (like Render or a standard VPS) rather than serverless functions (like Vercel) to prevent the database from resetting.
