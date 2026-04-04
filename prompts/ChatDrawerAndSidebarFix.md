Objective #1: Chatbox Drawer for Mobile View

    Paths Related to this objective:
    - src\app\template\(dashboard)\chat\components
    - src\app\template\(dashboard)\chat\data
    - src\app\template\(dashboard)\chat\page.tsx
    - src\app\template\(dashboard)\chat\use-chat.ts

    1). Now since, it'a all already working, in this template, this is where my original chat system came from, this is static and prototype only.

    2). In my current chat system for student and educator, I wanted the when I press the 3 horizontal line, it shows the drawer in the left side so I can choose the conversation or group chats.

    3). The current collapsable will remain only for Desktop View.

Objective #2: Fix the Sidebar not auto closing after redirected to the routes

    Path Related to this objective:
    - src\components\app-sidebar.tsx

    1). In the sidebar, I noticed that whenever I click the menu items to redirect to that page, the sidebar is not closing, this problem is only for mobile view.