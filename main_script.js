import { calendar_courses, aoc_courses, tools_electives } from './data/courses.js';

const $ = id => document.getElementById(id);

// Elements for calendar view and AOC listings
const courseGrid  = $("courseGrid");
const aocButtonsDiv  = $("aocButtons");

const normalise = c => c.replace(/_V/, "").trim();
const wantedCodes = new Map(
  Object.values(calendar_courses)
    .flat()
    .flatMap(i => (Array.isArray(i) ? i : [i]))
    .filter(c => /^[A-Z]{4}(?:_V)? \d{3}$/.test(c.trim()))
    .map(c => [normalise(c), c.trim()])
);
const courses = {};

function updateCourse({course_code, course_title = "", description = "", prerequisites = [], corequisites = []}) {
  const norm = normalise(course_code);
  if (!wantedCodes.has(norm)) return;
  const key = wantedCodes.get(norm);
  const c = courses[key] || (courses[key] = { code: course_code, title: "", desc: "", prereqs: [], coreqs: [] });
  if (!c.title && course_title) c.title = course_title;
  if (!c.desc && description) c.desc = description;
  if (!c.prereqs.length && Array.isArray(prerequisites) && prerequisites.length) c.prereqs = prerequisites;
  if (!c.coreqs.length && Array.isArray(corequisites) && corequisites.length) c.coreqs = corequisites;
}

Promise.all([
  fetch("json/envr_major_core.json").then(r => r.json()),
  fetch("json/new_courses_info.json").then(r => r.json())
])
  .then(([core, info]) => {
    core.forEach(updateCourse);
    info.forEach(updateCourse);
    renderCalendar();
  })
  .catch(e => console.error("Error loading courses:", e));

function renderCalendar() {
  courseGrid.innerHTML = "";

  const prereqSnippet = txt => {
    const i = txt.search(/Prerequisite|Not Open/i);
    return i >= 0 ? txt.slice(i) : "";
  };

  const makeBox = (code, extra = "") => {
    const data = courses[code] || { code };
    const box = document.createElement("div");
    box.className = "course-box" + (extra ? " " + extra : "");
    box.dataset.code = code;
    box.innerHTML = `<div class="course-title">${data.code}${data.title ? " – " + data.title : ""}</div>` +
                    `<div class="course-desc">${prereqSnippet(data.desc || "")}</div>`;
    return box;
  };

  const openToolsPopup = () => {
    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.addEventListener("click", e => e.target === overlay && overlay.remove());

    const popup = document.createElement("div");
    popup.className = "popup";
    popup.innerHTML = `<p>Students should choose one of the following tools electives and it must be completed before 4th year.</p>`;
    tools_electives.forEach(c => popup.appendChild(makeBox(c, "popup-box")));
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  };

  const openAocPopup = () => {
    if (!selectedAoc) {
      alert("Please select an area of concentration.");
      return;
    }
    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.addEventListener("click", e => e.target === overlay && overlay.remove());

    const popup = document.createElement("div");
    popup.className = "popup";

    const close = document.createElement("button");
    close.className = "close-btn";
    close.innerHTML = "✕";
    close.addEventListener("click", () => overlay.remove());
    popup.appendChild(close);

    const title = document.createElement("h3");
    title.textContent = aoc_courses[selectedAoc].title;
    popup.appendChild(title);

    renderAocCourses(selectedAoc, popup);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  };

  [
    { key: "1",   label: "First Year" },
    { key: "2",   label: "Second Year" },
    { key: "3/4", label: "Third & Fourth Years" }
  ].forEach(({ key, label }) => {
    const raw = calendar_courses[key] || [];
    const col = document.createElement("div");
    col.className = "course-column";
    col.innerHTML =
      `<div class="column-header"><h3>${label}</h3><button class="expand-btn" title="Expand">&#x26F6;</button></div>`;

    raw.forEach(item => {
      if (Array.isArray(item)) {
        const group = document.createElement("div");
        group.className = "choice-group";
        group.innerHTML = '<div class="choice-label">Choose one of:</div>';
        item.forEach(c => {
          const b = makeBox(c);
          if (b) group.appendChild(b);
        });
        if (group.querySelector(".course-box")) col.appendChild(group);
      } else if (typeof item === "string" && item.includes("Tools Elective")) {
        const b = document.createElement("div");
        b.className = "course-box";
        b.dataset.code = "TOOLS_ELECTIVE";
        b.innerHTML = '<div class="course-title">Tools Elective</div><div class="course-desc">Click to see more information.</div>';
        b.addEventListener("click", openToolsPopup);
        col.appendChild(b);
      } else if (typeof item === "string" && item.includes("Area of Concentration")) {
        const b = document.createElement("div");
        b.className = "course-box";
        b.dataset.code = "AOC_REQUIREMENT";
        b.innerHTML = `<div class="course-title">${item}</div><div class="course-desc">Click to view requirements.</div>`;
        b.addEventListener("click", openAocPopup);
        col.appendChild(b);
      } else {
        const b = makeBox(item);
        if (b) col.appendChild(b);
      }
    });

    col.querySelector(".expand-btn").addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.className = "popup-overlay";

      const pop = document.createElement("div");
      pop.className = "popup course-column";
      pop.innerHTML = col.innerHTML;

      pop.querySelectorAll(".course-box").forEach(box => {
        const code = box.dataset.code;
        if (code === "TOOLS_ELECTIVE" || code === "AOC_REQUIREMENT") return;
        const c = courses[code] || {};
        box.querySelector(".course-title").textContent =
          `${c.code || code}${c.title ? " – " + c.title : ""}`;
        box.querySelector(".course-desc").textContent = c.desc || "";
      });

      const close = document.createElement("button");
      close.className = "close-btn";
      close.innerHTML = "✕";
      close.addEventListener("click", () => document.body.removeChild(overlay));
      pop.appendChild(close);

      overlay.appendChild(pop);
      document.body.appendChild(overlay);
    });

    courseGrid.appendChild(col);
  });
}

