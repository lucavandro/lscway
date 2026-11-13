import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPersonalSubstitutionsApiBase,
  fetchPersonalSubstitutions,
  fetchPersonalNotifications,
  acknowledgeSubstitution,
  personalSubstitutionsStore,
  unreadSubstitutionsCount,
  markSubstitutionAcknowledgedLocally,
  cleanupPersonalSubstitutions,
  pollPersonalNotifications,
  getSubstitutionTimestamp,
  sortSubstitutionsRecentFirst,
} from "../../src/lib/personalSubstitutions.js";
import { get } from "svelte/store";

describe("personalSubstitutions client library", () => {
  beforeEach(() => {
    cleanupPersonalSubstitutions();
    vi.restoreAllMocks();
  });

  it("resolves the default API base path correctly", () => {
    const base = getPersonalSubstitutionsApiBase();
    expect(typeof base).toBe("string");
    expect(base).toContain("/app/orario/api/v1");
  });

  it("fetches personal substitutions successfully via GET /me/substitutions", async () => {
    const mockResponse = {
      teacherName: "Mario Rossi",
      teacherEmail: "rossi@lscortese.com",
      substitutions: [
        {
          id: "sub_1",
          data: "2026-11-13",
          giorno: 5,
          ora: "VEN — I ora",
          classe: { id: "2B", nome: "2B" },
          presaVisione: { stato: "inviata", data: null },
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await fetchPersonalSubstitutions(mockFetch);
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/me/substitutions"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Accept: "application/json" }),
      })
    );
  });

  it("fetches notifications and unreadCount via GET /me/notifications", async () => {
    const mockResponse = {
      items: [
        {
          id: "sub_1",
          presaVisione: { stato: "inviata", data: null },
        },
        {
          id: "sub_2",
          presaVisione: { stato: "presa_visione", data: "2026-11-13T08:00:00Z" },
        },
      ],
      unreadCount: 1,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await fetchPersonalNotifications(mockFetch);
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/me/notifications"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("sends empty JSON object body for acknowledgment via POST", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ acknowledged: true }),
    });

    const result = await acknowledgeSubstitution("sub_123", mockFetch);
    expect(result).toEqual({ acknowledged: true });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/me/substitutions/sub_123/acknowledgment"),
      expect.objectContaining({
        method: "POST",
        body: "{}",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
      })
    );
  });

  it("properly handles error 401 (unauthorized / session expired)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "unauthorized" }),
    });

    await expect(fetchPersonalSubstitutions(mockFetch)).rejects.toThrow(
      /Sessione assente o scaduta/
    );
  });

  it("properly handles error 403 (no active teacher)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: "forbidden" }),
    });

    await expect(fetchPersonalSubstitutions(mockFetch)).rejects.toThrow(
      /Nessun docente attivo associato/
    );
  });

  it("properly handles error 404 (not found / foreign)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await expect(acknowledgeSubstitution("sub_non_existent", mockFetch)).rejects.toThrow(
      /Sostituzione inesistente/
    );
  });

  it("properly handles error 422 (invalid request)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: "Il corpo deve essere vuoto." }),
    });

    await expect(acknowledgeSubstitution("sub_1", mockFetch)).rejects.toThrow(
      "Il corpo deve essere vuoto."
    );
  });

  it("updates local state and unread count via markSubstitutionAcknowledgedLocally", () => {
    personalSubstitutionsStore.set({
      teacherName: "Mario Rossi",
      teacherEmail: "rossi@lscortese.com",
      substitutions: [
        { id: "sub_1", presaVisione: { stato: "inviata", data: null } },
        { id: "sub_2", presaVisione: { stato: "inviata", data: null } },
      ],
      loaded: true,
      error: null,
    });
    unreadSubstitutionsCount.set(2);

    markSubstitutionAcknowledgedLocally("sub_1");

    const state = get(personalSubstitutionsStore);
    expect(state.substitutions[0].presaVisione.stato).toBe("presa_visione");
    expect(state.substitutions[0].presaVisione.data).toBeTruthy();
    expect(get(unreadSubstitutionsCount)).toBe(1);
  });

  it("cleans up store and timer on cleanupPersonalSubstitutions", () => {
    unreadSubstitutionsCount.set(5);
    personalSubstitutionsStore.set({
      teacherName: "Mario Rossi",
      teacherEmail: "rossi@lscortese.com",
      substitutions: [{ id: "1" }],
      loaded: true,
      error: null,
    });

    cleanupPersonalSubstitutions();

    expect(get(unreadSubstitutionsCount)).toBe(0);
    const state = get(personalSubstitutionsStore);
    expect(state.substitutions).toEqual([]);
    expect(state.teacherName).toBe("");
  });

  it("prevents overlapping concurrent polling requests", async () => {
    let resolveFirst;
    const slowPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const mockFetch = vi.fn().mockImplementation(() => slowPromise);

    const call1 = pollPersonalNotifications(mockFetch);
    const call2 = pollPersonalNotifications(mockFetch);

    // Second call should return null immediately without calling fetch
    const result2 = await call2;
    expect(result2).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    resolveFirst({
      ok: true,
      status: 200,
      json: async () => ({ items: [], unreadCount: 0 }),
    });

    await call1;
  });

  describe("sortSubstitutionsRecentFirst", () => {
    it("sorts substitutions by date descending (most recent first)", () => {
      const input = [
        { id: "1", data: "2026-11-10", ora: "08:55" },
        { id: "2", data: "2026-11-20", ora: "08:55" },
        { id: "3", data: "2026-11-13", ora: "08:55" },
      ];

      const sorted = sortSubstitutionsRecentFirst(input);
      expect(sorted.map((s) => s.id)).toEqual(["2", "3", "1"]);
      // Does not mutate the original array
      expect(input.map((s) => s.id)).toEqual(["1", "2", "3"]);
    });

    it("sorts same day substitutions by hour or time slot descending", () => {
      const input = [
        { id: "morning", data: "2026-11-13", ora: "08:55" },
        { id: "noon", data: "2026-11-13", ora: "11:40" },
        { id: "early", data: "2026-11-13", ora: "08:00" },
      ];

      const sorted = sortSubstitutionsRecentFirst(input);
      expect(sorted.map((s) => s.id)).toEqual(["noon", "morning", "early"]);
    });

    it("sorts Roman numeral hours properly within the same day", () => {
      const input = [
        { id: "sub_1", data: "2026-11-13", ora: "VEN — I ora" },
        { id: "sub_3", data: "2026-11-13", ora: "VEN — III ora" },
        { id: "sub_5", data: "2026-11-13", ora: "VEN — V ora" },
      ];

      const sorted = sortSubstitutionsRecentFirst(input);
      expect(sorted.map((s) => s.id)).toEqual(["sub_5", "sub_3", "sub_1"]);
    });

    it("supports Italian date format DD/MM/YYYY alongside ISO YYYY-MM-DD", () => {
      const input = [
        { id: "older", data: "05/11/2026" },
        { id: "newer", data: "2026-11-18" },
        { id: "middle", data: "12/11/2026" },
      ];

      const sorted = sortSubstitutionsRecentFirst(input);
      expect(sorted.map((s) => s.id)).toEqual(["newer", "middle", "older"]);
    });

    it("falls back to pubblicataIl timestamp when data is missing or identical", () => {
      const input = [
        { id: "pub_first", pubblicataIl: "2026-11-13T08:00:00Z" },
        { id: "pub_later", pubblicataIl: "2026-11-13T10:30:00Z" },
      ];

      const sorted = sortSubstitutionsRecentFirst(input);
      expect(sorted.map((s) => s.id)).toEqual(["pub_later", "pub_first"]);
    });

    it("uses descending id as final tie-breaker", () => {
      const input = [
        { id: 10, data: "2026-11-13", ora: "08:55" },
        { id: 25, data: "2026-11-13", ora: "08:55" },
        { id: 15, data: "2026-11-13", ora: "08:55" },
      ];

      const sorted = sortSubstitutionsRecentFirst(input);
      expect(sorted.map((s) => s.id)).toEqual([25, 15, 10]);
    });

    it("handles null, undefined or empty arrays safely", () => {
      expect(sortSubstitutionsRecentFirst(null)).toEqual([]);
      expect(sortSubstitutionsRecentFirst(undefined)).toEqual([]);
      expect(sortSubstitutionsRecentFirst([])).toEqual([]);
    });
  });
});
