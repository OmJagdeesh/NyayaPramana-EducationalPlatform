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

- **Role-Based Workflows**: Separate, tailored dashboards for Students and Teachers.
- **Game Engine**: Custom game modes based on the three pramanas (Classifier, Decoder, Debate, Syllogism, etc.).
- **Classroom Management**: Teachers can create custom games, approve student enrollments via 6-character class codes, and track class data.
- **Analytics & Reporting**: Detailed breakdowns of student performance (accuracy, speed, level completion) with one-click PDF report generation.
- **Educator Toolkit**: Downloadable resources and frameworks to help teachers integrate IKS mechanics into their standard curriculum.

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
