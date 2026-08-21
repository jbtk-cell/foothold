# Watching the first five learners

Everything about Foothold has been tested except the only thing that matters.
CI proves all 60 exercises are solvable, that the grader agrees with itself,
and that the site runs in three browser engines. None of that is evidence that
anyone learns Python from it.

Five people, an hour each, will tell you more than every check in the
repository. This is how to run those hours so they produce something you can
act on.

## Who

People who have never programmed. Not a friend who did a bit of HTML, and not
a computer science student between terms. The course is written for someone
who has never seen a variable, and only that person can tell you whether it
works.

Five is enough. The same three problems will show up in the first three
sessions, and the fourth and fifth confirm you were not unlucky.

## The rule

**Say nothing.** This is the whole method and it is harder than it sounds. When
they get stuck, you will know exactly what to say, and saying it destroys the
only data you came for. A learner alone at midnight has no one leaning over
their shoulder.

If they ask you a direct question, write it down and say "try what seems right
to you". Every question they ask you is a sentence the lesson should have
contained.

## What to write down

Four things, and nothing else:

1. **Where they stopped reading.** Watch their eyes, or ask them to scroll as
   they read. Prose nobody reaches may as well be deleted.
2. **Every place they were stuck for more than a minute.** Note the lesson and
   what they tried. Do not note what you think the fix is; that comes later.
3. **Every question they asked out loud**, in their words, not yours.
4. **The moment they first looked pleased.** If it never comes, that is the
   most important finding in the session.

## Where it will probably break

Guesses, worth having in mind so you notice them rather than explaining them
away:

- The gap between reading `print("Hello")` and typing it themselves.
- The first traceback. Lesson 2 of module 1 exists because of this, and it may
  not be enough.
- Indentation, the first time a loop needs it.
- Knowing which button to press. Run and Check do different things, and that
  distinction is obvious only to someone who already knows what tests are.

## Afterwards

Open one issue per problem, labelled `lesson`, quoting what the learner
actually said. A report that says "the explanation of loops is confusing" is
not actionable. One that says "she read 'iterate' three times, then asked what
it meant" names the sentence to cut.

Fix the three that showed up more than once. Ignore the rest until another
session repeats them.

## Then, and only then, post it

Launching before this is launching a course that has never taught anybody. If
the first five sessions go well, that is also the only honest basis for
saying, later, that it helped people.
