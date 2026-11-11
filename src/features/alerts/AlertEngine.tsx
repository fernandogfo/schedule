import { useEffect, useRef } from 'react';
import { getCargoPlan, getCargoTargetTime, getServer } from '../../lib/cargo';
import { getCategory, filterTimersByRegion } from '../../lib/schedule';
import {
  getReminderMessage,
  getStartMessage,
  getVyravaReminderMessage,
  getVyravaStartMessage,
} from '../../lib/messages';
import { getNextOccurrence, getPreviousOccurrence, isDue } from '../../lib/time';
import { getVyravaItemState, getVyravaKey } from '../../lib/vyrava';
import { DAYLIGHT_SAVING_MINUTES } from '../../lib/constants';
import {
  CARGO_PANEL_KEY,
  VYRAVA_PANEL_KEY,
  hasDiscordWebhooks,
  resolveWebhookUrls,
} from '../../lib/discord';
import { sendDiscordMessage } from '../../services/discordService';
import { useSchedule } from '../../state/ScheduleProvider';
import { useAudioCues } from '../audio/AudioProvider';
import { useSpeech } from '../speech/SpeechProvider';

export function AlertEngine() {
  const {
    data,
    events,
    cargoShip,
    now,
    preferences,
    alertSelections,
    speakSelections,
    vyravaTimers,
    discordWebhooks,
  } = useSchedule();
  const { playCue } = useAudioCues();
  const { supported, speak } = useSpeech();
  const firedRef = useRef(new Set<string>());
  const lastTickRef = useRef<number | null>(null);
  const discordActive = hasDiscordWebhooks(discordWebhooks);

  useEffect(() => {
    if (!data || !cargoShip) return;

    const nowMs = now.valueOf();
    const previousTickMs = lastTickRef.current ?? nowMs;
    lastTickRef.current = nowMs;
    const offsetMinutes = preferences.daylightSaving ? DAYLIGHT_SAVING_MINUTES : 0;
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

    const notifyDiscord = (alertKey: string, categoryKey: string, message: string) => {
      if (!discordActive) return;
      resolveWebhookUrls(discordWebhooks, alertKey, categoryKey).forEach((url) => {
        sendDiscordMessage(url, message);
      });
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

        const previous = getPreviousOccurrence(timer, now, offsetMinutes);
        const next = getNextOccurrence(timer, now, offsetMinutes);

        selectedOptions.forEach((option) => {
          if (option.kind === 'start') {
            if (!previous) return;
            const targetMs = previous.start.valueOf();
            if (!isDue(targetMs, previousTickMs, nowMs)) return;

            const key = `${event.id}:${timer.id}:${previous.start.toISOString()}:${option.id}`;
            if (!markFired(key)) return;

            triggerCue(
              option.cueId ?? category?.startCueId ?? 'start',
            );
            const message = getStartMessage(event, category, timer, previous, now);
            if (wantsSpeech) messages.push(message);
            notifyDiscord(event.id, event.categoryId, message);
            return;
          }

          if (!next) return;
          const targetMs = next.start.subtract(option.leadSeconds, 'second').valueOf();
          if (!isDue(targetMs, previousTickMs, nowMs)) return;

          const key = `${event.id}:${timer.id}:${next.start.toISOString()}:${option.id}`;
          if (!markFired(key)) return;

          triggerCue(
            option.cueId ?? category?.reminderCueId ?? 'reminder',
          );
          const message = getReminderMessage(
            event,
            category,
            timer,
            next,
            now,
            option.leadSeconds,
          );
          if (wantsSpeech) messages.push(message);
          notifyDiscord(event.id, event.categoryId, message);
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
              if (!isDue(targetMs, previousTickMs, nowMs)) return;

              const key = `${cargoKey}:${step.step.id}:${step.start.toISOString()}:${alert.id}`;
              if (!markFired(key)) return;

              triggerCue(alert.cueId ?? 'ship_leaving');
              const message = alert.speech || alert.name;
              if (wantsSpeech && alert.speech) messages.push(alert.speech);
              notifyDiscord(cargoKey, CARGO_PANEL_KEY, message);
            });
          });
        }
      }
    }

    const vyravaSection = data.vyrava;
    if (vyravaSection.enabled) {
      vyravaSection.items.forEach((item) => {
        const alertKey = getVyravaKey(item.id);
        const selected = alertSelections[alertKey] ?? [];
        if (selected.length === 0) return;

        const startedAt = vyravaTimers[item.id];
        const state = getVyravaItemState(vyravaSection, item, startedAt, now);
        if (!state.startedAt || !state.end) return;

        const selectedOptions = data.alerts.options.filter((option) =>
          selected.includes(option.id),
        );
        if (selectedOptions.length === 0) return;

        const wantsSpeech = supported && speakSelections[alertKey] === true;
        const end = state.end;

        selectedOptions.forEach((option) => {
          if (option.kind === 'start') {
            const targetMs = end.valueOf();
            if (!isDue(targetMs, previousTickMs, nowMs)) return;

            const key = `${alertKey}:${startedAt}:${option.id}`;
            if (!markFired(key)) return;

            triggerCue(option.cueId ?? vyravaSection.startCueId ?? 'start');
            const message = getVyravaStartMessage(vyravaSection, item);
            if (wantsSpeech) messages.push(message);
            notifyDiscord(alertKey, VYRAVA_PANEL_KEY, message);
            return;
          }

          const targetMs = end.subtract(option.leadSeconds, 'second').valueOf();
          if (!isDue(targetMs, previousTickMs, nowMs)) return;

          const key = `${alertKey}:${startedAt}:${option.id}`;
          if (!markFired(key)) return;

          triggerCue(option.cueId ?? vyravaSection.reminderCueId ?? 'reminder');
          const message = getVyravaReminderMessage(
            vyravaSection,
            item,
            option.leadSeconds,
          );
          if (wantsSpeech) messages.push(message);
          notifyDiscord(alertKey, VYRAVA_PANEL_KEY, message);
        });
      });
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
    discordActive,
    discordWebhooks,
    events,
    now,
    playCue,
    preferences.cargoServerId,
    preferences.daylightSaving,
    preferences.region,
    speak,
    speakSelections,
    supported,
    vyravaTimers,
  ]);

  return null;
}
