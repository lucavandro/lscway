<script>
  import { onMount, onDestroy } from "svelte";
  import { base } from "$app/paths";
  import { userEmail, isTeacher, tableFontScale } from "$lib/stores.js";
  import { clockStore, weekdays, hours, getDay } from "$lib/dateutils.js";
  import {
    internalTimetableApi,
    hasAdmitsSubsubjects,
    canEditInternalTimetable,
  } from "$lib/internalTimetable.js";

  let loading = true;
  let errorMessage = "";
  let isUnauthorized = false;
  let successToast = "";
  let toastTimeout = null;

  let timetable = null;
  let canWrite = true;
  let lessons = [];
  let subjects = [];
  let classes = [];
  let teachers = [];
  let timeSlots = [];

  let subjectsMap = new Map();
  let classesMap = new Map();
  let timeSlotsMap = new Map();
  let hasSubsubjectsAdmitted = false;

  // Scroll indicator
  let isScrolledEnd = false;
  let currentDay = getDay();

  // Modal State
  let isModalOpen = false;
  let selectedLesson = null;
  let modalParentSubject = null;
  let modalSubsubjects = [];
  let selectedSubsubjectId = null;
  let isSaving = false;
  let modalError = "";
  let modalConflictNotice = "";

  const weekdayFullNames = {
    LUN: "Lunedì",
    MAR: "Martedì",
    MER: "Mercoledì",
    GIO: "Giovedì",
    VEN: "Venerdì",
  };

  function showToast(msg) {
    if (toastTimeout) clearTimeout(toastTimeout);
    successToast = msg;
    toastTimeout = setTimeout(() => {
      successToast = "";
    }, 3500);
  }

  function handleScroll(e) {
    const el = e.currentTarget;
    isScrolledEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
  }

  function getLessonHour(lesson) {
    if (lesson.timeSlotId && timeSlotsMap.has(lesson.timeSlotId)) {
      return timeSlotsMap.get(lesson.timeSlotId).numeroOra;
    }
    if (typeof lesson.numeroOra === "number") return lesson.numeroOra;
    if (lesson.timeSlotId) {
      const parts = lesson.timeSlotId.split("_");
      const idx = parseInt(parts[2], 10);
      if (!isNaN(idx)) return idx;
    }
    return 1;
  }

  // Costruzione matrice settimanale: 8 righe (ore 0..7), ciascuna con 5 giorni (0..4)
  $: weeklyGrid = Array.from({ length: 8 }, (_, hourIdx) => {
    return Array.from({ length: 5 }, (_, dayIdx) => {
      const dayNum = dayIdx + 1; // 1 = LUN, 5 = VEN
      return lessons.filter((l) => {
        const lGiorno = l.giorno;
        const lHour = getLessonHour(l);
        return lGiorno === dayNum && lHour === hourIdx + 1;
      });
    });
  });

  async function loadInternalTimetable() {
    if (!$userEmail || !$isTeacher) {
      loading = false;
      return;
    }

    loading = true;
    errorMessage = "";
    isUnauthorized = false;

    try {
      const data = await internalTimetableApi.getInternalTimetable();
      timetable = data.timetable || null;
      canWrite = data.canWrite !== false;
      lessons = Array.isArray(data.lessons) ? data.lessons : [];
      subjects = Array.isArray(data.subjects) ? data.subjects : [];
      classes = Array.isArray(data.classes) ? data.classes : [];
      teachers = Array.isArray(data.teachers) ? data.teachers : [];
      timeSlots = Array.isArray(data.timeSlots) ? data.timeSlots : [];

      subjectsMap = new Map(subjects.map((s) => [s.id, s]));
      classesMap = new Map(classes.map((c) => [c.id, c]));
      timeSlotsMap = new Map(timeSlots.map((ts) => [ts.id, ts]));

      hasSubsubjectsAdmitted = hasAdmitsSubsubjects(subjects);
      canEditInternalTimetable.set(hasSubsubjectsAdmitted);
    } catch (err) {
      console.error("Errore caricamento orario interno:", err);
      if (err.status === 401) {
        isUnauthorized = true;
        errorMessage =
          "Sessione scaduta o non valida per l'orario interno. Accedi nuovamente con il tuo account Google istituzionale.";
      } else if (err.status === 403) {
        errorMessage =
          "Accesso non consentito: verifica di utilizzare un account docente @lscortese.com attivo nell'orario scolastico.";
      } else {
        errorMessage =
          err.message || "Impossibile recuperare i dati dell'orario interno. Riprova più tardi.";
      }
    } finally {
      loading = false;
    }
  }

  function openAssignModal(lesson) {
    if (!canWrite) return;
    const parent = subjectsMap.get(lesson.subjectId);
    if (!parent || !parent.admitsSubsubjects) return;

    selectedLesson = lesson;
    modalParentSubject = parent;
    modalSubsubjects = (parent.subsubjectIds || [])
      .map((id) => subjectsMap.get(id) || { id, nome: id })
      .filter(Boolean);
    selectedSubsubjectId = lesson.subsubjectId || null;
    modalError = "";
    modalConflictNotice = "";
    isModalOpen = true;

    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  }

  function closeModal(force = false) {
    if (isSaving && !force) return;
    isModalOpen = false;
    selectedLesson = null;
    modalParentSubject = null;
    modalSubsubjects = [];
    modalError = "";
    modalConflictNotice = "";

    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  }

  function handleModalKeydown(e) {
    if (e.key === "Escape" && isModalOpen && !isSaving) {
      closeModal();
    }
  }

  async function handleSaveSubsubject() {
    if (!selectedLesson || isSaving) return;

    isSaving = true;
    modalError = "";
    modalConflictNotice = "";

    try {
      const res = await internalTimetableApi.assignSubsubject(
        selectedLesson.id,
        selectedSubsubjectId || null,
        selectedLesson.revision
      );

      const updatedItem = res?.item || {
        id: selectedLesson.id,
        revision: selectedLesson.revision + 1,
        subsubjectId: selectedSubsubjectId || null,
      };

      // Aggiorna array locale lessons
      lessons = lessons.map((l) =>
        l.id === updatedItem.id
          ? {
              ...l,
              revision: updatedItem.revision,
              subsubjectId: updatedItem.subsubjectId,
            }
          : l
      );

      const assignedName = updatedItem.subsubjectId
        ? subjectsMap.get(updatedItem.subsubjectId)?.nome || updatedItem.subsubjectId
        : modalParentSubject?.nome || "Materia principale";

      closeModal(true);
      showToast(`Ora aggiornata: ${assignedName}`);
    } catch (err) {
      console.error("Errore salvataggio sottomateria:", err);
      if (err.status === 409 && err.data?.current) {
        // Conflitto di concorrenza
        const current = err.data.current;
        selectedLesson = {
          ...selectedLesson,
          revision: current.revision,
          subsubjectId: current.subsubjectId,
        };
        // Aggiorna anche nella lista generale
        lessons = lessons.map((l) =>
          l.id === current.id
            ? { ...l, revision: current.revision, subsubjectId: current.subsubjectId }
            : l
        );
        selectedSubsubjectId = current.subsubjectId || null;
        modalConflictNotice =
          "L'ora è stata modificata da un'altra sessione: i dati sono stati sincronizzati con la versione più recente. Verifica e riprova.";
      } else {
        modalError =
          err.data?.message ||
          err.message ||
          "Errore durante l'assegnazione della sottomateria. Riprova.";
      }
    } finally {
      isSaving = false;
    }
  }

  onMount(() => {
    loadInternalTimetable();
  });

  onDestroy(() => {
    if (toastTimeout) clearTimeout(toastTimeout);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  });
