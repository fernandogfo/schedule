import { useEffect, useRef } from 'react';
import { getCargoPlan, getCargoTargetTime, getServer } from '../../lib/cargo';
import { getCategory, filterTimersByRegion } from '../../lib/schedule';
import { getReminderMessage, getStartMessage } from '../../lib/messages';
import { getNextOccurrence, getPreviousOccurrence } from '../../lib/time';
import { useSchedule } from '../../state/ScheduleProvider';
import { useAudioCues } from '../audio/AudioProvider';
import { useSpeech } from '../speech/SpeechProvider';

const TOLERANCE_MS = 2600;

export function AlertEngine() {
  const {
    data,
    events,
    cargoShip,
    now,
    preferences,
    alertSelections,
    speakSelections,
  } = useSchedule();
  const { playCue } = useAudioCues();
  const { supported, speak } = useSpeech();
  const firedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!data || !cargoShip) return;

    const nowMs = now.valueOf();
    const cueById = new Map(data.cues.map((cue) => [cue.id, cue]));
    let bestCue: string | null = null;
    let bestPriority = -1;
    const messages: string[] = [];

    const markFired = (key: string): boolean => {
      if (firedRef.current.has(key)) return false;
      if (firedRef.current.size > 4000) firedRef.current.clear();
      firedRef.current.add(key);
      return true;
    };

    const triggerCue = (cueId: string | undefined) => {
      if (!cueId) return;
      const cue = cueById.get(cueId);
      if (!cue) return;
      if (cue.priority > bestPriority) {
        bestPriority = cue.priority;
        bestCue = cue.id;
      }
    };

    events.forEach((event) => {
      if (event.disabled) return;
      const selected = alertSelections[event.id] ?? [];
      if (selected.length === 0) return;

      const category = getCategory(data.categories, event.categoryId);
      const timers = filterTimersByRegion(event.timers, preferences.region);
      const wantsSpeech = supported && speakSelections[event.id] === true;

      timers.forEach((timer) => {
        const selectedOptions = data.alerts.options.filter((option) =>
          selected.includes(option.id),
        );
        if (selectedOptions.length === 0) return;

        const previous = getPreviousOccurrence(timer, now);
        const next = getNextOccurrence(timer, now);

        selectedOptions.forEach((option) => {
          if (option.kind === 'start') {
            if (!previous) return;
            const targetMs = previous.start.valueOf();
            const delta = nowMs - targetMs;
            if (delta < 0 || delta > TOLERANCE_MS) return;

            const key = `${event.id}:${timer.id}:${previous.start.toISOString()}:${option.id}`;
            if (!markFired(key)) return;

            triggerCue(
              option.cueId ?? category?.startCueId ?? 'start',
            );
            if (wantsSpeech) {
              messages.push(
                getStartMessage(event, category, timer, previous, now),
              );
            }
            return;
          }

          if (!next) return;
          const targetMs = next.start.subtract(option.leadSeconds, 'second').valueOf();
          const delta = nowMs - targetMs;
          if (delta < 0 || delta > TOLERANCE_MS) return;

          const key = `${event.id}:${timer.id}:${next.start.toISOString()}:${option.id}`;
          if (!markFired(key)) return;

          triggerCue(
            option.cueId ?? category?.reminderCueId ?? 'reminder',
          );
          if (wantsSpeech) {
            messages.push(
              getReminderMessage(event, category, timer, next, now, option.leadSeconds),
            );
          }
        });
      });
    });

    const cargoKey = `cargo:${preferences.cargoServerId}`;
    const cargoAlerts = alertSelections[cargoKey] ?? [];
    if (cargoAlerts.length > 0) {
      const server = getServer(cargoShip, preferences.cargoServerId);
      if (server && server.timer) {
        const plan = getCargoPlan(cargoShip, server, now);
        if (plan.current && !plan.stale) {
          const candidates = plan.previous
            ? [plan.previous, ...plan.steps]
            : plan.steps;
          const wantsSpeech = supported && speakSelections[cargoKey] === true;

          cargoAlerts.forEach((alertId) => {
            const alert = cargoShip.alerts.find((item) => item.id === alertId);
            if (!alert) return;

            candidates.forEach((step) => {
              if (step.step.id !== alert.stepId) return;
              const targetMs = getCargoTargetTime(alert, step).valueOf();
              const delta = nowMs - targetMs;
              if (delta < 0 || delta > TOLERANCE_MS) return;

              const key = `${cargoKey}:${step.step.id}:${step.start.toISOString()}:${alert.id}`;
              if (!markFired(key)) return;

              triggerCue(alert.cueId ?? 'ship_leaving');
              if (wantsSpeech && alert.speech) messages.push(alert.speech);
            });
          });
        }
      }
    }

    if (bestCue) playCue(bestCue);
    if (messages.length > 0) {
      window.setTimeout(() => {
        messages.forEach((message) => speak(message));
      }, bestCue ? 500 : 0);
    }
  }, [
    alertSelections,
    cargoShip,
    data,
    events,
    now,
    playCue,
    preferences.cargoServerId,
    preferences.region,
    speak,
    speakSelections,
    supported,
  ]);

  return null;
}
