HEADSTART ALGEBRA WEBSITE
=========================
Open index.html to start. Everything is plain HTML, CSS and JavaScript, so you can edit it in any text editor.
Upload the whole folder to your school web space (or open index.html straight from the folder to try it).

FOLDERS
  index.html, lesson-1.html ... lesson-7.html, quiz.html, game.html, glossary.html, cheatsheet.html
  assets/    style.css (colours are the variables at the top), app.js, quiz.js, quiz-data.js (all quiz questions),
              game.css, monsters.js (the monsters), questions.js (game question maker), game.js (the game)
  lessons/   the 7 booklets (.docx) and a zip of all of them
  videos/    the 14 lesson videos (.mp4), two per lesson
  captions/  subtitle files (.vtt), one per video
  posters/   the picture shown before a video is played

REPLACING OR ADDING A VIDEO
  Every lesson page has a "Watch" section with two video cards (look for <div class="card vcard h" ...>).
  To swap a video, put the new .mp4 in videos/ with the same file name. To add a third video, copy a whole video card,
  paste it below the others, and change the id, the video file name and the title.
  Captions: the text lives in assets/captions.js (and as .vtt files in captions/). Delete data-captions="..." from a
  video to switch captions off for it.

ADDING OR CHANGING QUIZ QUESTIONS
  Open assets/quiz-data.js. Each line is one question. l = lesson number, q = question, c = correct answer,
  w = three wrong answers, e = explanation. Use x^2 for x squared and [a|b] for a fraction.

PROGRESS
  Ticks, finished lessons and quiz scores are saved in each student's own browser. Nothing is sent anywhere.
  Students can clear it with the "Reset my progress" button on the home page.
