Objective #1: Student Real-time Assessment Monitoring

    Paths Related to this objective:
    
    Educator Side:
    - src\app\(educator)\educator\realtime-monitoring

    Student Side:
    - src/app/(student)/student/assessment/take-quiz
    - src/app/(student)/student/assessment/quiz
    - src/app/(student)/student/assessment/scores

    Database Referrences:
    - database\functions
    - database\policies
    - database\schema
    - database\sql

    1). In these page, this page is static and prototype for tasks, now I wanted to replace all file names that is related from tasks to "real-time" names.

    2). The purpose of these page is the educator has an access to monitor their students in real-time of their assessment.

    3). Here I wanted that it shows all the wired section/subject/module/quiz of the enrolled student to that educator.

    4). In the view modal, it shows the list of the students that is enrolled on the educator section/subejects/modules and it shows their status such us (OFFLINE, ONLINE, ANSWERING, FINISHED)

        - OFFLINE   (it shows this status if the students is offline or not logged in yet)
        - ONLINE    (it shows this status if the students is online or logged in but not answering the assessment yet)
        - ANSWERING (it shows this status if the students is on-going taking the quiz)
        - FINISHED  (it shows this status if the students is already finished that specific module/quiz)

    5). In the tables, it displays only 1 row per section/subject/module. In the same row, it shows the status, how many student is enrolled to that educator/section/subject/module.