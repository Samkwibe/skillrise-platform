import { test, expect } from "@playwright/test";
import {
  boardError,
  boardForActor,
  buildBoardInput,
  isJobRow,
  mapBoardRow,
  parseActorList,
  type BoardRow,
} from "../lib/apify/job-adapters";
import fixture from "./fixtures/apify-job-rows.json";

/**
 * Offline check of the LinkedIn / Indeed row mapping in lib/apify/job-adapters.ts.
 * No browser page, no network, no Apify call: the rows come from
 * e2e/fixtures/apify-job-rows.json, trimmed to fields from each actor's
 * dataset schema, plus error rows and the free-tier notice rows a free
 * Apify account can receive.
 *
 *   npx playwright test e2e/apify-job-adapters.spec.ts
 */
const indeedRows: BoardRow[] = fixture.indeed;
const linkedinRows: BoardRow[] = fixture.linkedin;
const linkedinErrorOnly: BoardRow[] = fixture.linkedinErrorOnly;

test.describe("Apify job adapters", () => {
  test("default actor list resolves to the Indeed and LinkedIn adapters", () => {
    const ids = parseActorList("johnvc~indeed-jobs-api, johnvc~linkedin-jobs-api");
    expect(ids).toEqual(["johnvc~indeed-jobs-api", "johnvc~linkedin-jobs-api"]);
    expect(ids.map(boardForActor)).toEqual(["indeed", "linkedin"]);
    expect(boardForActor("johnvc/indeed-jobs-api")).toBe("indeed");
    // Any other actor falls back to the generic path in jobs-scraper.ts.
    expect(boardForActor("someone~their-own-scraper")).toBeNull();
  });

  test("builds each actor's own input keys", () => {
    expect(
      buildBoardInput("indeed", { query: "electrician", location: "Austin, TX", maxItems: 10 }),
    ).toEqual({
      mode: "search",
      keywords: ["electrician"],
      location: "Austin, TX",
      maxResultsPerInput: 10,
      descriptionFormat: "text",
    });
    expect(
      buildBoardInput("linkedin", { query: "python developer", location: "", maxItems: 10 }),
    ).toEqual({ keyword: "python developer", maxJobs: 10 });
  });

  test("maps Indeed job rows and drops error and notice rows", () => {
    const jobs = indeedRows.map((r) => mapBoardRow("indeed", r)).filter(Boolean);
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toEqual({
      id: "apify-indeed-a1b2c3d4e5f60718",
      title: "Junior Data Analyst",
      company: "Northwind Analytics",
      location: "Remote",
      description: "Support the reporting team with weekly dashboards and data cleaning.",
      applyUrl: "https://www.indeed.com/viewjob?jk=a1b2c3d4e5f60718",
      salary: "$55,000 - $65,000 a year",
      employmentType: "Full-time",
      postedAt: Date.parse("2026-10-20T00:00:00.000Z"),
      source: "apify",
      tags: ["indeed"],
    });
    expect(jobs[1]?.salary).toBeUndefined();
  });

  test("maps LinkedIn job rows and drops error and notice rows", () => {
    const jobs = linkedinRows.map((r) => mapBoardRow("linkedin", r)).filter(Boolean);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toEqual({
      id: "apify-linkedin-4300000001",
      title: "Junior Python Developer",
      company: "Harbor Labs",
      location: "New York, NY",
      description: "Build internal tools in Python. Mentorship from senior engineers.",
      applyUrl: "https://www.linkedin.com/jobs/view/4300000001",
      salary: "$80,000.00/yr - $95,000.00/yr",
      employmentType: "Full-time",
      postedAt: Date.parse("2026-10-19T00:00:00.000Z"),
      source: "apify",
      tags: ["linkedin"],
    });
  });

  test("free-tier notice rows are never treated as jobs", () => {
    const notices = [...indeedRows, ...linkedinRows].filter((r) => r.free_tier_notice);
    expect(notices).toHaveLength(3);
    for (const row of notices) {
      expect(isJobRow(row)).toBe(false);
      expect(mapBoardRow("indeed", row)).toBeNull();
      expect(mapBoardRow("linkedin", row)).toBeNull();
    }
  });

  test("reports the actor's error row only when no jobs came back", () => {
    expect(boardError(indeedRows)).toBeUndefined();
    expect(boardError(linkedinErrorOnly)).toBe("Provide a keyword or at least one job URL.");
    // A notice row alone is not an error; it just yields no jobs.
    expect(boardError(indeedRows.filter((r) => r.free_tier_notice))).toBeUndefined();
  });
});
