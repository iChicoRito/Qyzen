Objective #1: Educator Learning Material Upload

    Path Related to this Objective:
    - src\app\(educator)\educator\materials
    - src\app\(educator)\educator\materials\components
    - src\app\(educator)\educator\materials\data
    - src\app\(educator)\educator\materials\page.tsx

    1). Here in this page, this is a static and prototype page for materials only, now replace this page for Educator uploading the learning materials and use the real data from the database. Rename all the files that is related for learning materials.

    2). The process here, the educator will upload valid learning materials such as these:

        For PPT:
        .pptx
        .ppsx
        .ppt
        .pdf

        For Words:
        .docx
        .doc
        .pdf
        .rtf

    3). First of all, the educator will choose the tied (subject/section) to upload those files. Uploading the files can be multiple, educator can upload file in different (subject/section) using checkboxes.

    4). In desktop the uploading files should be modal, like the others modal style/layout/design, for mobile, it will turn into drawer like the others drawer style/layout/design.

    5). It should have view, edit and delete for that uploaded files.

    6). In the table, it shows only 1 row per (subject/section).

    7). Use the supabase storage and create a table for "tbl_learning_materials".

Objective #2: Student Learning Material Download

    Paths Related for this Objective:
    - src\app\(student)\student\materials

    1). Here in the student side, this is where the learning materials will show and downloadable for the students side.