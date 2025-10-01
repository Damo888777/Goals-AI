# Figma Design Analysis - Detailed Breakdown

## Key Observations from Screenshots

### Today Tab (Empty State)
1. **Eat the Frog Section**:
   - Title: "Eat the frog" (20px, Bold, #344E41)
   - Frog icon: 23.563px size
   - Description: "Choose the one task that will make the biggest impact today." (15px, Light)
   - Empty state text: "No frog for today" / "What is your most important task for today?"
   - Card has rounded corners (15px) with light green background

2. **Today's Tasks Section**:
   - Title: "Todays Tasks" with notes icon
   - Description: "Take action and get a step closer to your dreams."
   - Empty state: "No tasks for today" / "Your day looks clear. Add a task to get started."

### Today Tab (Active State with Task)
**Key Finding**: When there's an active task in "Eat the Frog", it shows:
- Task title (15px, Bold)
- Goal attachment: "No goal attached" (12px, Light)
- Date with calendar icon: "None" (12px, Light)
- Two action buttons side by side:
  - **Complete button** (40x40px, #A3B18A background, checkmark icon)
  - **Pomodoro button** (40x40px, #F2CCC3 background, tomato icon)

### Goals Tab
1. **Trophy Button**: 
   - Yellow/cream background (#EAE2B7)
   - Trophy icon (30x30px)
   - Label: "Trophy" (15px, Bold)

2. **Vision Button**:
   - Shows actual image preview
   - Label: "Vision" (15px, Bold)

3. **Goal Card**:
   - Has image preview area at top (97px height)
   - Title: "Placeholder Title" (14px, Bold)
   - Progress bar below title
   - Emotion badges on right side:
     - "Happy" badge (blue: #BDE0FE)
     - "Proud" badge (purple: #CDB4DB)
     - "+3" counter badge (pink: #FCB9B2)
   - Chevron down button for expansion

### Plan Tab
1. **Toggle Buttons**:
   - "This Week" (active: #364958 background, white text)
   - "Backlog" (inactive: #F5EBE0 background, gray text)

2. **Week Indicator**:
   - Shows date range: "Month.XX.XXXX - Month.XX.XXXX"

3. **Weekday Cards**:
   - Each day shows: "Monday", "Tuesday", etc. (20px)
   - Date below: "Month.xx.xxxx" (15px, Light)
   - Chevron icon on right for expansion
   - Background: #F5EBE0
   - Border: #A3B18A

## Critical Design Details

### Typography Hierarchy
```
Headers: 20px Bold (#364958 or #344E41)
Subheaders: 15px Bold (#364958)
Body: 15px Regular (#364958)
Light body: 15px Light (#344E41 or #364958)
Small: 13px Regular (#364958)
Tiny: 12px Light (#364958)
Info: 10px Regular (#7C7C7C)
```

### Button Specifications
```
Complete Button:
- Size: 40x40px
- Background: #A3B18A
- Border: 1px #9B9B9B
- Border radius: 10px
- Icon: White checkmark

Pomodoro Button:
- Size: 40x40px
- Background: #F2CCC3
- Border: 1px #9B9B9B
- Border radius: 10px
- Icon: Tomato (22x22px)
```

### Task Card States
```
Empty State:
- Centered text
- Bold title + Light description
- No buttons

Active State:
- Left-aligned content
- Task title (15px Bold)
- Goal info (12px Light)
- Date info (12px Light with calendar icon)
- Two action buttons on right
```

### Spacing
```
Screen padding: 36px horizontal
Section gaps: 45px (Today), 43px (Goals)
Card padding: 15px
Task card padding: 15-16px
Header gaps: 8px
Element gaps: 8-10px
Button gaps: 20px horizontal
```

### Colors from Design
```
Backgrounds:
- Screen: #E9EDC9
- Cards: #F5EBE0
- Task cards: rgba(233, 237, 201, 0.4)
- Goal inner: #E9EDC9
- Tab bar: #EAE0D5

Buttons:
- Complete: #A3B18A
- Pomodoro: #F2CCC3
- FAB: #364958
- Trophy: #EAE2B7

Text:
- Primary: #364958
- Secondary: #344E41
- Tertiary: #7C7C7C

Borders:
- Primary: #A3B18A
- Secondary: #9B9B9B

Emotion Badges:
- Happy: #BDE0FE (border: #023047)
- Proud: #CDB4DB (border: #3D405B)
- Counter: #FCB9B2 (border: #BC4749)
```

## What Needs to Be Fixed

1. **Task Card Component**: 
   - Add Complete and Pomodoro buttons for active state
   - Show goal attachment info
   - Show date with calendar icon
   - Proper layout: content on left, buttons on right

2. **Eat the Frog Section**:
   - Title should be "Eat the frog" not "Eat the Frog"
   - Title color: #344E41 (not #364958)
   - Font size: 20px (not 15px)

3. **Goal Card**:
   - Add chevron down button
   - Proper emotion badge layout
   - Image preview area needs proper height (97px)

4. **Plan Tab**:
   - Weekday cards need proper date formatting
   - Toggle buttons need active/inactive states

5. **Typography**:
   - Use proper font weights (300 for Light, 400 for Regular, 700 for Bold)
   - Correct font sizes throughout
