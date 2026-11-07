# School ERP Portal – Prototype

Clickable prototype of a school ERP portal (Vidya Bharati Public School, sample data). Built with Next.js 15 + Tailwind CSS. All data is mock data stored in the browser (localStorage) — no backend.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
# or production build
npm run build && PORT=3010 npm run start
```

Use **"Viewing as"** in the top bar to switch between Admin, Teacher, Student and Parent. **Reset demo data** (sidebar) restores the sample data. The **clock** button (top right) sets a demo time, e.g. 7:40 AM for check-in or 8:05 AM for the Period-1 roll call.

## Modules

- **Dashboard** – role-specific overview
- **Attendance Process** – paper register vs portal, step-by-step school day
- **Student Attendance** – Period-1 roll call by the class teacher (valid for the whole day), review, submit, parent SMS preview, admin live board, monthly register
- **Teacher Attendance** – check-in/check-out, working time, timeline, monthly hours, leave requests and approval
- **Admission Enquiries** – enquiry pipeline to admission
- **Students** – list, profile, new admission
- **Timetable** – clash-free weekly timetable per class / per teacher
- **Exams & Results** – marks entry, grades, ranks, report card
- **Fees** – dues, collection, receipts, simulated online payment
- **Doubt Solving** – students ask (with photo), teachers answer, resolve & rate, admin reassign
- **Notices** – audience-targeted announcements

Simulated in the prototype: GPS check-in, SMS/WhatsApp alerts, payment gateway, login.