</script>

<svelte:window on:keydown={handleModalKeydown} />

<svelte:head>
  <title>Orario Interno - WAY Cortese</title>
</svelte:head>

<div class="internal-timetable-page">
  <!-- Success Notification Toast -->
  {#if successToast}
    <div class="toast-notification" role="status" aria-live="polite">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
      <span>{successToast}</span>
    </div>
  {/if}

  {#if !$userEmail || !$isTeacher}
    <!-- Utente non autenticato o non docente -->
    <div class="auth-required-card">
      <div class="auth-icon-wrap" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h2>Accesso Riservato ai Docenti</h2>
      <p class="auth-desc">
        La gestione dell'orario interno e l'assegnazione delle sottomaterie è disponibile esclusivamente per i docenti autenticati con account istituzionale.
      </p>
      <a href="{base}/signin" class="btn-primary auth-btn">
        Accedi con Google
      </a>
    </div>
  {:else if loading}
    <!-- Caricamento -->
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Caricamento del tuo orario interno...</p>
    </div>
  {:else if isUnauthorized}
    <!-- Sessione scaduta / 401 -->
    <div class="auth-required-card">
      <div class="auth-icon-wrap warning" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2>Sessione da Rinnovare</h2>
      <p class="auth-desc">
        {errorMessage}
      </p>
      <a href="{base}/signin" class="btn-primary auth-btn">
        Riconnettiti con Google
      </a>
    </div>
  {:else if errorMessage}
    <!-- Errore Generico -->
    <div class="status-banner error">
      <span>{errorMessage}</span>
      <button type="button" class="retry-btn" on:click={loadInternalTimetable}>
        Riprova
      </button>
    </div>
  {:else}
    <!-- Header e Istruzioni Pagina -->
    <div class="page-header-card">
      <div class="header-main">
        <div class="header-title-row">
          <h1>Orario Interno</h1>
          {#if timetable?.nome}
            <span class="timetable-tag" title="Versione orario">{timetable.nome}</span>
          {/if}
        </div>
        <p class="header-desc">
          Seleziona un'ora con materia aggregata per specificare la sottomateria effettivamente svolta (es. Matematica o Fisica).
        </p>
      </div>

      {#if !canWrite}
        <div class="notice-badge readonly-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Modalità sola lettura per questo orario.</span>
        </div>
      {/if}

      {#if !hasSubsubjectsAdmitted}
        <div class="notice-badge info-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>Nessuna delle tue discipline ammette sottomaterie nell'orario pubblicato.</span>
        </div>
      {/if}
    </div>

    <!-- Tabella Settimanale Orario Interno -->
    <div
      class="table-scroll-container compact-scroll"
      class:scrolled-right={isScrolledEnd}
      on:scroll={handleScroll}
    >
      <table class="compact-timetable">
        <thead>
          <tr>
            <th class="col-hour fixed-col" scope="col">#</th>
            {#each weekdays as weekday}
              <th scope="col" class="weekday-header" class:is-today={weekday === currentDay}>
                <div class="weekday-cell">
                  <span class="weekday-short">{weekday}</span>
                  <span class="weekday-long">{weekdayFullNames[weekday]}</span>
                  {#if weekday === currentDay}
                    <span class="today-dot" title="Oggi"></span>
                  {/if}
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each { length: 8 } as _, hourIdx}
            {@const hourLabel = hours[hourIdx]}
            {@const isCurrentHourSlot = hourIdx === $clockStore.hourNum - 1}
            <tr class="compact-row">
              <!-- Sticky Colonna Ora -->
              <th class="hour-fixed-col" scope="row">
                <div class="hour-wrap">
                  <span class="hour-num">{hourIdx + 1}ª</span>
                  <span class="hour-time-label">{hourLabel}</span>
                </div>
              </th>

              <!-- Celle dei 5 Giorni -->
              {#each weekdays as weekday, dayIdx}
                {@const isToday = weekday === currentDay}
                {@const isActiveSlot = isCurrentHourSlot && isToday}
                {@const slotLessons = weeklyGrid[hourIdx][dayIdx] || []}

                <td
                  class="day-slot"
                  class:is-today={isToday}
                  class:is-active-slot={isActiveSlot}
                >
                  {#if slotLessons.length > 0}
                    <div class="slot-stack">
                      {#each slotLessons as lesson}
                        {@const parentSubject = subjectsMap.get(lesson.subjectId)}
                        {@const assignedSub = lesson.subsubjectId ? subjectsMap.get(lesson.subsubjectId) : null}
                        {@const className = classesMap.get(lesson.classId)?.nome || lesson.classId}
                        {@const isEditable = Boolean(parentSubject?.admitsSubsubjects && canWrite)}

                        {#if isEditable}
                          <button
                            type="button"
                            class="lesson-card editable-card"
                            class:has-subsubject={Boolean(lesson.subsubjectId)}
                            on:click={() => openAssignModal(lesson)}
                            title="Clicca per modificare la sottomateria"
                          >
                            <div class="card-top-row">
                              <span class="class-chip">{className}</span>
                              <span class="edit-pill">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                <span>Modifica</span>
                              </span>
                            </div>
                            <div class="subject-row">
                              {#if assignedSub}
                                <span class="subsubject-name" title="Sottomateria attiva: {assignedSub.nome}">
                                  {assignedSub.nome}
                                </span>
                                <span class="parent-muted">({parentSubject?.nome || lesson.subjectId})</span>
                              {:else}
                                <span class="main-subject-name" title="Materia aggregata non suddivisa">
                                  {parentSubject?.nome || lesson.subjectId}
                                </span>
                                <span class="not-set-badge">Non impostata</span>
                              {/if}
                            </div>
                          </button>
                        {:else}
                          <div class="lesson-card readonly-card">
                            <div class="card-top-row">
                              <span class="class-chip">{className}</span>
                            </div>
                            <div class="subject-row">
                              <span class="readonly-subject">
                                {parentSubject?.nome || lesson.subjectId}
                              </span>
                            </div>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {:else}
                    <div class="empty-slot" aria-hidden="true">—</div>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Modal di Assegnazione Sottomateria -->
{#if isModalOpen && selectedLesson && modalParentSubject}
  <div class="modal-backdrop" on:click={closeModal} role="presentation">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      on:click|stopPropagation
    >
      <div class="modal-header">
        <div class="modal-title-group">
          <h2 id="modal-title">Assegna Sottomateria</h2>
          <span class="modal-subtitle">
            {weekdayFullNames[weekdays[selectedLesson.giorno - 1]]} • {getLessonHour(selectedLesson)}ª ora • Classe {classesMap.get(selectedLesson.classId)?.nome || selectedLesson.classId}
          </span>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          aria-label="Chiudi finestra"
          disabled={isSaving}
          on:click={closeModal}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" fill="none">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="parent-subject-card">
          <span class="parent-card-label">Disciplina orario ufficiale</span>
          <span class="parent-card-name">{modalParentSubject.nome}</span>
        </div>

        {#if modalConflictNotice}
          <div class="conflict-alert" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>{modalConflictNotice}</span>
          </div>
        {/if}

        {#if modalError}
          <div class="modal-error-alert" role="alert">
            <span>{modalError}</span>
          </div>
        {/if}

        <fieldset class="subsubject-options-fieldset" disabled={isSaving}>
          <legend class="options-legend">Seleziona come registrare l'ora:</legend>

          <!-- Opzione Default: Materia Principale / Non impostata -->
          <label
            class="option-card"
            class:selected={selectedSubsubjectId === null}
          >
            <input
              type="radio"
              name="subsubject-choice"
              value=""
              checked={selectedSubsubjectId === null}
              on:change={() => (selectedSubsubjectId = null)}
            />
            <div class="option-content">
              <div class="option-title-row">
                <span class="option-name">Materia principale</span>
                <span class="option-tag default-tag">Predefinito</span>
              </div>
              <span class="option-desc">
                Nessuna suddivisione specifica ({modalParentSubject.nome})
              </span>
            </div>
          </label>

          <!-- Elenco Sottomaterie Ammesse -->
          {#each modalSubsubjects as sub}
            <label
              class="option-card"
              class:selected={selectedSubsubjectId === sub.id}
            >
              <input
                type="radio"
                name="subsubject-choice"
                value={sub.id}
                checked={selectedSubsubjectId === sub.id}
                on:change={() => (selectedSubsubjectId = sub.id)}
              />
              <div class="option-content">
                <div class="option-title-row">
                  <span class="option-name">{sub.nome || sub.id}</span>
                  <span class="option-tag sub-tag">Sottomateria</span>
                </div>
                <span class="option-desc">
                  Assegna specificamente quest'ora a {sub.nome || sub.id}
                </span>
              </div>
            </label>
          {/each}
        </fieldset>
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="btn-secondary"
          disabled={isSaving}
          on:click={closeModal}
        >
          Annulla
        </button>
        <button
          type="button"
          class="btn-primary"
          disabled={isSaving}
          on:click={handleSaveSubsubject}
        >
          {#if isSaving}
            <span class="btn-spinner"></span>
            <span>Salvataggio...</span>
          {:else}
            <span>Salva Modifica</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .internal-timetable-page {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    animation: fade-in 0.2s ease-out;
    padding-bottom: 2rem;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Toast notification */
  .toast-notification {
    position: fixed;
    top: 4.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: #059669;
    color: #ffffff;
    padding: 0.7rem 1.2rem;
    border-radius: 9999px;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
    animation: toast-in 0.25s ease-out;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translate(-50%, -10px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  /* Cards e Header */
  .page-header-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.1rem 1.25rem;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .header-main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .header-title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .header-title-row h1 {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .timetable-tag {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    border-radius: 9999px;
    background: var(--brand-surface-subtle);
    color: var(--brand-text-muted);
    border: 1px solid var(--brand-border);
  }

  .header-desc {
    font-size: 0.88rem;
    color: var(--brand-text-muted);
    margin: 0;
    line-height: 1.45;
  }

  .notice-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.8rem;
    border-radius: 8px;
    font-size: 0.82rem;
    line-height: 1.35;
  }

  .readonly-notice {
    background: rgba(234, 88, 12, 0.1);
    color: #c2410c;
    border: 1px solid rgba(234, 88, 12, 0.25);
  }

  .info-notice {
    background: rgba(37, 99, 235, 0.08);
    color: var(--brand-primary);
    border: 1px solid rgba(37, 99, 235, 0.2);
  }

  /* Auth Required Card */
  .auth-required-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 2.5rem 1.5rem;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    max-width: 480px;
    margin: 2rem auto;
  }

  .auth-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(37, 99, 235, 0.1);
    color: var(--brand-primary);
    margin-bottom: 1.25rem;
  }

  .auth-icon-wrap.warning {
    background: rgba(234, 88, 12, 0.12);
    color: #ea580c;
  }

  .auth-required-card h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: var(--brand-text);
  }

  .auth-desc {
    font-size: 0.92rem;
    color: var(--brand-text-muted);
    line-height: 1.5;
    margin: 0 0 1.5rem;
  }

  .auth-btn {
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 10px;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    gap: 1rem;
    color: var(--brand-text-muted);
    font-size: 0.95rem;
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--brand-border);
    border-top-color: var(--brand-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Status Banner */
  .status-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.9rem 1.1rem;
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .status-banner.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #ef4444;
  }

  .retry-btn {
    background: transparent;
    border: 1px solid currentColor;
    color: inherit;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  /* Compact Table Layout matching FullTimeTable */
  .compact-scroll {
    border-radius: 12px;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .compact-timetable {
    width: 100%;
    min-width: calc(680px * var(--table-font-scale, 1));
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    margin: 0;
    font-size: calc(0.9rem * var(--table-font-scale, 1));
  }

  thead {
    position: sticky;
    top: 0;
    inset-block-start: 0;
    z-index: 3;
    background: var(--brand-surface-subtle);
  }

  th {
    padding: 0.55rem 0.3rem;
    font-size: calc(0.875rem * var(--table-font-scale, 1));
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--brand-text-muted);
    border-bottom: 2px solid var(--brand-border);
    white-space: nowrap;
    text-align: center;
  }

  .col-hour {
    width: 48px;
    min-width: 48px;
    max-width: 48px;
    padding: 0.55rem 0.15rem;
  }

  .fixed-col {
    position: sticky;
    left: 0;
    inset-inline-start: 0;
    z-index: 4;
    background: var(--brand-surface-subtle);
  }

  .weekday-header {
    width: calc((100% - 48px) / 5);
    min-width: 110px;
    border-left: 1px solid var(--brand-border);
  }

  .weekday-header.is-today {
    color: var(--brand-primary);
    background: rgba(37, 99, 235, 0.06);
  }

  .weekday-cell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
  }

  .weekday-short {
    display: none;
  }

  @media (max-width: 768px) {
    .weekday-long {
      display: none;
    }
    .weekday-short {
      display: inline;
    }
  }

  .today-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--brand-primary);
  }

  .compact-row {
    border-bottom: 1px solid var(--brand-border);
  }

  .compact-row:last-child {
    border-bottom: none;
  }

  .hour-fixed-col {
    position: sticky;
    left: 0;
    inset-inline-start: 0;
    z-index: 2;
    background: var(--brand-surface-subtle);
    border-bottom: 1px solid var(--brand-border);
    border-right: 1px solid var(--brand-border);
    padding: 0.5rem 0.15rem;
    text-align: center;
    vertical-align: middle;
  }

  .hour-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }

  .hour-num {
    font-size: calc(0.95rem * var(--table-font-scale, 1));
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1;
  }

  .hour-time-label {
    font-size: calc(0.68rem * var(--table-font-scale, 1));
    color: var(--brand-text-muted);
    line-height: 1;
  }

  .day-slot {
    padding: 0.35rem;
    vertical-align: top;
    border-left: 1px solid var(--brand-border);
    border-bottom: 1px solid var(--brand-border);
    background: var(--brand-surface-card);
    transition: background-color 0.15s ease;
  }

  .day-slot.is-today {
    background: rgba(37, 99, 235, 0.025);
  }

  .day-slot.is-active-slot {
    background: var(--brand-active-glow);
  }

  .slot-stack {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    height: 100%;
  }

  .empty-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 48px;
    color: var(--brand-text-muted);
    opacity: 0.4;
    font-weight: 500;
  }

  /* Lesson Card */
  .lesson-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.45rem 0.5rem;
    border-radius: 8px;
    border: 1px solid var(--brand-border);
    background: var(--brand-surface);
    text-align: left;
    width: 100%;
    box-sizing: border-box;
    transition: all 0.15s ease;
  }

  .editable-card {
    cursor: pointer;
    border-color: rgba(37, 99, 235, 0.35);
    background: var(--brand-surface);
  }

  .editable-card:hover,
  .editable-card:focus-visible {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 2px var(--brand-active-glow);
    transform: translateY(-1px);
  }

  .editable-card.has-subsubject {
    border-color: rgba(16, 185, 129, 0.5);
    background: rgba(16, 185, 129, 0.04);
  }

  .card-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.3rem;
  }

  .class-chip {
    font-size: calc(0.75rem * var(--table-font-scale, 1));
    font-weight: 700;
    color: var(--brand-text);
    background: var(--brand-surface-subtle);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    border: 1px solid var(--brand-border);
  }

  .edit-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: calc(0.68rem * var(--table-font-scale, 1));
    font-weight: 600;
    color: var(--brand-primary);
  }

  .subject-row {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-height: 2.1em;
    justify-content: center;
  }

  .subsubject-name {
    font-size: calc(0.82rem * var(--table-font-scale, 1));
    font-weight: 700;
    color: #059669;
    line-height: 1.25;
  }

  :global([data-theme="dark"]) .subsubject-name {
    color: #34d399;
  }

  .parent-muted {
    font-size: calc(0.68rem * var(--table-font-scale, 1));
    color: var(--brand-text-muted);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .main-subject-name {
    font-size: calc(0.8rem * var(--table-font-scale, 1));
    font-weight: 600;
    color: var(--brand-text);
    line-height: 1.25;
  }

  .not-set-badge {
    font-size: calc(0.65rem * var(--table-font-scale, 1));
    color: #d97706;
    font-weight: 600;
  }

  .readonly-card {
    opacity: 0.85;
    background: var(--brand-surface-subtle);
  }

  .readonly-subject {
    font-size: calc(0.8rem * var(--table-font-scale, 1));
    font-weight: 500;
    color: var(--brand-text-muted);
  }

  /* Modal Dialog */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: fade-in 0.15s ease-out;
  }

  .modal-dialog {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1.2rem 1.4rem;
    border-bottom: 1px solid var(--brand-border);
  }

  .modal-title-group {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .modal-title-group h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .modal-subtitle {
    font-size: 0.85rem;
    color: var(--brand-text-muted);
    font-weight: 500;
  }

  .modal-close-btn {
    background: transparent;
    border: none;
    color: var(--brand-text-muted);
    cursor: pointer;
    padding: 0.35rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
  }

  .modal-close-btn:hover {
    background: var(--brand-surface-subtle);
    color: var(--brand-text);
  }

  .modal-body {
    padding: 1.25rem 1.4rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .parent-subject-card {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
  }

  .parent-card-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--brand-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .parent-card-name {
    font-size: 1rem;
    font-weight: 700;
    color: var(--brand-text);
  }

  .conflict-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    background: rgba(234, 88, 12, 0.12);
    border: 1px solid rgba(234, 88, 12, 0.3);
    color: #ea580c;
    font-size: 0.88rem;
    line-height: 1.4;
  }

  :global([data-theme="dark"]) .conflict-alert {
    color: #fb923c;
  }

  .modal-error-alert {
    padding: 0.8rem 1rem;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #ef4444;
    font-size: 0.88rem;
  }

  .subsubject-options-fieldset {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .options-legend {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--brand-text);
    margin-bottom: 0.4rem;
  }

  .option-card {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    border: 1.5px solid var(--brand-border);
    background: var(--brand-surface);
    cursor: pointer;
    min-height: 48px;
    box-sizing: border-box;
    transition: all 0.15s ease;
  }

  .option-card:hover {
    border-color: var(--brand-primary);
  }

  .option-card.selected {
    border-color: var(--brand-primary);
    background: rgba(37, 99, 235, 0.05);
    box-shadow: 0 0 0 1px var(--brand-primary);
  }

  .option-card input[type="radio"] {
    margin-top: 0.2rem;
    width: 18px;
    height: 18px;
    accent-color: var(--brand-primary);
    cursor: pointer;
  }

  .option-content {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
  }

  .option-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .option-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--brand-text);
  }

  .option-tag {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 9999px;
  }

  .default-tag {
    background: var(--brand-surface-subtle);
    color: var(--brand-text-muted);
    border: 1px solid var(--brand-border);
  }

  .sub-tag {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.25);
  }

  :global([data-theme="dark"]) .sub-tag {
    color: #34d399;
  }

  .option-desc {
    font-size: 0.82rem;
    color: var(--brand-text-muted);
    line-height: 1.35;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.4rem;
    border-top: 1px solid var(--brand-border);
    background: var(--brand-surface-subtle);
  }

  .btn-primary {
    background: var(--brand-primary);
    color: #ffffff;
    border: none;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.15s ease;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--brand-primary-hover);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: transparent;
    border: 1px solid var(--brand-border);
    color: var(--brand-text);
    padding: 0.65rem 1.1rem;
    border-radius: 8px;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--brand-surface);
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
</style>
