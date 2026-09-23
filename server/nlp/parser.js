import nlp from 'compromise';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

// ---------- constants ----------
const COMPONENTS = {
    theory: ['CCA1', 'Midsem', 'CCA2', 'Endsem'],
    lab: ['LCA1', 'LCA2', 'LCA3'],
};
const COMPONENT_LOOKUP = new Map(
    Object.values(COMPONENTS).flat().map((c) => [c.toLowerCase(), c])
);

const DATE_FORMATS = [
    'D MMM YYYY', 'D MMMM YYYY', 'MMM D YYYY', 'MMMM D YYYY',
    'D/M/YYYY', 'D-M-YYYY', 'YYYY-MM-DD',
    'D MMM', 'D MMMM', 'MMM D', 'MMMM D', 'D/M', 'D-M',
];
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// ---------- helpers ----------
function inferDeadlineType(title) {
    if (/\b(exam|test|quiz|viva)\b/i.test(title)) return 'exam';
    if (/\b(lab|practical)\b/i.test(title)) return 'lab';
    if (/\bproject\b/i.test(title)) return 'project';
    return 'assignment';
}

/** "28 Oct", "28th October 2026", "Oct 28", "28/10", "tomorrow", "friday" -> ISO string, or null */
function parseDate(raw) {
    const today = dayjs().startOf('day');
    const lower = raw.toLowerCase();

    // relative words
    if (/\btoday\b/.test(lower)) return today.endOf('day').toISOString();
    if (/\btomorrow\b/.test(lower)) return today.add(1, 'day').endOf('day').toISOString();
    const wd = WEEKDAYS.findIndex((d) => lower.includes(d));
    if (wd !== -1) {
        let diff = (wd - today.day() + 7) % 7;
        if (diff === 0) diff = 7; // "friday" said on a friday means next week
        return today.add(diff, 'day').endOf('day').toISOString();
    }

    // absolute dates: compromise isolates the date phrase, dayjs parses it
    const phrase = nlp(raw).match('#Date+').text() || raw;
    const clean = phrase
        .replace(/(\d+)(st|nd|rd|th)\b/gi, '$1')
        .replace(/\bof\b|,/gi, ' ')
        .replace(/\bsept\b/i, 'Sep')
        .replace(/\s+\d{1,2}(:\d{2})?\s*(am|pm)\b.*$/i, '') // drop a trailing time
        .replace(/\s+/g, ' ')
        .trim();

    for (const fmt of DATE_FORMATS) {
        let d = dayjs(clean, fmt, true);
        if (!d.isValid()) continue;
        // no year given and the date already passed -> assume next year
        if (!fmt.includes('YYYY') && d.isBefore(today)) d = d.add(1, 'year');
        return d.endOf('day').toISOString();
    }
    return null;
}

// ---------- line handlers ----------
function parseSubjectLine(line) {
    // Add <name> [(CODE)] [,] <theory|lab>, <credits> credits
    const m = line.match(
        /^add\s+(.+?)\s*(?:\(([^)]+)\))?\s*,?\s*(theory|lab)\s*,?\s*(\d+(?:\.\d+)?)\s*credits?\b/i
    );
    if (!m) return null;
    return {
        name: m[1].replace(/,\s*$/, '').trim(),
        code: m[2]?.trim() || '',
        type: m[3].toLowerCase(),
        credits: Number(m[4]),
        markingScheme: [],
    };
}

function parseMarkingLine(line) {
    // Marking: CCA1/15, Midsem/30, ...   |   Marking for DBMS: LCA1/25, ...
    const m = line.match(/^marking(?:\s+for\s+(.+?))?\s*:\s*(.+)$/i);
    if (!m) return null;

    const components = [];
    const problems = [];
    for (const part of m[2].split(',').map((p) => p.trim()).filter(Boolean)) {
        const c = part.match(/^([A-Za-z]+\d?)\s*\/\s*(\d+(?:\.\d+)?)$/);
        const name = c && COMPONENT_LOOKUP.get(c[1].toLowerCase());
        if (!name) {
            problems.push(`Unknown marking component "${part}"`);
            continue;
        }
        components.push({ name, maxMarks: Number(c[2]) });
    }
    return { subjectName: m[1]?.trim() || null, components, problems };
}

function parseDeadlineLine(line) {
    // Deadline: <title> for <subject> on/due/due on <date>
    const m = line.match(/^deadline\s*:\s*(.+)\s+for\s+(.+?)\s+(?:on|due\s+on|due)\s+(.+)$/i);
    if (!m) return null;
    return {
        title: m[1].trim(),
        subjectName: m[2].trim(),
        type: inferDeadlineType(m[1]),
        dueDate: parseDate(m[3].trim()),
        rawDate: m[3].trim(),
    };
}

// ---------- main ----------
export function parseSmartAdd(text) {
    const result = { subjects: [], deadlines: [], warnings: [] };

    // newline = hard split; compromise handles sentence boundaries inside a line
    const sentences = text
        .split(/\r?\n/)
        .flatMap((line) => nlp(line).sentences().out('array'))
        .map((s) => s.replace(/[.;]+$/, '').trim())
        .filter(Boolean);

    let lastSubject = null;

    for (const s of sentences) {
        const subject = parseSubjectLine(s);
        if (subject) {
            result.subjects.push(subject);
            lastSubject = subject;
            continue;
        }

        const marking = parseMarkingLine(s);
        if (marking) {
            const target = marking.subjectName
                ? result.subjects.find((x) => x.name.toLowerCase() === marking.subjectName.toLowerCase())
                : lastSubject;
            if (!target) {
                result.warnings.push(
                    `Marking has no subject to attach to: "${s}" (put it after an "Add ..." line, or use "Marking for <subject>: ...")`
                );
                continue;
            }
            result.warnings.push(...marking.problems);
            for (const c of marking.components) {
                if (COMPONENTS[target.type].includes(c.name)) target.markingScheme.push(c);
                else result.warnings.push(`${c.name} is not a ${target.type} component (${target.name})`);
            }
            continue;
        }

        const deadline = parseDeadlineLine(s);
        if (deadline) {
            const { rawDate, ...d } = deadline;
            if (!d.dueDate) {
                result.warnings.push(`Could not read the date "${rawDate}" for "${d.title}"`);
                continue;
            }
            result.deadlines.push(d);
            continue;
        }

        result.warnings.push(`Didn't understand: "${s}"`);
    }

    return result;
}