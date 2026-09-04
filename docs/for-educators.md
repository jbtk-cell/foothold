# Running Foothold with a group

For anyone deciding whether to put this in front of students, and for whoever
ends up in the room on the day. You do not need to know Python to run it. The
section on [helping someone who is stuck](#helping-someone-who-is-stuck) is
written on the assumption that you do not.

- [Is this the right fit](#is-this-the-right-fit)
- [What you need](#what-you-need)
- [The privacy answer](#the-privacy-answer)
- [Before the first session](#before-the-first-session)
- [How long it takes](#how-long-it-takes)
- [Helping someone who is stuck](#helping-someone-who-is-stuck)
- [Where students predictably stall](#where-students-predictably-stall)
- [Saving progress on shared computers](#saving-progress-on-shared-computers)
- [What Foothold does not do](#what-foothold-does-not-do)
- [Cost and licence](#cost-and-licence)

---

## Is this the right fit

Foothold teaches Python, which is typed out as text rather than dragged
together as blocks. That puts a floor on age. Students need to read
comfortably, type without hunting for every key, and tolerate a computer being
pedantic about a missing bracket. In practice that means about eleven and up,
and a confident ten-year-old will manage.

If your students are younger than that, use Scratch instead and come back in a
couple of years. Foothold will frustrate an eight-year-old, and the frustration
will teach them that programming is not for them, which is the opposite of the
point.

It suits a weekly club, an elective, a library programme, a summer session, or
a student working alone at their own pace. It is not a drop-in activity, since
the lessons build on each other and someone joining at week six will be lost.

## What you need

A computer with a web browser, one per student or one per pair. That is the
whole list. There is nothing to install, no account to create, no licence key,
no class code, and no software request to file with your IT department.

School Chromebooks work, which is usually the question being asked. So do old
laptops, library desktops, and phones in a pinch, though a phone keyboard makes
typing code miserable and a tablet with a keyboard is much better.

The first visit downloads the Python interpreter, which is a large file and
takes anywhere from ten seconds to a minute depending on the connection. After
that it is cached and the site works with the wifi switched off. If your
building has bad internet, open the site on each machine once while you have
signal and the sessions themselves will be fine.

## The privacy answer

This is usually the part that decides whether a school will let you use
something, so here it is plainly.

Foothold collects nothing. There are no accounts, no email addresses, no
analytics, no cookies, and no server receiving student work. Everything runs
inside the browser tab. The code a student writes never leaves the machine they
wrote it on, because there is nowhere for it to go.

That means COPPA does not apply, because COPPA is triggered by collecting
personal information from children under thirteen and there is no collection
happening. It also means there is no vendor agreement to sign, no data
processing addendum, and no privacy review to sit through, because there is no
data and no vendor.

[PRIVACY.md](../PRIVACY.md) states this in the detail a district privacy
officer will want, including the two pieces of information stored in the
browser itself and how to clear them.

## Before the first session

Open the site on the machines the students will use, and let each one finish
loading Python once. This warms the cache and surfaces any network filter
problem while you still have time to fix it.

Work through the first module yourself. It is four lessons and about half an
hour, and it means you have felt the thing they are about to feel. If you have
never programmed either, this is genuinely enough preparation to run a first
session.

Check that the site is not blocked. Some school filters block anything they
have not seen before, and some block the content delivery networks that Python
is fetched from. If Python fails to load, the page says which of those it is
rather than hanging silently, and you can hand that message to your IT
department.

## How long it takes

The course is 60 lessons across 14 modules. The published estimates add up to
about eight and a half hours, but those are the times for a motivated adult
working alone without interruption. A group of beginners runs slower, typically
two to three times slower once you account for typing speed, distraction, and
the fact that a room of students does not move at one pace.

Assume a sixty-minute session yields about forty-five minutes of actual work,
and that students cover roughly two and a half minutes of session time for every
one minute of published estimate. That gives you:

| Programme | Realistically covers |
|---|---|
| 8 weeks, one hour a week | Modules 1 to 4, through loops |
| 10 weeks, one hour a week | Modules 1 to 5, through functions |
| 12 weeks, ninety minutes | Modules 1 to 9, through error handling |
| A full school year, or two terms | All 14 modules |

Those are starting points, not promises. Adjust after week two, when you can
see your own group's pace.

Modules 1 to 5 are the natural stopping point for a short programme. By the end
of functions a student has the concepts that make everything else possible, and
finishing there feels like an ending rather than an abandonment.

## Helping someone who is stuck

You do not need to know the answer. In most cases you should not give it even
if you do. Work through these in order.

**Ask them to read the error out loud.** Python's errors name the line and say
what went wrong. Beginners skip them entirely because the text looks like
noise, and the single most useful habit you can build is reading the message
before doing anything else. Module 1 has a whole lesson on this. About half of
what looks like being stuck is a message that was never read.

**Send them to the hints.** Every exercise has three, and they escalate. The
first nudges, the second is specific, the third is close to the answer. Tell
them to take one at a time and try again in between. A student who takes hint
one and solves it has learned more than one who took hint three.

**Press "Show me why".** When a check fails, this drops them into a recording of
their own program. Dragging the slider steps through it a line at a time, with
the variables listed beside the code and anything that changed on that step
marked. This is the part of Foothold worth teaching them to use, because it
answers the question they cannot otherwise answer: not what the code says, but
what it actually did.

Say "let's watch it run" and scrub through it together. You do not need to
understand Python to point at a variable that stayed zero when the student
expected it to climb, and asking "should that be zero there?" is usually the
entire intervention.

**Compare with a neighbour.** Two students with the same error will often spot
each other's typo faster than either spots their own.

**Then, and only then, the solution.** Every lesson has one. It is there so
nobody sits blocked for twenty minutes and gives up on programming. If you have
gone through the steps above and the student is still stuck, show it, read
through what it does together, and move on. A student who copies one solution
and continues is in a far better position than a student who quits.

If a program hangs, it is almost certainly an accidental infinite loop. It gets
killed automatically after ten seconds and the page recovers on its own, so no
work is lost and nobody needs to restart anything.

## Where students predictably stall

Flagged in advance so you are not surprised. This list comes from the structure
of the material and from how beginners generally fail, not from watching a
class use it, since Foothold is new enough that no cohort has been through it
yet. Treat it as a heads-up, not a guarantee.

Lesson one asks for exact output, capital letters and punctuation included.
Expect a first wave of failures that are pure typing. This is deliberate,
because computers are pedantic and learning that early costs less than learning
it later, but it does mean the very first exercise generates the most confusion
per minute of anything in the course. Warn them.

Indentation arrives in module 3 and is the first thing that is a real rule
rather than a typo. Python decides what belongs inside an `if` based on how far
the line is pushed across. Students who have never met a language where
whitespace matters find this genuinely surprising.

Loops in module 4 produce the first infinite loop, which is a rite of passage.
Tell the room in advance that it will happen, that the page kills it after ten
seconds, and that nothing breaks. Otherwise the student who does it first
thinks they broke the computer.

The `return` versus `print` distinction in module 5 is the conceptual hurdle of
the whole course. A function that prints looks identical to a function that
returns until you try to use the answer for anything. The lesson tackles it
head-on, but expect it to take longer than the estimate says and expect to
revisit it later. If a student is confused in module 6, check whether this is
really what is wrong.

## Saving progress on shared computers

Progress is stored in the browser on the machine being used, which has one
consequence worth planning around. A student who uses a different computer next
week, or a different browser, or a machine that wipes itself on logout, will
find their progress gone. On a lab of shared machines without individual logins,
students may also see each other's progress.

This is a direct result of there being no accounts, which is the same decision
that removes the privacy problem. It is a real tradeoff rather than an oversight.

Three ways to handle it, depending on your setup. If students log into
individual profiles, progress follows them and there is nothing to do. If
machines are shared, use the export button on the home page at the end of each
session, which saves a small file the student keeps and re-imports next time.
If neither is practical, have students note which lesson they finished and
navigate back to it, which takes ten seconds and works everywhere.

Progress is a convenience, not a gradebook. Nothing is lost from the course
itself if it disappears.

## What Foothold does not do

Worth knowing before you commit, so it is not a surprise in week three.

There is no teacher dashboard and no way to see your students' progress from
your own machine. No accounts means no roster, which means no remote view of
who has done what. You find out by walking around the room or asking. If you
need progress reporting for a funder or an administrator, Foothold will not
produce it and you should plan to collect it another way.

There is no grade export, no certificate of completion tied to a verified
identity, and no assessment beyond the exercise checks themselves.

There is no video, and no audio narration. Everything is read. For a student
with weak reading skills in your programme's language, that is a real barrier
and you should pair them with someone.

It teaches Python only. It does not cover web development, game development, or
the visual work that often keeps younger students engaged. The reward here is
watching your own program work, which motivates some students strongly and
leaves others cold.

## Cost and licence

Free, and free in a way that does not turn into a bill later. There is no paid
tier, no seat limit, no trial period, and nothing to buy. It is released under
the MIT licence, which means you can use it with any number of students,
translate it, modify it, host your own copy, or fold parts of it into your own
curriculum, without asking anyone.

The source is at
[github.com/jbtk-cell/foothold](https://github.com/jbtk-cell/foothold). If your
organisation wants a copy hosted on its own domain so it survives independently
of anything we do, the repository builds to static files and can be served from
anywhere.

---

If you run this with a group, the thing most worth sending back is where your
students got stuck. That is the feedback that improves the course, and it is
hard to get any other way. Open an issue on GitHub, or bring it up however is
easiest.
