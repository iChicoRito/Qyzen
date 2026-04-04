Objective #1: Real-time Group Chats for Students with their Educator

    Student Paths Related to this objective:
    - src\app\(student)\student\chats
    - src\app\(student)\student\chats\components
    - src\app\(student)\student\chats\data
    - src\app\(student)\student\chats\page.tsx
    - src\app\(student)\student\chats\use-chat.ts

    Database Referrences:
    - database\functions
    - database\policies
    - database\schema
    - database\sql

    1). On these page are all static and for prototypes only, now I wanted to replace these all pages with real data came from the database.

    2). Here in this page, instead of individual users/student, this chat is build only for group chat purposes for their enrolled Subject/Section and along with their enrolled educator.

    3). For visual instructions, I provide an image that has indicator that needs changes on the UI and informations for this objective.

    4). Ensure that all of the layout is accurately responsive for both Desktop and Mobile View.

Objective #2: Educator Group Chat Creation Minor Revisions

    1). In the src\app\(educator)\educator\group-chats, Make the creation page is like the other creation page, with datatables, modal, deletion, view and other.

    2). In the page it shows the dashboard cards of the group chats and data table.
    
    3). Use the add-groupchat-modal.tsx for adding the group chats, view-groupchat-modal.tsx for viewing the group chat information created.

    4). Then the rest like delete-confirmation-modal, the layout should be like the others.

    5). I wanted that it most likely the others page.


Objective #3: Minor Revision and Changes to the Educator and Student Chats

    1). In the chats, I noticed that if I tried to chat as educator or student, it has already an icon for seen even though there's no user seen that message. Fix that.

    2). In the student chats, i wanted to add an interval for the students messages around 10 seconds before that chat again. It shows the indicator on the "Send" icon the timer or countdown or the text field will be disabled and it display the countdown there.

    3). I also noticed that whenver there's a new chat in the conversation, it won't go down. I wanted that if there's a new chat, it automatically scrolldown (remember, only if there's a new chat, not initial).