let selectedAoc = null;
let aocCourseDescriptions = {};

fetch('json/aoc_courses.json')
  .then(response => response.json())
  .then(data => {
    aocCourseDescriptions = data.reduce((acc, course) => {
      acc[course.course_code] = {
        title: course.course_title,
        desc: course.course_desc
      };
      return acc;
    }, {});
  })
  .catch(error => console.error('Error loading course descriptions:', error));

function renderAocButtons() {
  Object.entries(aoc_courses).forEach(([key, area]) => {
    const btn = document.createElement("button");
    btn.className = "aoc-button";
    btn.innerText = area.title;
    btn.onclick = () => {
      const isActive = btn.classList.contains("active");
      document.querySelectorAll(".aoc-button").forEach(b => b.classList.remove("active"));

    if (isActive) {
        selectedAoc = null;
    } else {
        btn.classList.add("active");
        selectedAoc = key;
    }
    };
    aocButtonsDiv.appendChild(btn);
  });
}

function renderAocCourses(key, container) {
  if (!container) {
        console.error('No container provided for AOC courses');
        return;
  }
  container.innerHTML = "";
  const area = aoc_courses[key];

  // Create a horizontal container for columns
  const columnsContainer = document.createElement("div");
  columnsContainer.className = "columns-container";
  
  // Add title back after clearing container
  const title = document.createElement("h3");
  title.textContent = area.title;
  container.appendChild(title);
  
  const createColumn = (title, content) => {
    const col = document.createElement("div");
    col.className = "course-column";

    const heading = document.createElement("h3");
    heading.textContent = title;
    col.appendChild(heading);

    content.flat().forEach(course => {
      const box = document.createElement("div");
      box.className = "course-box";

      const titleEl = document.createElement("div");
      titleEl.className = "course-title";
      const courseData = aocCourseDescriptions[course];

      titleEl.textContent = courseData ? `${course} - ${courseData.title}` : course;

      const descEl = document.createElement("div");
      descEl.className = "course-desc";
      descEl.textContent = courseData ? courseData.desc : "Description not available.";

      box.appendChild(titleEl);
      box.appendChild(descEl);
      col.appendChild(box);
    });

    return col;
  };

  if (area.required?.length > 0)
    columnsContainer.appendChild(createColumn("Required Courses", area.required));

  if (Array.isArray(area.oneOf))
    area.oneOf.forEach(group => {
      columnsContainer.appendChild(createColumn("Choose One of the Following", [group]));
    });

  if (Array.isArray(area.threeOf) && area.threeOf.length > 0)
    columnsContainer.appendChild(createColumn("Choose Three of the Following", area.threeOf));

  if (Array.isArray(area.fourOf) && area.fourOf.length > 0)
    columnsContainer.appendChild(createColumn("Choose Four of the Following", area.fourOf));

  // Only append the columns container if it has children
  if (columnsContainer.children.length > 0) {
    container.appendChild(columnsContainer);
  }
}

renderAocButtons();