# Supabase Auth email templates — GHBucketlist

Paste these into **Supabase Dashboard → Authentication → Email Templates**. Each template has a
**Subject** and an **HTML body**. Supabase fills in `{{ .ConfirmationURL }}` with the action link.

> Requires Custom SMTP configured (Authentication → Emails → SMTP) so these send from
> `GHBucketlist <noreply@ghbucketlist.com>` instead of Supabase's default sender.

Available variables: `{{ .ConfirmationURL }}` (the action link), `{{ .SiteURL }}`, `{{ .Email }}`,
`{{ .Token }}` / `{{ .TokenHash }}` (OTP code, if you use code-based flows).

---

## 1. Confirm signup

**Subject:** `Confirm your GHBucketlist email`

```html
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f7f9;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:#0F766E;padding:20px 24px;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.2px;">GHBucketlist</span>
    </div>
    <div style="padding:28px 24px;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">Confirm your email</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
        Welcome to GHBucketlist — your home for stays, activities, car rentals and trusted local
        services across Ghana. Confirm your email address to finish setting up your account.
      </p>
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0F766E;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">Confirm email</a>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
        Button not working? Copy and paste this link into your browser:<br>
        <a href="{{ .ConfirmationURL }}" style="color:#0F766E;word-break:break-all;">{{ .ConfirmationURL }}</a>
      </p>
      <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
        If you didn’t create a GHBucketlist account, you can safely ignore this email.
      </p>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #eef0f2;background:#fafafa;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">GHBucketlist · Accra, Ghana</p>
    </div>
  </div>
</div>
```

---

## 2. Reset password

**Subject:** `Reset your GHBucketlist password`

```html
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f7f9;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:#0F766E;padding:20px 24px;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.2px;">GHBucketlist</span>
    </div>
    <div style="padding:28px 24px;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">Reset your password</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
        We received a request to reset the password for your GHBucketlist account. Choose a new
        password using the button below.
      </p>
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0F766E;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">Reset password</a>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
        Button not working? Copy and paste this link into your browser:<br>
        <a href="{{ .ConfirmationURL }}" style="color:#0F766E;word-break:break-all;">{{ .ConfirmationURL }}</a>
      </p>
      <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
        This link expires in 60 minutes. If you didn’t request a reset, you can ignore this email —
        your password won’t change.
      </p>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #eef0f2;background:#fafafa;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">GHBucketlist · Accra, Ghana</p>
    </div>
  </div>
</div>
```

---

## 3. Magic Link

**Subject:** `Your GHBucketlist sign-in link`

```html
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f7f9;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:#0F766E;padding:20px 24px;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.2px;">GHBucketlist</span>
    </div>
    <div style="padding:28px 24px;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">Your sign-in link</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
        Tap the button below to sign in to your GHBucketlist account — no password needed.
      </p>
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0F766E;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">Sign in to GHBucketlist</a>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
        Button not working? Copy and paste this link into your browser:<br>
        <a href="{{ .ConfirmationURL }}" style="color:#0F766E;word-break:break-all;">{{ .ConfirmationURL }}</a>
      </p>
      <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
        This link expires shortly and can only be used once. If you didn’t request it, you can
        ignore this email.
      </p>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #eef0f2;background:#fafafa;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">GHBucketlist · Accra, Ghana</p>
    </div>
  </div>
</div>
```
