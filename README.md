# What's Due Tomorrow? - FrontEnd

What's Due Tomorrow? is a web application made for students where they can organize subjects and assignments easily.

## Main Technologies
- Angular
- Angular Materials

## Hints
- You can right click to delete entities

## EndPoints
Base URL: http://localhost:4200

Routes:
- /login (Only not authenticated)
- /register (Only not authenticated)
- /schedule (Only authenticated)
- /subjects (Only authenticated)
- /subjects/:subjectId (Only authenticated)
- /assignments (Only authenticated)
- Every other route redirects to login or shcedule depending on whether the user is authenticated or not

**This project is not deployed!!**

BackEnd for the project: [What's Due Tomorrow? - BackEnd](https://github.com/NicolasBernal1/WhatsDueTomorrow-Backed)
