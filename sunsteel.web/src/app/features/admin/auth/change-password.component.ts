import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { apiError } from '../../../core/models/api.model';
import { AuthService } from '../../../core/services/auth.service';
import { SeoService } from '../../../core/services/seo.service';

/**
 * Shown straight after sign-in when the account has a temporary password, and reachable
 * from the admin header at any time. The API ends every session on success, so the user
 * signs in again with the new password.
 */
@Component({
  selector: 'ss-change-password',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm flex min-h-svh items-center justify-center p-6">
      <form class="card grid w-full max-w-[420px] gap-4" (ngSubmit)="submit()" novalidate>
        <div>
          <h1 class="text-[22px] font-medium">{{ forced() ? 'Choose your own password' : 'Change password' }}</h1>
          <p class="mt-1 text-[13.5px] text-[#6B7485]">
            @if (forced()) { You signed in with a temporary password. Set a new one to continue. }
            @else { You'll be signed out everywhere and asked to sign in again. }
          </p>
        </div>
        <label class="alabel">{{ forced() ? 'Temporary password' : 'Current password' }}
          <input class="ainput" type="password" name="current" autocomplete="current-password" [(ngModel)]="current" />
        </label>
        <label class="alabel">New password
          <input class="ainput" type="password" name="next" autocomplete="new-password" [(ngModel)]="next" />
          <span class="ahint">At least 8 characters.</span>
        </label>
        <label class="alabel">Repeat new password
          <input class="ainput" type="password" name="repeat" autocomplete="new-password" [(ngModel)]="repeat" />
        </label>
        @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
        @if (done()) { <p class="alert alert-ok" role="status">Password changed. Taking you to sign in…</p> }
        <div class="flex justify-end gap-2">
          @if (!forced()) { <button type="button" class="abtn" (click)="cancel()">Cancel</button> }
          <button class="abtn abtn-pri" type="submit" [disabled]="busy() || done()">Save password</button>
        </div>
      </form>
    </div>`,
})
export class ChangePasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected current = '';
  protected next = '';
  protected repeat = '';
  protected readonly busy = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal('');
  protected readonly forced = computed(() => this.auth.mustChangePassword());

  constructor() {
    inject(SeoService).set({ title: "Change password | Sun Steel Traders admin", path: '/admin/change-password', noindex: true });
  }

  protected submit(): void {
    if (this.next.length < 8) return this.error.set('Use at least 8 characters for your new password.');
    if (this.next !== this.repeat) return this.error.set('The two new passwords don’t match.');
    this.busy.set(true);
    this.error.set('');
    this.auth.changePassword(this.current, this.next).subscribe({
      next: () => {
        this.done.set(true);
        this.auth.clearSession();
        setTimeout(() => this.router.navigate(['/admin/login']), 1200);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(apiError(e));
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/admin']);
  }
}
