/**
 * The page for someone deciding whether to put Foothold in front of students.
 *
 * It leads with the two things that actually decide adoption for a school or a
 * youth programme - that there is nothing to install and nothing collected -
 * because those are the questions that stop a pilot before it starts. The
 * limitations section is not modesty; a director who discovers the missing
 * teacher dashboard in week three stops trusting everything else on the page.
 */

import { escapeHtml } from '../highlight.js';

const REPO = 'https://github.com/jbtk-cell/foothold';
const GUIDE = `${REPO}/blob/main/docs/for-educators.md`;
const HANDOUT = `${REPO}/blob/main/docs/session-handout.md`;
const PRIVACY = `${REPO}/blob/main/PRIVACY.md`;

const PLANS = [
  ['8 weeks, one hour a week', 'Modules 1 to 4, through loops'],
  ['10 weeks, one hour a week', 'Modules 1 to 5, through functions'],
  ['12 weeks, ninety minutes', 'Modules 1 to 9, through error handling'],
  ['A full school year', 'All 14 modules'],
];

export function renderTeachers(mount, manifest) {
  const lessons = manifest.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const first = manifest.modules[0].lessons[0];
  const firstHref = `#/lesson/${manifest.modules[0].slug}/${first.slug}`;

  mount.innerHTML = `
    <div class="home teachers">
      <section class="teachers-head">
        <p class="teachers-eyebrow">For teachers, clubs, and libraries</p>
        <h1>Nothing to install.<br>Nothing collected.</h1>
        <p class="hero-sub">
          Foothold is a free ${lessons}-lesson Python course that runs inside a
          browser tab. A real Python interpreter runs on the student's own
          machine, so there is no software to request from IT, no account for
          anyone to create, and no student data leaving the room.
        </p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-large" href="${firstHref}">Try the first lesson</a>
          <a class="btn btn-quiet btn-large" href="${GUIDE}" target="_blank" rel="noopener noreferrer">
            Read the guide for educators
          </a>
        </div>
      </section>

      <section class="spec">
        <h2 class="rule">The answers you need first</h2>
        <dl class="spec-list">
          <div>
            <dt>What do we have to install?</dt>
            <dd>
              Nothing. It is a website. School Chromebooks work, which is
              usually the real question.
            </dd>
          </div>
          <div>
            <dt>What data do you collect on our students?</dt>
            <dd>
              None. No accounts, no email addresses, no analytics, no server
              receiving work. COPPA is triggered by collecting personal
              information from under-13s, and there is no collection here, so
              there is no agreement to sign and no privacy review to sit
              through. <a href="${PRIVACY}" target="_blank" rel="noopener noreferrer">The detail
              a privacy officer will want</a>.
            </dd>
          </div>
          <div>
            <dt>What does it cost?</dt>
            <dd>
              Nothing, with no paid tier and no seat limit. MIT licensed, so you
              can modify it, translate it, or host your own copy without asking.
            </dd>
          </div>
          <div>
            <dt>Do I need to know Python to run it?</dt>
            <dd>
              No. Exercises are graded automatically, hints escalate on their
              own, and a failed check replays the student's program so you can
              ask "should that be zero there?" without reading any code.
            </dd>
          </div>
          <div>
            <dt>What age is it for?</dt>
            <dd>
              About eleven and up. Python is typed as text, so students need to
              read and type comfortably. Younger groups should use Scratch
              first.
            </dd>
          </div>
          <div>
            <dt>What if our internet is bad?</dt>
            <dd>
              Open the site once on each machine and it caches. After that it
              works with the wifi off.
            </dd>
          </div>
        </dl>
      </section>

      <section class="teachers-plans">
        <h2 class="rule">How much fits in a term</h2>
        <p class="teachers-lead">
          ${lessons} lessons, about eight and a half hours for an adult working
          alone. A group of beginners runs roughly two and a half times slower.
          Modules 1 to 5 are the natural stopping point for a short programme,
          because finishing at functions feels like an ending rather than an
          abandonment.
        </p>
        <table class="teachers-table">
          <thead>
            <tr><th scope="col">Programme</th><th scope="col">Realistically covers</th></tr>
          </thead>
          <tbody>
            ${PLANS.map(
              ([span, covers]) => `
                <tr>
                  <th scope="row">${escapeHtml(span)}</th>
                  <td>${escapeHtml(covers)}</td>
                </tr>`
            ).join('')}
          </tbody>
        </table>
      </section>

      <section class="teachers-limits">
        <h2 class="rule">What it does not do</h2>
        <p class="teachers-lead">
          Worth knowing now rather than in week three.
        </p>
        <ul class="teachers-limit-list">
          <li>
            <strong>No teacher dashboard.</strong> No accounts means no roster
            and no remote view of who has done what. You find out by walking
            around the room. If a funder needs progress reports, plan to collect
            them another way.
          </li>
          <li>
            <strong>Progress lives on the machine.</strong> A student on a
            different computer next week starts from an empty page. There is an
            export button for shared labs, and the guide covers how to handle
            it. This is the direct cost of having no accounts.
          </li>
          <li>
            <strong>Everything is read.</strong> No video and no narration, so a
            student with weak reading skills in English will need a partner.
          </li>
          <li>
            <strong>Python only.</strong> No web pages, no games, no graphics.
            The reward is watching your own program work, which lands hard for
            some students and not at all for others.
          </li>
          <li>
            <strong>No classroom has run it yet.</strong> Every exercise is
            tested automatically and the course works in every major browser,
            but Foothold is new and no cohort has been through it. You would be
            early. If that is a problem, wait.
          </li>
        </ul>
      </section>

      <section class="teachers-take">
        <h2 class="rule">Take it with you</h2>
        <div class="teachers-take-grid">
          <a class="teachers-card" href="${GUIDE}" target="_blank" rel="noopener noreferrer">
            <h3>Guide for educators</h3>
            <p>
              Fit, setup, pacing, how to help a stuck student without knowing
              Python, and where beginners predictably stall.
            </p>
          </a>
          <a class="teachers-card" href="${HANDOUT}" target="_blank" rel="noopener noreferrer">
            <h3>One-page session handout</h3>
            <p>
              Print it or forward it to whoever is in the room. Assumes they
              have never written a line of Python.
            </p>
          </a>
          <a class="teachers-card" href="${REPO}" target="_blank" rel="noopener noreferrer">
            <h3>The source</h3>
            <p>
              MIT licensed. Fork it, translate it, or host your own copy so it
              outlives anything we do.
            </p>
          </a>
        </div>
      </section>

      <section class="teachers-ask">
        <h2 class="rule">One ask</h2>
        <p class="teachers-lead">
          If you run this with a group, the most useful thing you can send back
          is where students got stuck, especially for a silly reason. That is
          hard to find out any other way and it is what improves the course.
          <a href="${REPO}/issues" target="_blank" rel="noopener noreferrer">Open an issue</a>,
          or reply to whoever pointed you here.
        </p>
      </section>
    </div>
  `;
}
