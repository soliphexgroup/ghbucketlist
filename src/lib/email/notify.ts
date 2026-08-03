// Fire-and-forget triggers for transactional emails. Called after a successful action; failures
// are swallowed so email never affects the user's flow.

async function post(url: string, body: Record<string, unknown>) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // ignore — email is best-effort
  }
}

export function notifyBooking(reference: string) {
  return post("/api/notify/booking", { reference });
}

export function notifyHostApplication(applicationId: string) {
  return post("/api/notify/host-application", { applicationId });
}

export function notifyPayout(payoutId: string) {
  return post("/api/notify/payout", { payoutId });
}
