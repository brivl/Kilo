I'm building a personal mobile fitness app called Kilo (React Native / Expo). I need help designing a clean, modern, light-themed UI. The  
 app is currently functional but styled with placeholder dark colors — I want a proper design system.

What the app does:

- Daily food log with macro tracking (protein/carbs/fat)
- Gym workout journal (sessions + sets)
- Training plan builder
- Body weight + progress charts

Target user: Solo fitness enthusiast who wants a no-nonsense tracker. Think MyFitnessPal UX but cleaner and lighter.

Screens to design (in priority order):

1. Food log — daily view with macro ring at top, meal sections (Breakfast/Lunch/Dinner/Snacks), each with a "+ Log food" button and food  
   entry rows
2. Food search — search bar, recent foods list, API results list, "+ Add manually" button
3. Add food form — food name, quantity, unit chips, calories, protein/carbs/fat inputs, save button
4. Gym journal — workout session list, add session button
5. Progress — body weight chart, macro history charts

Current color palette (light theme I want to redesign):

- Background: #f8fafc
- Primary text: #0f172a
- Secondary text: #64748b
- Accent: #4f46e5 (indigo)
- Macro colors: protein #6ee7b7 (green), carbs #93c5fd (blue), fat #fca5a5 (red)

Constraints:

- React Native (no web CSS tricks — everything must be achievable with StyleSheet)
- All touch targets minimum 44×44pt
- Light mode only for now (dark mode later)
- No gradients or heavy shadows — keep it flat and readable

Please design the Food Log screen first with a full color palette and component breakdown I can implement directly in React Native
StyleSheet.
