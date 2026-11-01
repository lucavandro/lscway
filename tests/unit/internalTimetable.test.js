import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import {
  hasAdmitsSubsubjects,
  getInternalTimetableApiBase,
  internalTimetableApi,
  internalTimetableRequest,
  checkTeacherHasSubsubjects,
  canEditInternalTimetable,
} from "$lib/internalTimetable.js";

describe("internalTimetable module", () => {
  beforeEach(() => {
    localStorage.clear();
    canEditInternalTimetable.set(false);
  });

  describe("hasAdmitsSubsubjects helper", () => {
    it("returns false for non-arrays or empty arrays", () => {
      expect(hasAdmitsSubsubjects(null)).toBe(false);
      expect(hasAdmitsSubsubjects(undefined)).toBe(false);
      expect(hasAdmitsSubsubjects([])).toBe(false);
      expect(hasAdmitsSubsubjects("string")).toBe(false);
    });

    it("returns false if no subject admits subsubjects", () => {
      const subjects = [
        { id: "MAT", nome: "Matematica", admitsSubsubjects: false, subsubjectIds: [] },
        { id: "ITA", nome: "Italiano", admitsSubsubjects: false },
      ];
      expect(hasAdmitsSubsubjects(subjects)).toBe(false);
    });

    it("returns false if admitsSubsubjects is true but subsubjectIds is empty", () => {
      const subjects = [
        { id: "MATFIS", nome: "Matematica e Fisica", admitsSubsubjects: true, subsubjectIds: [] },
      ];
      expect(hasAdmitsSubsubjects(subjects)).toBe(false);
    });

    it("returns true when at least one subject admits subsubjects with non-empty list", () => {
      const subjects = [
        { id: "MAT", nome: "Matematica", admitsSubsubjects: false, subsubjectIds: [] },
        {
          id: "MATFIS",
          nome: "Matematica e Fisica",
          admitsSubsubjects: true,
          subsubjectIds: ["MAT", "FIS"],
        },
      ];
      expect(hasAdmitsSubsubjects(subjects)).toBe(true);
    });
  });

  describe("API client and request handling", () => {
    it("resolves base API URL correctly", () => {
      const base = getInternalTimetableApiBase();
      expect(typeof base).toBe("string");
      expect(base).toContain("/app/orario/api/v1");
    });

    it("fetches internal timetable successfully", async () => {
      const mockResponse = {
        timetable: { id: "tt_1", nome: "Definitivo" },
        canWrite: true,
        lessons: [
          {
            id: "l_1",
            revision: 1,
            giorno: 1,
            timeSlotId: "slot_1_1",
            classId: "3A",
            subjectId: "MATFIS",
            subsubjectId: "FIS",
            teacherId: "ROSSIM",
          },
        ],
        subjects: [
          { id: "MATFIS", nome: "Matematica e Fisica", admitsSubsubjects: true, subsubjectIds: ["MAT", "FIS"] },
        ],
        classes: [{ id: "3A", nome: "3A" }],
        teachers: [{ id: "ROSSIM", nome: "Mario", cognome: "Rossi" }],
        timeSlots: [{ id: "slot_1_1", giorno: 1, numeroOra: 1 }],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await internalTimetableApi.getInternalTimetable(mockFetch);
      expect(res).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/me/internal-timetable");
      expect(opts.method).toBe("GET");
      expect(opts.credentials).toBeDefined();
    });

    it("assigns subsubject via PUT with payload", async () => {
      const mockPutResponse = {
        item: {
          id: "l_1",
          revision: 2,
          subsubjectId: "MAT",
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPutResponse,
      });

      const res = await internalTimetableApi.assignSubsubject("l_1", "MAT", 1, mockFetch);
      expect(res).toEqual(mockPutResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/me/internal-timetable/l_1");
      expect(opts.method).toBe("PUT");
      expect(JSON.parse(opts.body)).toEqual({
        subsubjectId: "MAT",
        revision: 1,
      });
    });

    it("sends subsubjectId as null when resetting to main subject", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ item: { id: "l_1", revision: 2, subsubjectId: null } }),
      });

      await internalTimetableApi.assignSubsubject("l_1", null, 1, mockFetch);
      const [, opts] = mockFetch.mock.calls[0];
      expect(JSON.parse(opts.body)).toEqual({
        subsubjectId: null,
        revision: 1,
      });
    });

    it("handles 409 Conflict error and attaches current data to error object", async () => {
      const conflictPayload = {
        error: "edition_conflict",
        message: "Dati modificati da un altro utente.",
        current: {
          id: "l_1",
          revision: 4,
          subsubjectId: "FIS",
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => conflictPayload,
      });

      await expect(
        internalTimetableApi.assignSubsubject("l_1", "MAT", 2, mockFetch)
      ).rejects.toMatchObject({
        status: 409,
        data: conflictPayload,
        message: conflictPayload.message,
      });
    });

    it("handles 401 Unauthorized error", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "unauthenticated", message: "Non autenticato" }),
      });

      await expect(
        internalTimetableApi.getInternalTimetable(mockFetch)
      ).rejects.toMatchObject({
        status: 401,
      });
    });
  });

  describe("checkTeacherHasSubsubjects store synchronization", () => {
    it("sets canEditInternalTimetable to true when teacher has admitted subsubjects", async () => {
      const mockData = {
        subjects: [
          { id: "MATFIS", nome: "Matematica e Fisica", admitsSubsubjects: true, subsubjectIds: ["MAT", "FIS"] },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await checkTeacherHasSubsubjects(mockFetch);
      expect(result).toBe(true);
      expect(get(canEditInternalTimetable)).toBe(true);
      expect(localStorage.getItem("lscway_can_edit_internal_timetable")).toBe("true");
    });

    it("sets canEditInternalTimetable to false on 401 Unauthorized and clears storage", async () => {
      canEditInternalTimetable.set(true);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "unauthenticated" }),
      });

      const result = await checkTeacherHasSubsubjects(mockFetch);
      expect(result).toBe(false);
      expect(get(canEditInternalTimetable)).toBe(false);
      expect(localStorage.getItem("lscway_can_edit_internal_timetable")).toBeNull();
    });
  });
});
